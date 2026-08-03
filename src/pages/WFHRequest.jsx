import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { CheckCircle, XCircle, Hourglass, Home, ArrowRight, Send, CalendarDays } from "lucide-react";
import api from "../hooks/useApi";

const countDays = (s, e) => (s && e ? Math.max(Math.round((new Date(e) - new Date(s)) / 86400000) + 1, 1) : 0);
const isHalfDay = (r) => [true, "true", "t"].includes(r?.is_half_day);
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const STATUS = {
  approved: { border: "border-l-green-500", badge: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Approved" },
  rejected: { border: "border-l-red-400", badge: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="w-3.5 h-3.5" />, label: "Rejected" },
  pending: { border: "border-l-yellow-400", badge: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Hourglass className="w-3.5 h-3.5" />, label: "Pending" },
};

const WFHRequest = () => {
  const [requests, setRequests] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("my");
  const [processingId, setProcessingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [half, setHalf] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchMyWFH = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/wfh/my`);
      setRequests(res.data.data);
      setTeamRequests(res.data.teamRequests || []);
    } catch (err) {
      console.error("Error fetching WFH requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyWFH(); }, []);

  const duration = half ? 0.5 : countDays(startDate, endDate);

  const monthlyTotals = requests.reduce((acc, r) => {
    if (!r.start_date) return acc;
    const d = new Date(r.start_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const dur = isHalfDay(r) ? 0.5 : countDays(r.start_date, r.end_date);

    if (!acc[key]) acc[key] = { label, total: 0, sortKey: d.getFullYear() * 12 + d.getMonth() };
    acc[key].total += dur;
    return acc;
  }, {});

  const monthlySummary = Object.values(monthlyTotals).sort((a, b) => b.sortKey - a.sortKey);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const finalEndDate = half ? startDate : endDate;
    if (!startDate || !finalEndDate) return setError("Start date and end date are required");
    if (finalEndDate < startDate) return setError("End date cannot be before start date");
    if (!reason.trim()) return setError("Reason is required");

    setSubmitting(true);
    try {
      await api.post(`/wfh`, { startDate, endDate: finalEndDate, reason, is_half_day: half });
      setStartDate(""); setEndDate(""); setHalf(false); setReason("");
      fetchMyWFH();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTeamWfhAction = async (wfhId, status) => {
    try {
      setProcessingId(wfhId);
      await api.put(`/wfh/update/${wfhId}`, { status });
      fetchMyWFH();
    } catch (err) {
      console.error("Error updating WFH status:", err);
      alert(err?.response?.data?.message || "Failed to update WFH request");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="w-7 h-7 text-indigo-600" /> Work From Home
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Apply for a work-from-home day and track your requests.</p>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Apply for Work From Home</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 mb-1.5 block">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (half) setEndDate(e.target.value);
                    }}
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1.5 block">End Date</Label>
                  <Input
                    type="date"
                    value={half ? startDate : endDate}
                    min={startDate || undefined}
                    disabled={half}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={half ? "bg-gray-50 cursor-not-allowed" : ""}
                    required
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={half}
                  onChange={(e) => {
                    setHalf(e.target.checked);
                    if (e.target.checked && startDate) setEndDate(startDate);
                  }}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-amber-800">Apply as half day</span>
                  <span className="block text-xs text-amber-700 mt-0.5">Half-day WFH can only be applied for a single date and is counted as 0.5 day.</span>
                </span>
              </label>

              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">
                  Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea placeholder="Briefly describe your reason for working from home..." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required />
              </div>

              <div className="text-sm text-gray-600">
                Requested duration: <span className="font-semibold text-gray-900">{duration} day{duration === 1 ? "" : "s"}</span>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-5 text-sm font-medium">
                <Send className="w-3.5 h-3.5 mr-1.5" /> {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {monthlySummary.length > 0 && (
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-600" /> Monthly WFH Summary
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {monthlySummary.map((m) => (
                  <div key={m.label} className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
                    <p className="text-xs font-medium text-indigo-700">{m.label}</p>
                    <p className="text-lg font-bold text-indigo-900 mt-0.5">
                      {m.total} day{m.total === 1 ? "" : "s"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {teamRequests.length > 0 && (
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "my"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              My WFH Requests
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "team"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Team WFH Requests
              {teamRequests.filter((r) => r.status === "pending").length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {teamRequests.filter((r) => r.status === "pending").length}
                </span>
              )}
            </button>
          </div>
        )}

        {teamRequests.length > 0 && activeTab === "team" && (
          <div className="space-y-3">
            {teamRequests.map((r) => {
              const cfg = STATUS[r.status] || STATUS.pending;
              const h = isHalfDay(r);
              return (
                <div key={r.id} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} shadow-sm p-5`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                          {r.employee_name}
                        </span>
                        {h && <Badge className="border border-amber-200 bg-amber-50 text-amber-800">Half Day</Badge>}
                        <Badge className={`inline-flex items-center gap-1 border text-xs font-medium ${cfg.badge}`}>{cfg.icon}{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Home className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-medium">{formatDate(r.start_date)}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">{formatDate(r.end_date)}</span>
                      </div>
                      {r.reason && (
                        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-3.5 py-2.5">
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Reason</p>
                          <p className="text-sm text-gray-700">{r.reason}</p>
                        </div>
                      )}
                    </div>

                    {r.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          disabled={processingId === r.id}
                          onClick={() => handleTeamWfhAction(r.id, "approved")}
                          className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === r.id}
                          onClick={() => handleTeamWfhAction(r.id, "rejected")}
                          className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3 text-xs"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(teamRequests.length === 0 || activeTab === "my") && (
          <div>
            {teamRequests.length === 0 && (
              <h2 className="text-base font-semibold text-gray-900 mb-3">My Work From Home Requests</h2>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
                <Home className="w-9 h-9 mb-2 opacity-30" />
                <p className="text-sm font-medium">No requests yet</p>
                <p className="text-xs mt-1">Submit one above to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => {
                  const cfg = STATUS[r.status] || STATUS.pending;
                  const h = isHalfDay(r);
                  return (
                    <div key={r.id} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} shadow-sm p-5`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Home className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="font-medium">{formatDate(r.start_date)}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium">{formatDate(r.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {h && <Badge className="border border-amber-200 bg-amber-50 text-amber-800">Half Day</Badge>}
                          <Badge className={`inline-flex items-center gap-1 border text-xs font-medium ${cfg.badge}`}>{cfg.icon}{cfg.label}</Badge>
                        </div>
                      </div>
                      {r.reason && (
                        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-3.5 py-2.5">
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Reason</p>
                          <p className="text-sm text-gray-700">{r.reason}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WFHRequest;