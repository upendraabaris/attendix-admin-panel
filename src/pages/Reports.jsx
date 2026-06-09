import * as React from "react";
import ReactDOM from "react-dom";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfQuarter, subQuarters, endOfQuarter } from "date-fns";
import { Calendar as CalendarIcon, Download, FileBarChart, Clock, Users, ChevronDown, Check, Eye, X, Briefcase, TreePalm, AlertCircle, Loader2 } from "lucide-react";
import api from "../hooks/useApi";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Layout from "../components/Layout";
import { Input } from "../components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { toast } from "sonner";
// import { useNavigate } from "react-router-dom";
import { useSearchParams, useNavigate } from "react-router-dom";


// ─── Preset Definitions ─────────────────────────────────────────────────────
const today = () => new Date();

const PRESETS = [
    {
        label: "Today",
        getValue: () => {
            const d = today();
            return { start: d, end: d }
        }
    },
    {
        label: "Yesterday",
        getValue: () => {
            const d = subDays(today(), 1);
            return { start: d, end: d }
        }
    },
    {
        label: "Last 7 Days",
        getValue: () => ({ start: subDays(today(), 6), end: today() }),
    },
    {
        label: "Last 15 Days",
        getValue: () => ({ start: subDays(today(), 14), end: today() })
    },
    {
        label: "Last 30 Days",
        getValue: () => ({ start: subDays(today(), 29), end: today() })
    },
    {
        label: "This Week",
        getValue: () => ({
            start: startOfWeek(today(), { weekStartsOn: 1 }),
            end: today(),
        })
    },
    {
        label: "Last Week",
        getValue: () => ({
            start: startOfWeek(subDays(today(), 7), { weekStartsOn: 1 }),
            end: subDays(today(), 1),
        })
    },
    {
        label: "This Month",
        getValue: () => ({
            start: startOfMonth(today()),
            end: today(),
        })
    },
    {
        label: "Last Month",
        getValue: () => {
            const last = subMonths(today(), 1);
            return { start: startOfMonth(last), end: endOfMonth(last) };
        },
    },
    {
        label: "Last 3 Months",
        getValue: () => ({ start: subDays(today(), 89), end: today() }),
    },
    {
        label: "This Quarter",
        getValue: () => ({ start: startOfQuarter(today()), end: today() }),
    },
    {
        label: "Last Quarter",
        getValue: () => {
            const last = subQuarters(today(), 1);
            return { start: startOfQuarter(last), end: endOfQuarter(last) };
        },
    },
    {
        label: "Custom Range",
        getValue: () => null, // handled manually
    },
]

function formatDate(date) {
    return format(date, "yyyy-MM-dd");
}

