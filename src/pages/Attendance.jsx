import { useEffect, useState, useMemo } from "react";
import Layout from "../components/Layout";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
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
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ClipboardList,
  Clock,
  AlertTriangle,
  CalendarDays,
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
      <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs">
        <AlertTriangle className="w-3.5 h-3.5" />
        Missing Clock Out
      </span>
    );
  if (workedTime && workedTime.includes("Invalid time"))
    return (
      <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs">
        <AlertTriangle className="w-3.5 h-3.5" />
        Invalid Time
      </span>
    );
  if (!workedTime || workedTime === "N/A")
    return <span className="text-gray-400 text-sm">—</span>;
  return (
    <Badge className="bg-green-100 text-green-800 border border-green-200 whitespace-nowrap font-medium">
      {workedTime}
    </Badge>
  );
};

const getInitials = (name) =>
  (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column)
    return <ChevronsUpDown className="w-3.5 h-3.5 ml-1 inline opacity-40" />;
  return sortConfig.direction === "asc" ? (
    <ChevronUp className="w-3.5 h-3.5 ml-1 inline text-indigo-600" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 ml-1 inline text-indigo-600" />
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
      const byName = (a.employee_name || "").localeCompare(b.employee_name || "");
      switch (sortConfig.key) {
        case "employee_name":
          return byName !== 0 ? dir * byName : byDate;
        case "date":
          return byDate !== 0 ? dir * byDate : byName;
        case "clock_in":
          return dir * (a.clock_in || "").localeCompare(b.clock_in || "");
        case "clock_out":
          return dir * (a.clock_out || "").localeCompare(b.clock_out || "");
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

  const missingCount = attendance.filter(
    (r) => r.worked_time === "Missing Clock Out",
  ).length;

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

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-indigo-600" />
              Attendance Records
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Track and review employee check-in and check-out details.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-indigo-50">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredAndSorted.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Showing Records</p>
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
            <div className="p-2.5 rounded-lg bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{missingCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Missing Clock Outs</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 font-medium">Employee</Label>
                <Select
                  value={filters.employee}
                  onValueChange={(value) => handleFilterChange("employee", value)}
                >
                  <SelectTrigger className="h-9 text-sm">
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
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 font-medium">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  <Input
                    placeholder="Name or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading attendance records...</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No records found</p>
              <p className="text-xs mt-1">Try adjusting your filters or date range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="w-10 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      #
                    </TableHead>
                    <SortableHead column="employee_name" label="Employee" />
                    <SortableHead column="date" label="Date" />
                    <SortableHead column="clock_in" label="Clock In" />
                    <SortableHead column="clock_out" label="Clock Out" />
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Clock In Address
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Clock Out Address
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSorted.map((record, index) => {
                    const isMissing = record.worked_time === "Missing Clock Out";
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
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {getInitials(record.employee_name)}
                            </div>
                            <span className="font-medium text-gray-900 text-sm whitespace-nowrap">
                              {record.employee_name ?? "Unknown"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-700">
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
                          {record.clock_out || "—"}
                        </TableCell>
                        <TableCell>{getStatusCell(record.worked_time)}</TableCell>
                        <TableCell className="text-sm text-gray-500 min-w-[200px] whitespace-normal break-words">
                          {record.clock_in_address || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 min-w-[200px] whitespace-normal break-words">
                          {record.clock_out_address || "—"}
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
    </Layout>
  );
};

export default Attendance;
