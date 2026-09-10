import { useCallback, useEffect, useState } from "react";
import { Calendar, Clock, MapPin, LogIn, LogOut, Coffee, Briefcase } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import api from "../hooks/useApi";
import { toast } from "sonner";
import Layout from "./Layout";

const getFirstDayOfMonth = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
};

const getToday = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
};

const TEAM_ATTENDANCE_MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Display-only formatter for Team Attendance's raw "YYYY-MM-DD" date string
// (as returned by GET /attendance/team) into "Jun 1, 2026". Pure string
// reformatting — does NOT parse via `new Date()` (avoids any timezone
// shift), does not touch the API/backend date format, and has no effect on
// date filtering/query params.
const formatTeamAttendanceDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr));
  if (!match) return dateStr;
  const [, year, month, day] = match;
  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) return dateStr;
  return `${TEAM_ATTENDANCE_MONTH_ABBR[monthIndex]} ${Number(day)}, ${year}`;
};

const getOptionalCoords = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 0, longitude: 0, tracked: false });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          tracked: true,
        });
      },
      () => resolve({ latitude: 0, longitude: 0, tracked: false }),
      { timeout: 5000, maximumAge: 0, enableHighAccuracy: false }
    );
  });

function StatusBadge({ clockIn, clockOut }) {
  if (!clockIn) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      Absent
    </span>
  );
  if (clockIn && !clockOut) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
      Active
    </span>
  );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
      Present
    </span>
  );
}

