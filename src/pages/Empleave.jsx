import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../hooks/useApi";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import {
  CheckCircle,
  XCircle,
  Hourglass,
  ClipboardList,
  CalendarRange,
  ArrowRight,
  ArrowLeft,
  User,
} from "lucide-react";

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const countDays = (start, end) => {
  if (!start || !end) return 0;
  const diff =
    Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
};

const STATUS_CONFIG = {
  approved: {
    border: "border-l-green-500",
    badge: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: "Approved",
  },
  rejected: {
    border: "border-l-red-400",
    badge: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: "Rejected",
  },
  pending: {
    border: "border-l-yellow-400",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <Hourglass className="w-3.5 h-3.5" />,
    label: "Pending",
  },
};

function Empleave() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leave/get`);
      const empLeaves = res.data.data.filter(
        (leave) => String(leave.employee_id) === String(id),
      );
      setLeaves(empLeaves);
      if (empLeaves.length > 0) {
        setEmployeeName(empLeaves[0].employee_name);
      }
    } catch (err) {
      console.error("Error fetching leaves", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [id]);

  const filteredLeaves =
    statusFilter === "all"
      ? leaves
      : leaves.filter((l) => l.status === statusFilter);

  const counts = {
    all: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400">Employee Management</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarRange className="w-7 h-7 text-indigo-600" />
              Leave History
            </h1>
            <p className="text-gray-500 mt-1 text-sm flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {employeeName || "Employee"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              key: "all",
              label: "Total Leaves",
              color: "bg-indigo-50",
              iconColor: "text-indigo-600",
              icon: <ClipboardList className="w-5 h-5" />,
            },
            {
              key: "pending",
              label: "Pending",
              color: "bg-yellow-50",
              iconColor: "text-yellow-600",
              icon: <Hourglass className="w-5 h-5" />,
            },
            {
              key: "approved",
              label: "Approved",
              color: "bg-green-50",
              iconColor: "text-green-600",
              icon: <CheckCircle className="w-5 h-5" />,
            },
            {
              key: "rejected",
              label: "Rejected",
              color: "bg-red-50",
              iconColor: "text-red-500",
              icon: <XCircle className="w-5 h-5" />,
            },
          ].map(({ key, label, color, iconColor, icon }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4 text-left transition-all ${
                statusFilter === key
                  ? "border-indigo-300 ring-2 ring-indigo-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`p-2.5 rounded-lg ${color} ${iconColor}`}>
                {icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {counts[key]}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {filteredLeaves.length}
                </span>{" "}
                {statusFilter === "all" ? "total" : statusFilter} leave
                {filteredLeaves.length !== 1 ? "s" : ""}
              </p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44 h-9 text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leave Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading leave history...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
            <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No leave records found</p>
            <p className="text-xs mt-1">Try adjusting your status filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeaves.map((leave) => {
              const cfg = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
              return (
                <div
                  key={leave.id}
                  className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} shadow-sm overflow-hidden`}
                >
                  <div className="p-5">
                    {/* Top row: leave type + status badge */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {leave.type
                            ? leave.type.charAt(0).toUpperCase() +
                              leave.type.slice(1)
                            : "Leave"}{" "}
                          Leave
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Applied {formatDate(leave.created_at)}
                        </p>
                      </div>
                      <Badge
                        className={`inline-flex items-center gap-1 border text-xs font-medium ${cfg.badge}`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </div>

                    {/* Date range + days */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <CalendarRange className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-medium">
                          {formatDate(leave.start_date)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">
                          {formatDate(leave.end_date)}
                        </span>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {countDays(leave.start_date, leave.end_date)} day
                        {countDays(leave.start_date, leave.end_date) !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>

                    {/* Reason */}
                    {leave.reason && (
                      <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-3.5 py-2.5">
                        <p className="text-xs font-medium text-gray-500 mb-0.5">
                          Reason
                        </p>
                        <p className="text-sm text-gray-700">{leave.reason}</p>
                      </div>
                    )}

                    {/* Admin comment */}
                    {leave.adminComment && (
                      <div className="mt-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3.5 py-2.5">
                        <p className="text-xs font-medium text-indigo-500 mb-0.5">
                          Admin Note
                        </p>
                        <p className="text-sm text-indigo-800">
                          {leave.adminComment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Empleave;
