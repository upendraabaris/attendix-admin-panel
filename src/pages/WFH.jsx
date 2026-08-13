import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { CheckCircle, XCircle, Hourglass, Search, ClipboardList, Home, ArrowRight } from "lucide-react";
import api from "../hooks/useApi";

const getInitials = (name) => (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const countDays = (s, e) => (s && e ? Math.max(Math.round((new Date(e) - new Date(s)) / 86400000) + 1, 1) : 0);
const isHalfDay = (r) => [true, "true", "t", 1, "1"].includes(r?.is_half_day);
const getDuration = (r) => (isHalfDay(r) ? 0.5 : countDays(r.start_date, r.end_date));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const STATUS = {
  approved: { border: "border-l-green-500", badge: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Approved" },
  rejected: { border: "border-l-red-400", badge: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="w-3.5 h-3.5" />, label: "Rejected" },
  pending: { border: "border-l-yellow-400", badge: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Hourglass className="w-3.5 h-3.5" />, label: "Pending" },
};

const WFH = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const orgID = localStorage.getItem("orgID");

  const fetchWFH = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/wfh/get`);
      setRequests(res.data.data);
    } catch (err) {
      console.error("Error fetching WFH requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWFH(); }, []);

  const orgFiltered = requests.filter((r) => r.organization_id == orgID);
  const filtered = orgFiltered.filter(
    (r) =>
      (statusFilter === "all" || r.status === statusFilter) &&
      r.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const counts = {
    all: orgFiltered.length,
    pending: orgFiltered.filter((r) => r.status === "pending").length,
    approved: orgFiltered.filter((r) => r.status === "approved").length,
    rejected: orgFiltered.filter((r) => r.status === "rejected").length,
  };

  const handleAction = async (id, action) => {
    try {
      await api.put(`/wfh/update/${id}`, { status: action });
      fetchWFH();
    } catch (err) {
      console.error("Failed to update WFH request", err);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="w-7 h-7 text-indigo-600" /> Work From Home Requests
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Review and manage team member work-from-home applications.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { key: "all", label: "Total Requests", color: "bg-indigo-50", iconColor: "text-indigo-600" },
            { key: "pending", label: "Pending", color: "bg-yellow-50", iconColor: "text-yellow-600" },
            { key: "approved", label: "Approved", color: "bg-green-50", iconColor: "text-green-600" },
            { key: "rejected", label: "Rejected", color: "bg-red-50", iconColor: "text-red-500" },
          ].map(({ key, label, color, iconColor }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4 text-left transition-all ${
                statusFilter === key ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`p-2.5 rounded-lg ${color}`}><ClipboardList className={`w-5 h-5 ${iconColor}`} /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{counts[key]}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </button>
          ))}
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input placeholder="Search by team member name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-9 text-sm" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44 h-9 text-sm"><SelectValue placeholder="Filter by status" /></SelectTrigger>
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading WFH requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
            <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No WFH requests found</p>
            <p className="text-xs mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const cfg = STATUS[r.status] || STATUS.pending;
              const half = isHalfDay(r);
              return (
                <div key={r.id} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} shadow-sm overflow-hidden`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                          {getInitials(r.employee_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{r.employee_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Submitted {formatDate(r.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {half && <Badge className="border border-amber-200 bg-amber-50 text-amber-800">Half Day</Badge>}
                        <Badge className={`inline-flex items-center gap-1 border text-xs font-medium ${cfg.badge}`}>{cfg.icon}{cfg.label}</Badge>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Home className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-medium">{formatDate(r.start_date)}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">{formatDate(r.end_date)}</span>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {getDuration(r)} day{getDuration(r) === 1 ? "" : "s"}
                      </span>
                    </div>

                    {r.reason && (
                      <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-3.5 py-2.5">
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Reason</p>
                        <p className="text-sm text-gray-700">{r.reason}</p>
                      </div>
                    )}

                    {r.status === "pending" && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                        <Button size="sm" onClick={() => handleAction(r.id, "approved")} className="bg-green-600 hover:bg-green-700 text-white h-8 px-4 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve
                        </Button>
                        <Button size="sm" onClick={() => handleAction(r.id, "rejected")} className="bg-red-500 hover:bg-red-600 text-white h-8 px-4 text-xs font-medium">
                          <XCircle className="w-3.5 h-3.5 mr-1.5" /> Deny
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

export default WFH;