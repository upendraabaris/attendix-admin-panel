import { useEffect, useState, useMemo } from "react";
import Layout from "../components/Layout";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import api from "../hooks/useApi";

const parseWorkedHours = (workedTime) => {
  if (!workedTime || workedTime === "N/A") return -1;
  if (workedTime === "Missing Clock Out" || workedTime.includes("Invalid time"))
    return -2;
  const hMatch = workedTime.match(/(\d+)h/);
  const mMatch = workedTime.match(/(\d+)m/);
  const h = hMatch ? parseInt(hMatch[1]) : 0;
  const m = mMatch ? parseInt(mMatch[1]) : 0;
  return h + m / 60;
};

const getStatusCell = (workedTime) => {
  if (workedTime === "Missing Clock Out")
    return (
      <span className="text-red-500 font-medium text-sm">
        ⚠ Missing Clock Out
      </span>
    );
  if (workedTime && workedTime.includes("Invalid time"))
    return (
      <span className="text-red-500 font-medium text-sm">⚠ Invalid Time</span>
    );
  if (!workedTime || workedTime === "N/A")
    return <span className="text-gray-400 text-sm">—</span>;
  return (
    <Badge className="bg-green-100 text-green-800 border-green-200 whitespace-nowrap">
      {workedTime}
    </Badge>
  );
};

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column)
    return <ChevronsUpDown className="w-4 h-4 ml-1 inline text-gray-400" />;
  return sortConfig.direction === "asc" ? (
    <ChevronUp className="w-4 h-4 ml-1 inline text-blue-600" />
  ) : (
    <ChevronDown className="w-4 h-4 ml-1 inline text-blue-600" />
  );
};

const Attendance = () => {
  const today = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState({
    employee: "all",
    startDate: today,
    endDate: today,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "employee_name",
    direction: "asc",
  });

  const orgID = localStorage.getItem("orgID");

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
      });
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

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get(`/employee/getEmployees`);
        setEmployees(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      }
    };
    fetchEmployees();
  }, []);

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

  const filteredAndSorted = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    const filtered = attendance.filter(
      (r) =>
        !searchTerm ||
        (r.employee_name || "").toLowerCase().includes(lower) ||
        (r.clock_in_address || "").toLowerCase().includes(lower) ||
        (r.clock_out_address || "").toLowerCase().includes(lower),
    );

    return [...filtered].sort((a, b) => {
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      const byDate = new Date(a.date) - new Date(b.date);
      const byName = (a.employee_name || "").localeCompare(
        b.employee_name || "",
      );

      switch (sortConfig.key) {
        case "employee_name":
          // Primary: employee name (asc/desc), secondary: date always ascending
          return byName !== 0 ? dir * byName : byDate;
        case "date":
          // Primary: date (asc/desc), secondary: employee name ascending
          return byDate !== 0 ? dir * byDate : byName;
        case "clock_in":
          return dir * (a.clock_in || "").localeCompare(b.clock_in || "");
        case "clock_out":
          return dir * (a.clock_out || "").localeCompare(b.clock_out || "");
        case "worked_time":
          return (
            dir *
            (parseWorkedHours(a.worked_time) - parseWorkedHours(b.worked_time))
          );
        default:
          return 0;
      }
    });
  }, [attendance, searchTerm, sortConfig]);

  const totalHours = useMemo(
    () =>
      attendance
        .reduce((total, r) => {
          const h = parseWorkedHours(r.worked_time);
          return total + (h > 0 ? h : 0);
        }, 0)
        .toFixed(1),
    [attendance],
  );

  const SortableHead = ({ column, label }) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap hover:bg-gray-50"
      onClick={() => handleSort(column)}
    >
      {label}
      <SortIcon column={column} sortConfig={sortConfig} />
    </TableHead>
  );

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
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name ?? "No Name"}
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

              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Name or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{filteredAndSorted.length}</p>
              <p className="text-sm text-gray-600">Showing Records</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{totalHours}</p>
              <p className="text-sm text-gray-600">Total Hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">
                {
                  attendance.filter(
                    (r) => r.worked_time === "Missing Clock Out",
                  ).length
                }
              </p>
              <p className="text-sm text-gray-600">Missing Clock Outs</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                Loading attendance records...
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No attendance records found matching your criteria.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-10 text-center">#</TableHead>
                    <SortableHead column="employee_name" label="Employee" />
                    <SortableHead column="date" label="Date" />
                    <SortableHead column="clock_in" label="Clock In" />
                    <SortableHead column="clock_out" label="Clock Out" />
                    <SortableHead column="worked_time" label="Hours Worked" />
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In Address</TableHead>
                    <TableHead>Clock Out Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSorted.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center text-gray-400 text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.employee_name ?? "Unknown"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.date
                          ? new Date(record.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-sm">
                        {record.clock_in || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-sm">
                        {record.clock_out || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {parseWorkedHours(record.worked_time) > 0
                          ? record.worked_time
                          : "—"}
                      </TableCell>
                      <TableCell>{getStatusCell(record.worked_time)}</TableCell>
                      <TableCell className="text-sm text-gray-600 min-w-[200px] whitespace-normal break-words">
                        {record.clock_in_address || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 min-w-[200px] whitespace-normal break-words">
                        {record.clock_out_address || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Attendance;
