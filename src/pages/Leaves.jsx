import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  CheckCircle,
  XCircle,
  Hourglass,
  Search,
  ClipboardList,
  CalendarRange,
  ArrowRight,
} from "lucide-react";
import api from "../hooks/useApi";

const getInitials = (name) =>
  (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

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

const Leaves = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const orgID = localStorage.getItem("orgID");

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leave/get`);
      setLeaves(res.data.data);
    } catch (err) {
      console.error("Error fetching leaves", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const orgFiltered = leaves.filter((l) => l.organization_id == orgID);

  const filteredRequests = orgFiltered.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesSearch =
      r.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: orgFiltered.length,
    pending: orgFiltered.filter((r) => r.status === "pending").length,
    approved: orgFiltered.filter((r) => r.status === "approved").length,
    rejected: orgFiltered.filter((r) => r.status === "rejected").length,
  };

  const handleLeaveAction = async (requestId, action) => {
    try {
      await api.put(`/leave/update/${requestId}`, {
        status: action,
        comment: "",
        id: 1,
      });
      fetchLeaves();
    } catch (err) {
      console.error("Failed to update leave request", err);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarRange className="w-7 h-7 text-indigo-600" />
              Leave Requests
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Review and manage employee leave applications.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              key: "all",
              label: "Total Requests",
              color: "bg-indigo-50",
              iconColor: "text-indigo-600",
            },
            {
              key: "pending",
              label: "Pending",
              color: "bg-yellow-50",
              iconColor: "text-yellow-600",
            },
            {
              key: "approved",
              label: "Approved",
              color: "bg-green-50",
              iconColor: "text-green-600",
            },
            {
              key: "rejected",
              label: "Rejected",
              color: "bg-red-50",
              iconColor: "text-red-500",
            },
          ].map(({ key, label, color, iconColor }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4 text-left transition-all ${
                statusFilter === key
                  ? "border-indigo-300 ring-2 ring-indigo-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`p-2.5 rounded-lg ${color}`}>
                <ClipboardList className={`w-5 h-5 ${iconColor}`} />
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
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input
                  placeholder="Search by name or leave type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
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
            <p className="text-sm">Loading leave requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
            <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No leave requests found</p>
            <p className="text-xs mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const cfg =
                STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
              return (
                <div
                  key={request.id}
                  className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} shadow-sm overflow-hidden`}
                >
                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                          {getInitials(request.employee_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {request.employee_name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Submitted {formatDate(request.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className="text-xs font-medium"
                        >
                          {request.type}
                        </Badge>
                        <Badge
                          className={`inline-flex items-center gap-1 border text-xs font-medium ${cfg.badge}`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Date range + days */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <CalendarRange className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-medium">
                          {formatDate(request.start_date)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">
                          {formatDate(request.end_date)}
                        </span>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {request.days} day{request.days !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Reason */}
                    {request.reason && (
                      <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-3.5 py-2.5">
                        <p className="text-xs font-medium text-gray-500 mb-0.5">
                          Reason
                        </p>
                        <p className="text-sm text-gray-700">
                          {request.reason}
                        </p>
                      </div>
                    )}

                    {/* Admin comment */}
                    {request.adminComment && (
                      <div className="mt-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3.5 py-2.5">
                        <p className="text-xs font-medium text-indigo-500 mb-0.5">
                          Admin Note
                        </p>
                        <p className="text-sm text-indigo-800">
                          {request.adminComment}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {request.status === "pending" && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleLeaveAction(request.id, "approved")
                          }
                          className="bg-green-600 hover:bg-green-700 text-white h-8 px-4 text-xs font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleLeaveAction(request.id, "rejected")
                          }
                          className="bg-red-500 hover:bg-red-600 text-white h-8 px-4 text-xs font-medium"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          Deny
                        </Button>
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
};

export default Leaves;
