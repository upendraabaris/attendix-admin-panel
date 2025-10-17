import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  Filter,
  Search,
  Download,
} from "lucide-react";
import api from "../hooks/useApi";

const Attendance = () => {
  const today = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState({
    employee: "all",
    startDate: today,
    endDate: today,
    location: "all",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const orgID = localStorage.getItem("orgID");

  const [employees, setEmployees] = useState([]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        organizationId: orgID,
      };

      if (filters.employee && filters.employee !== "all") {
        params.employeeId = filters.employee;
      }

      const res = await api.get(`/attendance/admin/all-employee-attendance`, {
        params,
        // headers: {
        //   Authorization: `Bearer ${user.token}`,
        // },
      });

      console.log("Attendance API response:", res);
      setAttendance(res.data.data || []);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filters, orgID]);

  //   const filteredRecords = attendanceRecords.filter(record => {
  //     const matchesEmployee = filters.employee === 'all' || record.employeeId.toString() === filters.employee;
  //     const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       record.location.toLowerCase().includes(searchTerm.toLowerCase());
  //     const matchesLocation = filters.location === 'all' || record.location === filters.location;
  //     const matchesDateRange = true; // Placeholder
  //     return matchesEmployee && matchesSearch && matchesLocation && matchesDateRange;
  //   });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleExport = () => {
    console.log("Exporting attendance records...");
  };

  const getTotalHours = () => {
    return attendance
      .reduce((total, record) => {
        if (!record.worked_time || record.worked_time === "N/A") return total;
        const [h, m] = record.worked_time.split("h").map((s) => parseInt(s));
        return total + (h || 0) + (m || 0) / 60;
      }, 0)
      .toFixed(1);
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get(`/employee/getEmployees`); // 🔁 Replace endpoint if different

        const list = res.data.data || []; // ✅ FIXED this line
        setEmployees(list);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      }
    };

    fetchEmployees();
  }, []);

  console.log("Employees:", employees);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Attendance Records
            </h1>
            <p className="text-gray-600">View and filter employee attendance</p>
          </div>
          {/* <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button> */}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select
                  value={filters.employee}
                  onValueChange={(value) =>
                    handleFilterChange("employee", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem
                        key={employee.id}
                        value={employee.id.toString()}
                      >
                        {employee.name ?? "No Name"}{" "}
                        {/* 👈 fallback in case name is null */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                />
              </div>

              {/* <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={filters.location}
                  onValueChange={(value) =>
                    handleFilterChange("location", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div> */}
            </div>

            {/* <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by employee name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => {
                  setFilters({
                    employee: "all",
                    startDate: "",
                    endDate: "",
                    location: "all",
                  });
                  setSearchTerm("");
                }}
              >
                Clear Filters
              </Button>
            </div> */}
          </CardContent>
        </Card>

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
          {/* <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">
                {(parseFloat(getTotalHours()) / attendance.length || 0).toFixed(
                  1
                )}
              </p>
              <p className="text-sm text-gray-600">Average Hours/Day</p>
            </CardContent>
          </Card> */}
        </div>

        <div className="space-y-4">
          {attendance.map((record, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{record.avatar ?? "👤"}</div>
                    <div>
                      <p className="font-medium">
                        {record.employee_name ?? "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">Employee</p>
                    </div>
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
                      {record.worked_time === "Missing Clock Out" ||
                      record.worked_time === "Invalid time (Out before In)" ? (
                        <p className="text-red-500 text-sm">
                          ⚠️ {record.worked_time}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {record.worked_time} worked
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-3 flex items-start space-x-2 pt-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <p className="font-medium">
                        {record.clock_in_address || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">Clock In Address</p>
                    </div>
                  </div>

                  <div className="lg:col-span-3 flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <p className="font-medium">
                        {record.clock_out_address || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">Clock Out Address</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {attendance.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">
                No attendance records found matching your criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Attendance;