function EmployeeAttendanceTab() {
  const employeeId = localStorage.getItem("employee_id");
  const [filters, setFilters] = useState({
    startDate: getFirstDayOfMonth(),
    endDate: getToday(),
  });
  const [attendance, setAttendance] = useState([]);
  const [breakSummaryMap, setBreakSummaryMap] = useState({});
  const [breaksList, setBreaksList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [isManager, setIsManager] = useState(false);
  // Authorized direct-report options for the Team Attendance employee
  // filter — sourced only from /attendance/team's own `directReports` field
  // (the manager's own manager_id + organization_id scoped team), never from
  // the full organization employee list.
  const [directReports, setDirectReports] = useState([]);
  const [selectedTeamEmployeeId, setSelectedTeamEmployeeId] = useState("");
  const [activeAttendanceTab, setActiveAttendanceTab] = useState("my");
  const [expectedClockInTime, setExpectedClockInTime] = useState(null);

  const fetchBreakSummary = useCallback(async () => {
    if (!employeeId) return;
    try {
      const res = await api.get(`/break/attendance-summary/${employeeId}`, {
        params: { startDate: filters.startDate, endDate: filters.endDate },
      });
      setBreakSummaryMap(res?.data?.data || {});
      setBreaksList(res?.data?.breaks || []);
    } catch (err) {
      console.error("Error fetching break summary:", err);
    }
  }, [employeeId, filters.startDate, filters.endDate]);

  const fetchMyAttendance = useCallback(async () => {
    if (!employeeId) { setAttendance([]); return; }
    try {
      setLoading(true);
      const res = await api.get("/attendance/admin/get-particular-attendance", {
        params: { employeeId, startDate: filters.startDate, endDate: filters.endDate },
      });
      setAttendance(res?.data?.data || []);
      await fetchBreakSummary();
    } catch (error) {
      console.error("Error fetching my attendance:", error);
      toast.error("Unable to fetch attendance");
    } finally {
      setLoading(false);
    }
  }, [employeeId, filters.startDate, filters.endDate, fetchBreakSummary]);

  const checkLocationEnabled = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationEnabled(false);
      return false;
    }

    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        if (permission.state === "denied") {
          setLocationEnabled(false);
          return false;
        }
      } catch {
        // ignore permission query failures and fallback to direct geolocation test
      }
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationEnabled(true);
          resolve(true);
        },
        () => {
          setLocationEnabled(false);
          resolve(false);
        },
        { timeout: 5000, maximumAge: 0, enableHighAccuracy: false }
      );
    });
  }, []);

  useEffect(() => {
    checkLocationEnabled();
  }, [checkLocationEnabled]);

  useEffect(() => {
    let permissionStatus = null;

    const subscribePermissionChange = async () => {
      if (!navigator.permissions) return;
      try {
        permissionStatus = await navigator.permissions.query({ name: "geolocation" });
        permissionStatus.onchange = () => {
          setLocationEnabled(permissionStatus.state === "granted");
        };
      } catch {
        // ignore unsupported permissions API
      }
    };

    subscribePermissionChange();

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  useEffect(() => { fetchMyAttendance(); }, [fetchMyAttendance]);

  useEffect(() => {
    if (!employeeId) return;
    const fetchExpectedClockInTime = async () => {
      try {
        const res = await api.get(`/employee/getEmployeeById/${employeeId}`);
        setExpectedClockInTime(res?.data?.expected_clock_in_time || null);
      } catch (err) {
        console.error("Error fetching expected clock-in time:", err);
      }
    };
    fetchExpectedClockInTime();
  }, [employeeId]);

  const fetchTeamAttendance = useCallback(async () => {
    try {
      const res = await api.get("/attendance/team", {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          // Omitted entirely when "All Employees" is selected — backend
          // treats a missing/empty employeeId as "whole team".
          ...(selectedTeamEmployeeId ? { employeeId: selectedTeamEmployeeId } : {}),
        },
      });
      setTeamAttendance(res?.data?.data || []);
      setDirectReports(res?.data?.directReports || []);
      // isManager reflects whether the caller has ≥1 direct report — NOT
      // whether any team attendance rows exist in the selected date range.
      // A manager whose reports haven't clocked in yet still has a team.
      setIsManager(Boolean(res?.data?.isManager));
    } catch (error) {
      console.error("Error fetching team attendance:", error);
      setTeamAttendance([]);
      setIsManager(false);
    }
  }, [filters.startDate, filters.endDate, selectedTeamEmployeeId]);

  useEffect(() => { fetchTeamAttendance(); }, [fetchTeamAttendance]);

  const handleClockAction = async (type) => {
    try {
      setActionLoading(type);
      const coords = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          return reject(new Error("Geolocation is not supported."));
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (err) => {
            reject(err);
          },
          { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
        );
      });

      setLocationEnabled(true);
      const endpoint = type === "in" ? "/attendance/clock-in" : "/attendance/clock-out";
      const res = await api.post(endpoint, { latitude: coords.latitude, longitude: coords.longitude });
      toast.success(res?.data?.message || "Attendance updated");
      fetchMyAttendance();
    } catch (error) {
      if (error?.code === 1 || error?.code === 2 || error?.code === 3) {
        setLocationEnabled(false);
        return toast.error("Location access is required to mark attendance");
      }
      console.error("Clock action failed:", error);
      toast.error(error?.response?.data?.message || "Unable to update attendance");
    } finally {
      setActionLoading("");
    }
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  const isClockedIn = attendance.some(
    (r) => r.date === todayStr && r.clock_in && !r.clock_out
  );

  const formatLateDuration = (diffMinutes) => {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (hours <= 0) return `${mins} minute${mins === 1 ? "" : "s"}`;
    if (mins === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
    return `${hours} hour${hours === 1 ? "" : "s"} ${mins} minute${mins === 1 ? "" : "s"}`;
  };

  // Parses the already-displayed "h:mm AM/PM" clock-in string (the same
  // value rendered in the attendance list below) into minutes-since-midnight.
  // Comparing against this — rather than any raw UTC/ISO timestamp — keeps
  // the late check in the exact same local time the attendance UI shows.
  const parseDisplayedTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const match = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/.exec(String(timeStr).trim());
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3].toLowerCase();
    if (hours === 12) hours = 0;
    if (meridiem === "pm") hours += 12;

    return hours * 60 + minutes;
  };

  const getLateClockInMessage = () => {
    if (!expectedClockInTime) return null;
    const todayRecord = attendance.find((r) => r.date === todayStr && r.clock_in);
    if (!todayRecord) return null;

    const [expHours, expMinutes] = expectedClockInTime.split(":").map(Number);
    if (Number.isNaN(expHours) || Number.isNaN(expMinutes)) return null;

    const actualMinutesOfDay = parseDisplayedTimeToMinutes(todayRecord.clock_in);
    if (actualMinutesOfDay === null) return null;

    const expectedMinutesOfDay = expHours * 60 + expMinutes;
    const diff = actualMinutesOfDay - expectedMinutesOfDay;

    if (diff <= 0) return null;
    return `You clocked in late by ${formatLateDuration(diff)}`;
  };

  const lateClockInMessage = getLateClockInMessage();

  const formatDurationSeconds = (totalSecs) => {
    const secs = Math.max(0, Math.floor(totalSecs));
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;

    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
    parts.push(`${remainingSecs}s`);
    return parts.join(" ");
  };

  const getSessionBreakSeconds = (record) => {
    if (!record || (!record.raw_clock_in && !record.clock_in)) return 0;

    const sStart = new Date(record.raw_clock_in || record.clock_in).getTime();
    if (isNaN(sStart)) return 0;

    const hasClockOut = !!(record.raw_clock_out || record.clock_out);
    let sEnd;
    if (hasClockOut) {
      sEnd = new Date(record.raw_clock_out || record.clock_out).getTime();
    } else {
      // No clock-out: cap to end of the clock-in day (23:59:59 IST)
      // This prevents breaks from future days leaking into this session
      const clockInDate = new Date(record.raw_clock_in || record.clock_in);
      const endOfDay = new Date(clockInDate);
      endOfDay.setHours(23, 59, 59, 999);
      sEnd = Math.min(Date.now(), endOfDay.getTime());
    }
    if (isNaN(sEnd) || sEnd <= sStart) return 0;

    let sessionBreakSecs = 0;
    breaksList.forEach((b) => {
      const bStart = b.break_start ? new Date(b.break_start).getTime() : null;
      if (!bStart || isNaN(bStart)) return;

      const bEnd = b.break_end
        ? new Date(b.break_end).getTime()
        : Math.min(Date.now(), sEnd);

      if (isNaN(bEnd)) return;

      const overlapStart = Math.max(sStart, bStart);
      const overlapEnd = Math.min(sEnd, bEnd);

      if (overlapEnd > overlapStart) {
        sessionBreakSecs += Math.floor((overlapEnd - overlapStart) / 1000);
      }
    });

    const totalSessionSecs = Math.max(0, Math.floor((sEnd - sStart) / 1000));
    return Math.min(sessionBreakSecs, totalSessionSecs);
  };

  const getBreakForRecord = (record) => {
    const secs = getSessionBreakSeconds(record);
    return formatDurationSeconds(secs);
  };

  const hasMultipleSessionsOnDate = (recordDate) => {
    return attendance.filter((r) => r.date === recordDate).length > 1;
  };

  const getBreaksDetailForRecord = (record) => {
    if (!record || (!record.raw_clock_in && !record.clock_in)) return [];

    const sStart = new Date(record.raw_clock_in || record.clock_in).getTime();
    if (isNaN(sStart)) return [];

    const hasClockOut = !!(record.raw_clock_out || record.clock_out);
    let sEnd;
    if (hasClockOut) {
      sEnd = new Date(record.raw_clock_out || record.clock_out).getTime();
    } else {
      // No clock-out: cap to end of the clock-in day (23:59:59 IST)
      const clockInDate = new Date(record.raw_clock_in || record.clock_in);
      const endOfDay = new Date(clockInDate);
      endOfDay.setHours(23, 59, 59, 999);
      sEnd = Math.min(Date.now(), endOfDay.getTime());
    }

    if (isNaN(sEnd) || sEnd <= sStart) return [];

    const sessionBreaks = [];
    breaksList.forEach((b) => {
      const bStart = b.break_start ? new Date(b.break_start).getTime() : null;
      if (!bStart || isNaN(bStart)) return;

      const bEnd = b.break_end
        ? new Date(b.break_end).getTime()
        : Math.min(Date.now(), sEnd);

      if (isNaN(bEnd)) return;

      const overlapStart = Math.max(sStart, bStart);
      const overlapEnd = Math.min(sEnd, bEnd);

      if (overlapEnd > overlapStart) {
        const durationSecs = Math.floor((overlapEnd - overlapStart) / 1000);
        sessionBreaks.push({
          start: new Date(overlapStart).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          end: b.break_end 
            ? new Date(overlapEnd).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            : "Active",
          duration: formatDurationSeconds(durationSecs)
        });
      }
    });

    return sessionBreaks;
  };

  const getNetWorkingForRecord = (record) => {
    if (!record || !record.worked_time || record.worked_time === "Missing Clock Out" || record.worked_time.includes("Invalid")) {
      return "—";
    }

    const sStart = new Date(record.raw_clock_in || record.clock_in).getTime();
    if (isNaN(sStart)) return "—";

    const hasClockOut = !!(record.raw_clock_out || record.clock_out);
    if (!hasClockOut) return "—"; // Can't calculate without clock-out

    const sEnd = new Date(record.raw_clock_out || record.clock_out).getTime();

    const totalWorkedSecs = Math.max(0, Math.floor((sEnd - sStart) / 1000));
    const breakSecs = getSessionBreakSeconds(record);

    const netSecs = Math.max(0, totalWorkedSecs - breakSecs);
    return formatDurationSeconds(netSecs);
  };

  return (
    <Layout>
      <div className="space-y-4 max-w-4xl mx-auto">

        {/* Header Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Attendance</h2>
              <p className="text-sm text-gray-500 mt-0.5">Track your clock-in and clock-out records</p>
            </div>
            {isClockedIn ? (
              <button
                type="button"
                onClick={() => handleClockAction("out")}
                disabled={actionLoading === "out"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-60"
              >
                <LogOut className="w-4 h-4" />
                {actionLoading === "out" ? "Clocking Out..." : "Clock Out"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleClockAction("in")}
                disabled={actionLoading === "in"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-60"
              >
                <LogIn className="w-4 h-4" />
                {actionLoading === "in" ? "Clocking In..." : "Clock In"}
              </button>
            )}
          </div>
          {!locationEnabled && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 space-y-2">
              <p>Location access is required. Please allow location services and then click retry.</p>
              <button
                type="button"
                onClick={checkLocationEnabled}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Retry Location
              </button>
            </div>
          )}

          {lateClockInMessage && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {lateClockInMessage}
            </div>
          )}

          {/* Date Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                From
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                To
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Toggle Tabs (only show if user has direct reports) */}
        {isManager && (
          <div className="flex gap-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveAttendanceTab("my")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeAttendanceTab === "my"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              My Attendance
            </button>
            <button
              type="button"
              onClick={() => setActiveAttendanceTab("team")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeAttendanceTab === "team"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Team Attendance
            </button>
          </div>
        )}

        {/* Team Attendance */}
        {isManager && activeAttendanceTab === "team" && (
          <div className="space-y-2">
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide shrink-0">
                Employee
              </label>
              <select
                value={selectedTeamEmployeeId}
                onChange={(e) => setSelectedTeamEmployeeId(e.target.value)}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Employees</option>
                {directReports.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            {teamAttendance.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No team attendance records found for the selected date range
                </p>
              </div>
            )}
            {teamAttendance.map((record, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-800">{formatTeamAttendanceDate(record.date)}</span>
                  </div>
                  <StatusBadge clockIn={record.clock_in} clockOut={record.clock_out} />
                </div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">
                  {record.employee_name}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-1">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <LogIn className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-gray-500">Clock In</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{record.clock_in || "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs text-gray-500">Clock Out</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{record.clock_out || "—"}</p>
                  </div>
                </div>
                {record.worked_time && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs text-gray-500 font-medium">Worked:</span>
                    <span className="text-xs font-semibold text-blue-600">{record.worked_time}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Records */}
        {(!isManager || activeAttendanceTab === "my") && (loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading attendance...</p>
          </div>
        ) : attendance.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No attendance records found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attendance.map((record, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-800">{record.date || "N/A"}</span>
                  </div>
                  <StatusBadge clockIn={record.clock_in} clockOut={record.clock_out} />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <LogIn className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-gray-500">Clock In</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{record.clock_in || "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs text-gray-500">Clock Out</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{record.clock_out || "—"}</p>
                  </div>
                </div>

                {record.worked_time && (
                  <div className="flex items-center justify-between gap-4 my-2.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs text-gray-500 font-medium">Worked:</span>
                      <span className="text-xs font-semibold text-blue-600">{record.worked_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs text-gray-500 font-medium">Break:</span>
                      <span className="text-xs font-semibold text-amber-600">{getBreakForRecord(record)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs text-gray-500 font-medium">Actual:</span>
                      <span className="text-xs font-semibold text-emerald-600">{getNetWorkingForRecord(record)}</span>
                    </div>
                  </div>
                )}

                {(record.clock_in_address || record.clock_out_address) && (
                  <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                    {record.clock_in_address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-500 leading-snug">{record.clock_in_address}</p>
                      </div>
                    )}
                    {record.clock_out_address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-500 leading-snug">{record.clock_out_address}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Layout>
  );
}

export default EmployeeAttendanceTab;