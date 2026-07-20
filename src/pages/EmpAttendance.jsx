import { useEffect, useMemo, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { useParams, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ClipboardList,
  Clock,
  AlertTriangle,
  UserCircle2,
  CalendarDays,
  Pencil,
  X,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Coffee,
  Briefcase,
} from "lucide-react";
import api from "../hooks/useApi";
import { toast } from "sonner";

const formatDateOnly = (value) => {
  if (!value) return null;

  const rawValue = String(value).trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(rawValue);
  if (isDateOnly) {
    return rawValue;
  }

  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(parsed);
};

const formatCompOffReason = (reason) => {
  if (reason === "weekly_off") return "Weekly Off";
  if (reason === "holiday") return "Holiday";
  return "Comp Off";
};

const parseWorkedHours = (workedTime) => {
  if (!workedTime || workedTime === "N/A") return -1;
  if (workedTime === "Missing Clock Out" || workedTime.includes("Invalid time")) {
    return -2;
  }
  const hMatch = workedTime.match(/(\d+)h/);
  const mMatch = workedTime.match(/(\d+)m/);
  const h = hMatch ? parseInt(hMatch[1]) : 0;
  const m = mMatch ? parseInt(mMatch[1]) : 0;
  return h + m / 60;
};

const HOUR_12_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const getTwelveHourParts = (timeValue = "18:00") => {
  const [hourRaw = "18", minute = "00"] = String(timeValue).split(":");
  const parsedHour = Number.parseInt(hourRaw, 10);

  if (Number.isNaN(parsedHour)) {
    return { hour12: "06", minute: "00", meridiem: "PM" };
  }

  const meridiem = parsedHour >= 12 ? "PM" : "AM";
  const normalizedHour = parsedHour % 12 || 12;

  return {
    hour12: String(normalizedHour).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
    meridiem,
  };
};

const build24HourTime = (hour12, minute, meridiem) => {
  const parsedHour = Number.parseInt(hour12, 10);
  if (Number.isNaN(parsedHour)) {
    return "18:00";
  }

  let hour24 = parsedHour % 12;
  if (meridiem === "PM") {
    hour24 += 12;
  }

  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const formatTime12Hour = (timeValue) => {
  if (!timeValue) return "";
  const { hour12, minute, meridiem } = getTwelveHourParts(timeValue);
  return `${hour12}:${minute} ${meridiem}`;
};

const getStatusCell = (workedTime) => {
  if (workedTime === "Missing Clock Out") {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs">
        <AlertTriangle className="w-3.5 h-3.5" />
        Missing Clock Out
      </span>
    );
  }
  if (workedTime && workedTime.includes("Invalid time")) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs">
        <AlertTriangle className="w-3.5 h-3.5" />
        Invalid Time
      </span>
    );
  }
  if (!workedTime || workedTime === "N/A") {
    return <span className="text-gray-400 text-sm">—</span>;
  }
  return (
    <Badge className="bg-green-100 text-green-800 border border-green-200 whitespace-nowrap font-medium">
      {workedTime}
    </Badge>
  );
};

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) {
    return <ChevronsUpDown className="w-3.5 h-3.5 ml-1 inline opacity-40" />;
  }
  return sortConfig.direction === "asc" ? (
    <ChevronUp className="w-3.5 h-3.5 ml-1 inline text-indigo-600" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 ml-1 inline text-indigo-600" />
  );
};

