import { useCallback, useEffect, useState } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
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

function EmployeeAttendanceTab() {
  const employeeId = localStorage.getItem("employee_id");
  const [filters, setFilters] = useState({
    startDate: getFirstDayOfMonth(),
    endDate: getToday(),
  });
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const fetchMyAttendance = useCallback(async () => {
    if (!employeeId) {
      setAttendance([]);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/attendance/admin/get-particular-attendance", {
        params: {
          employeeId,
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      });

      setAttendance(res?.data?.data || []);
    } catch (error) {
      console.error("Error fetching my attendance:", error);
      toast.error("Unable to fetch attendance");
    } finally {
      setLoading(false);
    }
  }, [employeeId, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchMyAttendance();
  }, [fetchMyAttendance]);

  const handleClockAction = async (type) => {
    try {
      setActionLoading(type);
      const coords = await getOptionalCoords();
      const endpoint = type === "in" ? "/attendance/clock-in" : "/attendance/clock-out";

      const res = await api.post(endpoint, {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      const suffix = coords.tracked ? "" : " (without location)";
      toast.success(`${res?.data?.message || "Attendance updated"}${suffix}`);
      fetchMyAttendance();
    } catch (error) {
      console.error("Clock action failed:", error);
      toast.error(error?.response?.data?.message || "Unable to update attendance");
    } finally {
      setActionLoading("");
    }
  };

  const todayRecord = attendance.find((r) => r.date === getToday());
  // const isClockedIn = !!(todayRecord?.clock_in && !todayRecord?.clock_out);

  const todayStr = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
// todayStr will be "Feb 23, 2026" — matching the API format

const isClockedIn = attendance.some(
  (r) => r.date === todayStr && r.clock_in && !r.clock_out
);

  return (
    <Layout>
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle>My Attendance</CardTitle>
            {/* <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => handleClockAction("in")}
              disabled={actionLoading === "in" || actionLoading === "out"}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading === "in" ? "Clocking In..." : "Clock In"}
            </Button>
            <Button
              type="button"
              onClick={() => handleClockAction("out")}
              disabled={actionLoading === "in" || actionLoading === "out"}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === "out" ? "Clocking Out..." : "Clock Out"}
            </Button>
          </div>    */}
            <div className="flex flex-wrap gap-2">
              {isClockedIn ? (
                <Button
                  type="button"
                  onClick={() => handleClockAction("out")}
                  disabled={actionLoading === "out"}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {actionLoading === "out" ? "Clocking Out..." : "Clock Out"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => handleClockAction("in")}
                  disabled={actionLoading === "in"}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === "in" ? "Clocking In..." : "Clock In"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-600">Loading attendance...</CardContent>
          </Card>
        ) : attendance.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-600">No attendance records found.</CardContent>
          </Card>
        ) : (
          attendance.map((record, index) => (
            <Card key={index}>
              <CardContent className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{record.date || "N/A"}</p>
                    <p className="text-sm text-gray-500">Date</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{record.clock_in || "N/A"}</p>
                    <p className="text-sm text-gray-500">Clock In</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{record.clock_out || "N/A"}</p>
                    <p className="text-sm text-gray-500">
                      Worked: {record.worked_time || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-3 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">{record.clock_in_address || "N/A"}</p>
                    <p className="text-sm text-gray-500">Clock In Address</p>
                  </div>
                </div>

                <div className="lg:col-span-3 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">{record.clock_out_address || "N/A"}</p>
                    <p className="text-sm text-gray-500">Clock Out Address</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
}

export default EmployeeAttendanceTab;