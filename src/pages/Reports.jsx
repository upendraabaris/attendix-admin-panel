import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, FileBarChart, Clock, Users } from "lucide-react";
import api from "../hooks/useApi";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
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

// Mock holidays within range
const HOLIDAYS = [
    "2025-01-01",
    "2025-01-26",
    "2025-03-14",
    "2025-08-15",
    "2025-10-02",
    "2025-12-25",
    "2026-01-01",
    "2026-01-26",
];

const EMPLOYEES = [
    "Aarav Sharma",
    "Priya Patel",
    "Rohan Mehta",
    "Sneha Iyer",
    "Vikram Singh",
    "Ananya Reddy",
    "Karan Kapoor",
    "Meera Nair",
];

function DatePicker({
    date,
    onChange,
    placeholder,
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal border-slate-200 hover:bg-slate-50",
                        !date && "text-slate-400",
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={onChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                />
            </PopoverContent>
        </Popover>
    );
}

/* --- Report Calculation Logic --- */
function computeReport(startStr, endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);

    const days = differenceInCalendarDays(end, start) + 1;
    let weekendOffs = 0;
    let holidays = 0;
    let workingDays = 0;
    const holidaySet = new Set(HOLIDAYS);

    for (let i = 0; i < days; i++) {
        const d = addDays(start, i);
        const key = format(d, "yyyy-MM-dd");
        if (isWeekend(d)) weekendOffs++;
        else if (holidaySet.has(key)) holidays++;
        else workingDays++;
    }

    const rows = EMPLOYEES.map((name) => {
        const leave = Math.floor(Math.random() * 3);
        return {
            name,
            workingDays: Math.max(0, workingDays - leave),
            holidays,
        };
    });

    return { start, end, workingDays, holidays, weekendOffs, rows };
}

function downloadCSV(report) {
    const lines = [];
    lines.push(`Report Period,${format(report.start, "yyyy-MM-dd")} to ${format(report.end, "yyyy-MM-dd")}`);
    lines.push(`Total Working Days,${report.workingDays}`);
    lines.push(`Total Holidays,${report.holidays}`);
    lines.push(`Weekend Offs,${report.weekendOffs}`);
    lines.push(`Total Leaves,${report.totalLeaves || 0}`);
    lines.push("");
    lines.push("Employee Name,Working Days,Leaves Taken,Holidays");
    report.rows.forEach((r) => {
        lines.push(`${r.name},${r.workingDays},${r.leaves || 0},${r.holidays}`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${format(report.start, "yyyyMMdd")}-${format(report.end, "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Reports() {
    const [startDate, setStartDate] = React.useState("");
    const [endDate, setEndDate] = React.useState("");
    const [report, setReport] = React.useState(null);
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleGenerate = async () => {
        if (!startDate || !endDate) {
            toast.error("Please select both start and end dates");
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            toast.error("End date must be after start date");
            return;
        }

        setIsGenerating(true);
        try {
            // ✅ Using the standard api hook
            const res = await api.get(`/reports/attendance-summary`, {
                params: { startDate, endDate }
            });
            
            if (res.data.statusCode === 200) {
                setReport({
                    ...res.data.data.summary,
                    rows: res.data.data.rows,
                    start: new Date(startDate),
                    end: new Date(endDate)
                });
                toast.success("Report generated successfully");
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
                        <div className="grid gap-6 md:grid-cols-[1fr_1fr_auto] items-end">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">Start Date</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="h-10 border-slate-200 focus:ring-blue-500 rounded-lg text-slate-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">End Date</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="h-10 border-slate-200 focus:ring-blue-500 rounded-lg text-slate-600"
                                />
                            </div>
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
                                {
                                    title: "Leaves Taken",
                                    value: report.totalLeaves || 0,
                                    icon: <Users className="w-4 h-4 text-rose-500" />,
                                    bg: "bg-rose-50",
                                    indicator: "bg-rose-500"
                                },
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
                                                <TableHead className="text-center py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Working Days</TableHead>
                                                <TableHead className="text-center py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Leaves Taken</TableHead>
                                                <TableHead className="text-right py-3 font-bold text-slate-500 pr-6 text-[10px] uppercase tracking-wider">Holidays</TableHead>
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
                                                            {r.workingDays} Days
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-bold text-[11px] border border-rose-100/50">
                                                            {r.leaves || 0} Days
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <span className="text-slate-500 font-semibold text-sm">{r.holidays} Days</span>
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
        </Layout>
    );
}