// ─── Clock-Out Edit Modal ────────────────────────────────────────────────────
function ClockOutEditModal({ open, onClose, record, employeeId, employeeName, onSuccess }) {
  const [clockOutTime, setClockOutTime] = useState("18:00");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setClockOutTime("18:00");
      setRemark("");
      setDone(false);
      setSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !record) return null;

  // workDate from record.date (YYYY-MM-DD)
  const workDate = record.date
    ? (() => {
        const d = new Date(record.date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      })()
    : null;

  const displayDate = record.date
    ? new Date(record.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const { hour12, minute, meridiem } = getTwelveHourParts(clockOutTime);

  const handleClockOutTimePartChange = (part, value) => {
    const nextParts = {
      hour12,
      minute,
      meridiem,
      [part]: value,
    };
    setClockOutTime(
      build24HourTime(nextParts.hour12, nextParts.minute, nextParts.meridiem),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clockOutTime) {
      toast.error("Please enter clock-out time");
      return;
    }
    if (!workDate) {
      toast.error("Invalid date on record");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/attendance/admin/update-clockout", {
        employeeId,
        workDate,
        clockOutTime,
        remark: remark.trim() || undefined,
      });
      if (res.data.statusCode === 200) {
        setDone(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        toast.error(res.data.message || "Failed to update clock-out");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        style={{ animation: "slideUpIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-tight">Update Clock-Out</p>
              <p className="text-white/75 text-[11px] mt-0.5">{employeeName} · {displayDate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {done ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <p className="text-slate-700 font-bold text-base">Clock-Out Updated!</p>
              <p className="text-slate-400 text-sm text-center">The attendance record has been updated successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Clock-in info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clock-In Time</p>
                  <p className="text-slate-700 font-bold text-sm font-mono">{record.clock_in || "—"}</p>
                </div>
              </div>

              {/* Clock-out time input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  Clock-Out Time <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    ref={inputRef}
                    value={hour12}
                    onChange={(e) =>
                      handleClockOutTimePartChange("hour12", e.target.value)
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  >
                    {HOUR_12_OPTIONS.map((hourOption) => (
                      <option key={hourOption} value={hourOption}>
                        {hourOption}
                      </option>
                    ))}
                  </select>
                  <select
                    value={minute}
                    onChange={(e) =>
                      handleClockOutTimePartChange("minute", e.target.value)
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  >
                    {MINUTE_OPTIONS.map((minuteOption) => (
                      <option key={minuteOption} value={minuteOption}>
                        {minuteOption}
                      </option>
                    ))}
                  </select>
                  <select
                    value={meridiem}
                    onChange={(e) =>
                      handleClockOutTimePartChange("meridiem", e.target.value)
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-400">
                  Selected time:{" "}
                  <span className="font-semibold text-slate-600">
                    {formatTime12Hour(clockOutTime)}
                  </span>
                </p>
              </div>

              {/* Remark input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                  Admin Remark <span className="text-slate-300 font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="e.g. Employee forgot to clock out, verified via camera..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-white resize-none placeholder:text-slate-300"
                />
              </div>

              {/* Warning note */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 text-xs leading-relaxed">
                  This action will <strong>permanently add</strong> a clock-out record for this date. Make sure the time is correct before submitting.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm hover:from-orange-600 hover:to-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save Clock-Out
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <style>{`
          @keyframes slideUpIn {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
function EmpAttendance() {
  const { id } = useParams();
  const location = useLocation();
  const employeeName = location.state?.name || "Unknown";

  const getFirstDayOfMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  };

  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [filters, setFilters] = useState({
    startDate: getFirstDayOfMonth(),
    endDate: getToday(),
  });
  const [attendance, setAttendance] = useState([]);
  const [compOffHistoryMap, setCompOffHistoryMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "asc",
  });

  // Modal state
  const [editModal, setEditModal] = useState({ open: false, record: null });

  const orgID = localStorage.getItem("orgID");

  const fetchCompOffHistory = async () => {
    if (!id) {
      setCompOffHistoryMap({});
      return;
    }

    try {
      const res = await api.get(`/comp-off/history/${id}`);
      const nextMap = {};

      (res?.data?.data || []).forEach((item) => {
        const workDate = formatDateOnly(item.work_date);
        if (!workDate) return;
        nextMap[workDate] = item;
      });

      setCompOffHistoryMap(nextMap);
    } catch (error) {
      console.error("Error fetching comp off history:", error);
      setCompOffHistoryMap({});
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/admin/all-employee-attendance`, {
        params: {
          employeeId: id,
          startDate: filters.startDate,
          endDate: filters.endDate,
          organizationId: orgID,
        },
      });
      setAttendance(res.data.data || []);
      await fetchCompOffHistory();
    } catch (err) {
      console.error("Error fetching employee attendance:", err);
      setCompOffHistoryMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && orgID) fetchAttendance();
  }, [filters, id, orgID]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const sorted = useMemo(() => {
    return [...attendance].sort((a, b) => {
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      switch (sortConfig.key) {
        case "date":
          return dir * (new Date(a.date) - new Date(b.date));
        case "clock_in":
          return dir * (a.clock_in || "").localeCompare(b.clock_in || "");
        case "clock_out":
          return dir * (a.clock_out || "").localeCompare(b.clock_out || "");
        default:
          return 0;
      }
    });
  }, [attendance, sortConfig]);

  const getCompOffEntry = (record) => {
    const workDate = formatDateOnly(record.date);
    if (!workDate) {
      return null;
    }
    return compOffHistoryMap[workDate] || null;
  };

  const totalHours = useMemo(
    () =>
      attendance
        .reduce((total, record) => {
          const hours = parseWorkedHours(record.worked_time);
          return total + (hours > 0 ? hours : 0);
        }, 0)
        .toFixed(1),
    [attendance],
  );

  const missingCount = attendance.filter(
    (record) => record.worked_time === "Missing Clock Out",
  ).length;

  const compOffCount = useMemo(
    () => sorted.filter((record) => Boolean(getCompOffEntry(record))).length,
    [sorted, compOffHistoryMap],
  );

  const SortableHead = ({ column, label }) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      onClick={() => handleSort(column)}
    >
      {label}
      <SortIcon column={column} sortConfig={sortConfig} />
    </TableHead>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50">
            <UserCircle2 className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{employeeName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Attendance Records</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-indigo-50">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{attendance.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Records</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-green-50">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalHours}h</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Hours Worked</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-amber-50">
              <CalendarDays className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{compOffCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Comp Off Earned Days</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{missingCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Missing Clock Outs</p>
            </div>
          </div>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 font-medium">Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 font-medium">End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading attendance records...</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No records found</p>
              <p className="text-xs mt-1">Try adjusting the date range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="w-10 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      #
                    </TableHead>
                    <SortableHead column="date" label="Date" />
                    <SortableHead column="clock_in" label="Clock In" />
                    <SortableHead column="clock_out" label="Clock Out" />
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Comp Off
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Clock In Address
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Clock Out Address
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Admin Remark
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((record, index) => {
                    const isMissing = record.worked_time === "Missing Clock Out";
                    const compOffEntry = getCompOffEntry(record);

                    return (
                      <TableRow
                        key={index}
                        className={
                          isMissing
                            ? "bg-red-50/40 hover:bg-red-50/70"
                            : "hover:bg-gray-50/60"
                        }
                      >
                        <TableCell className="text-center text-gray-400 text-xs font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium text-sm text-gray-900">
                          {record.date
                            ? new Date(record.date).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-sm text-gray-700">
                          {record.clock_in || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-sm text-gray-700">
                          {record.clock_out || (
                            <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              Missing
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusCell(record.worked_time)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {compOffEntry ? (
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap font-medium">
                              {formatCompOffReason(compOffEntry.reason)}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 min-w-[200px] whitespace-normal break-words">
                          {record.clock_in_address || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 min-w-[200px] whitespace-normal break-words">
                          {record.clock_out_address || "—"}
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          {record.admin_remark ? (
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-0.5">
                                <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                              </div>
                              <span className="text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg leading-relaxed font-medium break-words">
                                {record.admin_remark}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isMissing ? (
                            <button
                              onClick={() => setEditModal({ open: true, record })}
                              title="Add missing clock-out"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 text-xs font-semibold hover:bg-orange-100 hover:border-orange-300 active:scale-95 transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Fix
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Clock-Out Edit Modal */}
      <ClockOutEditModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, record: null })}
        record={editModal.record}
        employeeId={id}
        employeeName={employeeName}
        onSuccess={fetchAttendance}
      />
    </Layout>
  );
}

export default EmpAttendance;