function downloadCSV(report) {
    const lines = [];
    lines.push(`Report Period,${format(report.start, "yyyy-MM-dd")} to ${format(report.end, "yyyy-MM-dd")}`);
    lines.push(`Total Working Days,${report.workingDays}`);
    lines.push(`Total Holidays,${report.holidays}`);
    lines.push(`Weekend Offs,${report.weekendOffs}`);
    // lines.push(`Total Leaves,${report.totalLeaves || 0}`);
    lines.push("");
    // lines.push("Employee Name,Total Working Days,Actual Working Days,Leaves Taken,Holidays");
    lines.push("Employee Name,Total Working Days,Actual Working Days,Extra Days Worked,Leaves Taken,Holidays");
    report.rows.forEach((r) => {
        lines.push(`${r.name},${r.totalWorkingDays},${r.actualWorkingDays},${r.nonWorkingDaysWorked},${r.leaves || 0},${r.holidays}`);
    });

    report.rows.forEach((r) => {
        lines.push(`${r.name},${r.totalWorkingDays},${r.actualWorkingDays},${r.leaves || 0},${r.holidays}`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${format(report.start, "yyyyMMdd")}-${format(report.end, "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}


// ─── Preset Dropdown Component ───────────────────────────────────────────────
// Uses fixed positioning so the dropdown is NEVER clipped by any parent's overflow:hidden

function PresetDropdown({ selectedPreset, onSelect }) {
    const [open, setOpen] = React.useState(false);
    const [dropdownPos, setDropdownPos] = React.useState({ top: 0, left: 0 });
    const triggerRef = React.useRef(null);
    const dropdownRef = React.useRef(null);

    // Calculate where to place the dropdown based on the trigger button's position on screen
    function openDropdown() {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 8, left: rect.left });
        }
        setOpen(true);
    }

    // Close only when clicking OUTSIDE both the trigger AND the portal dropdown
    // Note: portal is in document.body so triggerRef alone won't cover it
    React.useEffect(() => {
        if (!open) return;
        function handleClick(e) {
            const clickedTrigger = triggerRef.current?.contains(e.target);
            const clickedDropdown = dropdownRef.current?.contains(e.target);
            if (!clickedTrigger && !clickedDropdown) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    return (
        <div ref={triggerRef} className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => open ? setOpen(false) : openDropdown()}
                className={cn(
                    "flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-semibold transition-all",
                    "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50/50",
                    open && "border-blue-500 ring-2 ring-blue-100"
                )}
            >
                <CalendarIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>{selectedPreset || "Select Period"}</span>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", open && "rotate-180")} />
            </button>

            {/* Portal dropdown — renders in document.body to escape overflow:hidden on Card */}
            {open && typeof document !== "undefined" && ReactDOM.createPortal(
                <div
                    ref={dropdownRef}
                    style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999, maxHeight: "260px", overflowY: "auto" }}
                    className="w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5"
                >
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => { onSelect(preset); setOpen(false); }}
                            className={cn(
                                "w-full text-left px-4 py-2 text-sm font-medium transition-colors flex items-center justify-between",
                                selectedPreset === preset.label
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {preset.label}
                            {selectedPreset === preset.label && (
                                <Check className="w-3.5 h-3.5 text-blue-500" />
                            )}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
}

// ─── Detail Popup Component ──────────────────────────────────────────────────
function DetailPopup({ open, onClose, title, color, icon, data, loading }) {
    // Trap close on Escape
    React.useEffect(() => {
        if (!open) return;
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    if (!open) return null;

    const colorMap = {
        purple: { bg: "bg-purple-500", light: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-100 text-purple-700 border border-purple-200" },
        rose: { bg: "bg-rose-500", light: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", badge: "bg-rose-100 text-rose-700 border border-rose-200" },
        yellow: { bg: "bg-yellow-500", light: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
        amber: { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-700 border border-amber-200" },
    };
    const c = colorMap[color] || colorMap.purple;

    const formatDisplayDate = (dateStr) => {
        try {
            const [y, m, d] = dateStr.split("-");
            const dt = new Date(Number(y), Number(m) - 1, Number(d));
            return dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
        } catch { return dateStr; }
    };

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                style={{ maxHeight: "80vh", animation: "popupIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
                {/* Header */}
                <div className={`${c.bg} px-6 py-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                            {icon}
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm tracking-tight">{title}</p>
                            <p className="text-white/70 text-[11px]">{loading ? "Loading..." : `${data?.length || 0} record${data?.length !== 1 ? "s" : ""} found`}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 80px)" }}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className={`w-8 h-8 animate-spin ${c.text}`} />
                            <p className="text-slate-400 text-sm">Fetching details...</p>
                        </div>
                    ) : !data || data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className={`w-14 h-14 rounded-2xl ${c.light} flex items-center justify-center`}>
                                <AlertCircle className={`w-7 h-7 ${c.text} opacity-50`} />
                            </div>
                            <p className="text-slate-400 text-sm font-medium">No records found for this period</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-50">
                            {data.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-4 px-6 py-3.5 hover:bg-slate-50/60 transition-colors">
                                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${c.bg} mt-2`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-700 font-semibold text-sm">
                                            {formatDisplayDate(item.date)}
                                        </p>
                                        {(item.reason || item.type || item.name) && (
                                            <p className="text-slate-400 text-xs mt-0.5">
                                                {item.name || item.type}{item.reason ? ` — ${item.reason}` : ""}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                                        {item.reason || item.type || ""}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes popupIn {
                    from { opacity: 0; transform: scale(0.88) translateY(16px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
}

export default function Reports() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // 1. Initial State from URL or default
    const [startDate, setStartDate] = React.useState(
        searchParams.get("start") || formatDate(subDays(new Date(), 29))
    );
    const [endDate, setEndDate] = React.useState(
        searchParams.get("end") || formatDate(new Date())
    );

    const [selectedPreset, setSelectedPreset] = React.useState("Last 30 Days");
    const [isCustom, setIsCustom] = React.useState(false);
    const [report, setReport] = React.useState(null);
    const [isGenerating, setIsGenerating] = React.useState(false);

    // Popup state
    const [popup, setPopup] = React.useState({ open: false, title: "", color: "purple", icon: null, data: [], loading: false });

    const openPopup = async (row, type) => {
        const configs = {
            extraDays: { title: `Extra Days Worked — ${row.name}`, color: "purple", icon: <Briefcase className="w-4 h-4" />, dataKey: "extraDays" },
            leaves: { title: `Leaves Taken — ${row.name}`, color: "rose", icon: <TreePalm className="w-4 h-4" />, dataKey: "leaves" },
            unpaidLeaves: { title: `Unpaid Leaves — ${row.name}`, color: "yellow", icon: <AlertCircle className="w-4 h-4" />, dataKey: "unpaidLeaves" },
            holidays: { title: `Holidays — ${row.name}`, color: "amber", icon: <CalendarIcon className="w-4 h-4" />, dataKey: "holidays" },
        };
        const cfg = configs[type];
        setPopup({ open: true, title: cfg.title, color: cfg.color, icon: cfg.icon, data: [], loading: true });
        try {
            const res = await api.get("/reports/employee-details", {
                params: { employeeId: row.employee_id, startDate, endDate }
            });
            if (res.data.statusCode === 200) {
                // setPopup(prev => ({ ...prev, loading: false, data: res.data.data[cfg.dataKey] || [] }));
                let popupData = res.data.data[cfg.dataKey] || [];

                if (type === "leaves") {
                    popupData = popupData.filter(
                        item => item.type?.toLowerCase() !== "unpaid"
                    );
                }

                setPopup(prev => ({
                    ...prev,
                    loading: false,
                    data: popupData
                }));
            } else {
                setPopup(prev => ({ ...prev, loading: false, data: [] }));
            }
        } catch {
            setPopup(prev => ({ ...prev, loading: false, data: [] }));
        }
    };

    const closePopup = () => setPopup(prev => ({ ...prev, open: false }));

    // 2. Extracted Fetch Logic
    const fetchReportData = async (start, end) => {
        setIsGenerating(true);
        try {
            const res = await api.get(`/reports/attendance-summary`, {
                params: { startDate: start, endDate: end }
            });

            if (res.data.statusCode === 200) {
                setReport({
                    ...res.data.data.summary,
                    rows: res.data.data.rows,
                    start: new Date(start),
                    end: new Date(end)
                });
            } else {
                toast.error(res.data.message || "Failed to generate report");
            }
        } catch (error) {
            console.error("Report Fetch Error:", error);
            const errMsg = error.response?.data?.message || "An error occurred while calling the API";
            toast.error(errMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    // 3. React to URL Changes
    React.useEffect(() => {
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        if (start && end) {
            fetchReportData(start, end);
            // Sync state with URL if they differ (e.g., direct navigation)
            setStartDate(start);
            setEndDate(end);
        }
    }, [searchParams]);

    const handlePresetSelect = (preset) => {
        setSelectedPreset(preset.label);
        if (preset.label === "Custom Range") {
            setIsCustom(true);
        } else {
            const range = preset.getValue();
            setStartDate(formatDate(range.start));
            setEndDate(formatDate(range.end));
            setIsCustom(false);
        }
    };

    const handleCustomDateChange = (field, value) => {
        if (field === "start") setStartDate(value);
        if (field === "end") setEndDate(value);
        setSelectedPreset("Custom Range");
        setIsCustom(true);
    };

    // Derive a readable label for the selected range
    const rangeLabel = React.useMemo(() => {
        if (!startDate || !endDate) return null;
        const s = new Date(startDate);
        const e = new Date(endDate);
        if (format(s, "yyyy-MM-dd") === format(e, "yyyy-MM-dd")) {
            return format(s, "dd MMM yyyy");
        }
        return `${format(s, "dd MMM yyyy")} – ${format(e, "dd MMM yyyy")}`;
    }, [startDate, endDate]);


    const handleGenerate = () => {
        if (!startDate || !endDate) {
            toast.error("Please select both start and end dates");
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            toast.error("End date must be after start date");
            return;
        }

        // Just update URL params - useEffect handles the fetching
        setSearchParams({ start: startDate, end: endDate });
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* --- Header Section --- */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg shadow-blue-500/10 text-white"
                            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}
                        >
                            <FileBarChart className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Organization Reports</h1>
                            <p className="text-slate-400 text-sm font-medium">Analytics & Attendance Insights</p>
                        </div>
                    </div>
                </header>

                {/* --- Filters Section --- */}
                <Card className="border border-slate-200/60 shadow-sm bg-white overflow-hidden rounded-xl">
                    <CardHeader className="pb-3 pt-5 border-b border-slate-50">
                        <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                            Report Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-6">
                        <div className="flex flex-wrap gap-4 items-end">

                            {/* Preset Picker */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">
                                    Quick Select
                                </label>
                                <PresetDropdown
                                    selectedPreset={selectedPreset}
                                    onSelect={handlePresetSelect}
                                />
                            </div>

                            {/* Divider */}
                            <div className="flex items-end pb-2.5">
                                <span className="text-slate-300 font-light text-lg select-none">|</span>
                            </div>

                            {/* Date Inputs — always visible, editable for custom */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">
                                    Start Date
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={e => handleCustomDateChange("start", e.target.value)}
                                    className="h-10 border-slate-200 focus:ring-blue-500 rounded-lg text-slate-600 w-44"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">
                                    End Date
                                </label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={e => handleCustomDateChange("end", e.target.value)}
                                    className="h-10 border-slate-200 focus:ring-blue-500 rounded-lg text-slate-600 w-44"
                                />
                            </div>

                            {/* Generate Button */}
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className={cn(
                                    "h-10 px-8 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 rounded-lg",
                                    isGenerating ? "opacity-70" : "hover:shadow-blue-500/20"
                                )}
                                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none" }}
                            >
                                {isGenerating ? "Generating..." : "Generate Analysis"}
                            </Button>
                        </div>

                        {/* Selected range display */}
                        {rangeLabel && (
                            <p className="mt-4 text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />
                                Showing data for: <span className="text-slate-600 font-bold">{rangeLabel}</span>
                                {selectedPreset && selectedPreset !== "Custom Range" && (
                                    <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">
                                        {selectedPreset}
                                    </span>
                                )}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* --- Report Results --- */}
                {report ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

                        {/* KPI Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    title: "Working Days",
                                    value: report.workingDays,
                                    icon: <Clock className="w-4 h-4 text-blue-500" />,
                                    bg: "bg-blue-50",
                                    indicator: "bg-blue-500"
                                },
                                // {
                                //     title: "Leaves Taken",
                                //     value: report.totalLeaves || 0,
                                //     icon: <Users className="w-4 h-4 text-rose-500" />,
                                //     bg: "bg-rose-50",
                                //     indicator: "bg-rose-500"
                                // },
                                {
                                    title: "Total Holidays",
                                    value: report.holidays,
                                    icon: <CalendarIcon className="w-4 h-4 text-amber-500" />,
                                    bg: "bg-amber-50",
                                    indicator: "bg-amber-500"
                                },
                                {
                                    title: "Weekend Offs",
                                    value: report.weekendOffs,
                                    icon: <CalendarIcon className="w-4 h-4 text-indigo-500" />,
                                    bg: "bg-indigo-50",
                                    indicator: "bg-indigo-500"
                                }
                            ].map((kpi, idx) => (
                                <Card key={idx} className="border border-slate-200/60 shadow-sm bg-white rounded-xl overflow-hidden group">
                                    <CardContent className="p-5 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                {kpi.title}
                                            </p>
                                            <p className="text-3xl font-extrabold text-slate-800 tracking-tight">
                                                {kpi.value}
                                            </p>
                                        </div>
                                        <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center", kpi.bg)}>
                                            {kpi.icon}
                                        </div>
                                    </CardContent>
                                    <div className="px-5 pb-1.5">
                                        <div className={cn("h-1 w-full rounded-full opacity-20", kpi.indicator)} />
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Data Table Card */}
                        <Card className="border border-slate-200/60 shadow-sm bg-white overflow-hidden rounded-xl">
                            <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-slate-50">
                                <CardTitle className="text-base font-bold text-slate-700">Detailed Breakdown</CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadCSV(report)}
                                    className="border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-bold h-8 transition-colors"
                                >
                                    <Download className="mr-2 h-3.5 w-3.5" />
                                    Export CSV
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50">
                                            <TableRow className="border-b border-slate-100">
                                                <TableHead className="py-3 font-bold text-slate-500 pl-6 text-[10px] uppercase tracking-wider">Employee</TableHead>
                                                <TableHead className="text-center py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Total Working Days</TableHead>
                                                <TableHead className="text-center py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Actual Working Days</TableHead>
                                                <TableHead className="text-center py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Extra Days Worked</TableHead>
                                                <TableHead className="text-center py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Leaves Taken</TableHead>

                                                <TableHead className="text-center py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                                                    Unpaid Leave
                                                </TableHead>
                                                <TableHead className="text-right py-3 font-bold text-slate-500 pr-6 text-[10px] uppercase tracking-wider">Holidays</TableHead>
                                                {/* <TableHead className="text-center py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Break Details</TableHead> */}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {report.rows.map((r) => (
                                                <TableRow key={r.name} className="hover:bg-slate-50/50 transition-colors border-b last:border-0 border-slate-50">
                                                    <TableCell className="py-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">
                                                                {r.name.charAt(0)}
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-sm tracking-tight">{r.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[11px] border border-emerald-100/50">
                                                            {r.totalWorkingDays} Days
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold text-[11px] border border-blue-100/50">
                                                            {r.actualWorkingDays} Days
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <button
                                                            onClick={() => r.nonWorkingDaysWorked > 0 && openPopup(r, "extraDays")}
                                                            title={r.nonWorkingDaysWorked > 0 ? "Click to see dates" : ""}
                                                            className={`px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-100/50 transition-all ${r.nonWorkingDaysWorked > 0 ? "cursor-pointer hover:bg-purple-100 hover:scale-105 hover:shadow-md" : "opacity-60 cursor-default"
                                                                }`}
                                                        >
                                                            {r.nonWorkingDaysWorked} Days
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <button
                                                            // onClick={() => (r.leaves || 0) > 0 && openPopup(r, "leaves")}
                                                            onClick={() => Math.max((r.leaves || 0) - (r.unpaidLeaves || 0), 0) > 0 && openPopup(r, "leaves")}
                                                            title={(r.leaves || 0) > 0 ? "Click to see dates" : ""}
                                                            className={`px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-bold text-[11px] border border-rose-100/50 transition-all ${(r.leaves || 0) > 0 ? "cursor-pointer hover:bg-rose-100 hover:scale-105 hover:shadow-md" : "opacity-60 cursor-default"
                                                                }`}
                                                        >
                                                            {/* {r.leaves || 0} Days */}
                                                            {Math.max((r.leaves || 0) - (r.unpaidLeaves || 0), 0)} Days
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <button
                                                            onClick={() => (r.unpaidLeaves || 0) > 0 && openPopup(r, "unpaidLeaves")}
                                                            title={(r.unpaidLeaves || 0) > 0 ? "Click to see dates" : ""}
                                                            className={`px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 font-bold text-[11px] border border-yellow-100/50 transition-all ${(r.unpaidLeaves || 0) > 0 ? "cursor-pointer hover:bg-yellow-100 hover:scale-105 hover:shadow-md" : "opacity-60 cursor-default"
                                                                }`}
                                                        >
                                                            {r.unpaidLeaves || 0} Days
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <button
                                                            onClick={() => r.holidays > 0 && openPopup(r, "holidays")}
                                                            title={r.holidays > 0 ? "Click to see dates" : ""}
                                                            className={`text-amber-600 font-semibold text-sm transition-all ${r.holidays > 0 ? "cursor-pointer hover:text-amber-700 hover:underline" : "text-slate-500 cursor-default"
                                                                }`}
                                                        >
                                                            {r.holidays} Days
                                                        </button>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/reports/breaks/${r.employee_id}?start=${startDate}&end=${endDate}&name=${r.name}`)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0 rounded-full"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>

                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner">
                            <FileBarChart className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-slate-400">No report generated</p>
                            <p className="text-slate-400 text-xs px-10">Select date range above to view insights.</p>
                        </div>
                    </div>
                )}
            </div>
            <DetailPopup
                open={popup.open}
                onClose={closePopup}
                title={popup.title}
                color={popup.color}
                icon={popup.icon}
                data={popup.data}
                loading={popup.loading}
            />
        </Layout>
    );
}