import { useCallback, useEffect, useState } from "react";
import { Calendar, Clock, MapPin, LogIn, LogOut } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(true);

  const fetchMyAttendance = useCallback(async () => {
    if (!employeeId) { setAttendance([]); return; }
    try {
      setLoading(true);
      const res = await api.get("/attendance/admin/get-particular-attendance", {
        params: { employeeId, startDate: filters.startDate, endDate: filters.endDate },
      });
      setAttendance(res?.data?.data || []);
    } catch (error) {
      console.error("Error fetching my attendance:", error);
      toast.error("Unable to fetch attendance");
    } finally {
      setLoading(false);
    }
  }, [employeeId, filters.startDate, filters.endDate]);

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

        {/* Records */}
        {loading ? (
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
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs text-gray-500">Worked:</span>
                    <span className="text-xs font-medium text-blue-600">{record.worked_time}</span>
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
        )}
      </div>
    </Layout>
  );
}

export default EmployeeAttendanceTab;