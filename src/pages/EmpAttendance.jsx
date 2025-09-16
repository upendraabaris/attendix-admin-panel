import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Calendar, Clock, MapPin } from "lucide-react";
import api from "../hooks/useApi";

function EmpAttendance() {
  const { id } = useParams(); // employeeId route से
  const location = useLocation();
  const employeeName = location.state?.name || "Unknown";

  // ✅ Current month ki 1st date and today's date
  const getFirstDayOfMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const year = firstDay.getFullYear();
    const month = String(firstDay.getMonth() + 1).padStart(2, "0");
    const day = String(firstDay.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
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
  const [loading, setLoading] = useState(false);

  // ✅ orgID localStorage se
  const orgID = localStorage.getItem("orgID");

  // ✅ Attendance fetch
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
    } catch (err) {
      console.error("Error fetching employee attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && orgID) {
      fetchAttendance();
    }
  }, [filters, id, orgID]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Calculate total hours
  const getTotalHours = () => {
    return attendance
      .reduce((total, record) => {
        if (!record.worked_time || record.worked_time === "N/A") return total;
        const [h, m] = record.worked_time.split("h").map((s) => parseInt(s));
        return total + (h || 0) + (m || 0) / 60;
      }, 0)
      .toFixed(1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Employee Attendance
        </h1>
        <p className="text-gray-600">
          Attendance records for{" "}
          <span className="font-semibold">{employeeName}</span>
        </p>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Date Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Records & Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{attendance.length}</p>
              <p className="text-sm text-gray-600">Total Records</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{getTotalHours()}</p>
              <p className="text-sm text-gray-600">Total Hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">Loading attendance records...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {attendance.map((record, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="font-medium">
                          {record.employee_name ?? employeeName}
                        </p>
                        <p className="text-sm text-gray-500">Employee</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {record.date
                              ? new Date(record.date).toLocaleDateString()
                              : "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {record.worked_time ?? "N/A"} worked
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {record.clock_in} - {record.clock_out}
                          </p>
                          <p className="text-sm text-gray-500">
                            {record.worked_time}
                          </p>
                        </div>
                      </div>

                      <div className="lg:col-span-3 flex items-start space-x-2 pt-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                        <div>
                          <p className="font-medium">
                            {record.clock_in_address || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Clock In Address
                          </p>
                        </div>
                      </div>

                      <div className="lg:col-span-3 flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                        <div>
                          <p className="font-medium">
                            {record.clock_out_address || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Clock Out Address
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {attendance.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">
                No attendance records found for this employee.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

export default EmpAttendance;
