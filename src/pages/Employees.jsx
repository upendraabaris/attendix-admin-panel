import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Users,
  UserCheck,
  UserMinus,
  Calendar,
  Pencil,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import api from "../hooks/useApi";

const getInitials = (name) =>
  (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const STATUS_CONFIG = {
  active: {
    border: "border-l-green-500",
    badge: "bg-green-100 text-green-800 border-green-200",
    label: "Active",
  },
  "on-leave": {
    border: "border-l-yellow-400",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "On Leave",
  },
  inactive: {
    border: "border-l-gray-400",
    badge: "bg-gray-100 text-gray-700 border-gray-200",
    label: "Inactive",
  },
};

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchList = async () => {
    try {
      const res = await api.get(`/employee/getEmployees`);
      setEmployees(res.data.data);
    } catch (err) {
      console.error("Error fetching client list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const orgID = localStorage.getItem("orgID");
  const orgFilteredEmployees = employees.filter(
    (emp) => emp.organization_id == orgID,
  );

  const counts = {
    all: orgFilteredEmployees.length,
    active: orgFilteredEmployees.filter((e) => e.status === "active").length,
    "on-leave": orgFilteredEmployees.filter((e) => e.status === "on-leave")
      .length,
    inactive: orgFilteredEmployees.filter((e) => e.status === "inactive")
      .length,
  };

  const filteredEmployees = orgFilteredEmployees.filter((employee) => {
    const name = employee.name || "";
    const email = employee.email || "";
    const department = employee.department || "";
    const role = employee.role || "";

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      role.toLowerCase().includes(roleFilter.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || employee.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-indigo-600" />
              Employee Management
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Manage and monitor your team members.
            </p>
          </div>
          <Button
            onClick={() => navigate("/employees/add")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              key: "all",
              label: "Total Employees",
              icon: Users,
              color: "bg-indigo-50",
              iconColor: "text-indigo-600",
            },
            {
              key: "active",
              label: "Active",
              icon: UserCheck,
              color: "bg-green-50",
              iconColor: "text-green-600",
            },
            {
              key: "on-leave",
              label: "On Leave",
              icon: Calendar,
              color: "bg-yellow-50",
              iconColor: "text-yellow-600",
            },
            {
              key: "inactive",
              label: "Inactive",
              icon: UserMinus,
              color: "bg-gray-50",
              iconColor: "text-gray-500",
            },
          ].map(({ key, label, icon: Icon, color, iconColor }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4 text-left transition-all ${statusFilter === key
                  ? "border-indigo-300 ring-2 ring-indigo-100"
                  : "border-gray-200 hover:border-gray-300"
                }`}
            >
              <div className={`p-2.5 rounded-lg ${color}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {counts[key] ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input
                  placeholder="Search by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
                  <Filter className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Employee Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No employees found</p>
            <p className="text-xs mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => {
              const cfg =
                STATUS_CONFIG[employee.status] || STATUS_CONFIG.inactive;
              return (
                <div
                  key={employee.id}
                  className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} shadow-sm overflow-hidden hover:shadow-md transition-shadow`}
                >
                  <div className="p-5">
                    {/* Top: Avatar + Name + Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                          {getInitials(employee.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {employee.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`inline-flex items-center border text-xs font-medium shrink-0 ${cfg.badge}`}
                      >
                        {cfg.label}
                      </Badge>
                    </div>

                    {/* Info Row */}
                    <div className="mt-3 space-y-1">
                      {employee.phone && (
                        <p className="text-xs text-gray-500">
                          {employee.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">{employee.role}</span>
                        {employee.department && ` · ${employee.department}`}
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employees/empattendance/${employee.id}`, {
                            state: { name: employee.name },
                          });
                        }}
                        size="sm"
                        className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 h-8 text-xs font-medium"
                        variant="ghost"
                      >
                        Attendance
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employees/empleave/${employee.id}`);
                        }}
                        size="sm"
                        className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 h-8 text-xs font-medium"
                        variant="ghost"
                      >
                        Leave
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employees/emptasks/${employee.id}`);
                        }}
                        size="sm"
                        className="flex-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 h-8 text-xs font-medium"
                        variant="ghost"
                      >
                        Tasks
                      </Button>

                    </div>

                    {/* Footer: Joined date + Edit */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        Joined{" "}
                        {new Date(employee.created_at).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employees/edit/${employee.id}`);
                        }}
                        className="h-7 px-3 text-xs gap-1.5 border-gray-200"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Employees;
