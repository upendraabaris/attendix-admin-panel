import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const orgID = localStorage.getItem("orgID");

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
        case "worked_time":
          return (
            dir *
            (parseWorkedHours(a.worked_time) - parseWorkedHours(b.worked_time))
          );
        default:
          return 0;
      }
    });
  }, [attendance, sortConfig]);

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Employee Attendance
          </h1>
          <p className="text-gray-600">
            Records for <span className="font-semibold">{employeeName}</span>
          </p>
        </div>

        {/* Date Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{attendance.length}</p>
              <p className="text-sm text-gray-600">Total Records</p>
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
            ) : sorted.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No attendance records found for this employee.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-10 text-center">#</TableHead>
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
                  {sorted.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center text-gray-400 text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
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
}

export default EmpAttendance;
