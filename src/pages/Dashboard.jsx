import api from "../hooks/useApi";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  Users,
  Clock,
  CalendarRange,
  CheckCircle,
  MapPin,
  Hourglass,
  LayoutDashboard,
  Home,
  XCircle,
  Trophy,
} from "lucide-react";

const getInitials = (name) =>
  (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const formatToday = () =>
  new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// Local date parts (never toISOString) so the default range is not shifted by UTC.
const getFirstDayOfMonth = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-01`;
};

const getToday = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate()
  ).padStart(2, "0")}`;
};

const Dashboard = () => {
  const [todayClockIns, setTodayClockIns] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [wfhRequests, setWfhRequests] = useState([]);
  const [wfhActioningId, setWfhActioningId] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayClockIns: 0,
    pendingLeaveRequests: 0,
    pendingWFHRequests: 0,
    onlineEmployees: 0,
  });

  const orgID = localStorage.getItem("orgID");

  // ── Reward ranking (independent of the existing dashboard fetches) ────────
  const [rankingEnabled, setRankingEnabled] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  // Visibility is decided once, after the first response. Keeping this separate
  // from rankingLoading means later refetches never unmount the widget — if they
  // did, the date inputs would be destroyed mid-interaction (closing the native
  // picker) and the page would jump as the section collapsed.
  const [rankingInitialized, setRankingInitialized] = useState(false);
  const [rankingRange, setRankingRange] = useState({
    from: getFirstDayOfMonth(),
    to: getToday(),
  });

  useEffect(() => {
    let cancelled = false;

    // A date input reports an empty value while the user is still completing it.
    // Skip those interim states instead of querying with a blank range.
    if (!rankingRange.from || !rankingRange.to) return undefined;

    const fetchRanking = async () => {
      try {
        setRankingLoading(true);
        const res = await api.get("/rewards/ranking", {
          params: { from: rankingRange.from, to: rankingRange.to },
        });
        if (cancelled) return;
        setRankingEnabled(Boolean(res?.data?.rewardSystemEnabled));
        setRanking(Array.isArray(res?.data?.data) ? res.data.data : []);
      } catch {
        if (cancelled) return;
        // Reward ranking is additive — never disturb the rest of the dashboard.
        setRankingEnabled(false);
        setRanking([]);
      } finally {
        if (!cancelled) {
          setRankingLoading(false);
          setRankingInitialized(true);
        }
      }
    };

    fetchRanking();
    return () => {
      cancelled = true;
    };
  }, [rankingRange.from, rankingRange.to]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    const fetchDashboardData = async () => {
      try {
        const clockRes = await api.get(
          `/attendance/admin/all-employee-attendance?startDate=${today}&endDate=${today}&organizationId=${orgID}`
        );
        const clockData = clockRes.data;

        let clockIns = [];
        if (clockData.data) {
          clockIns = clockData.data
            .filter((r) => r.clock_in)
            .sort(
              (a, b) =>
                new Date(`1970-01-01T${b.clock_in}`) -
                new Date(`1970-01-01T${a.clock_in}`)
            )
            .map((item) => ({
              name: item.employee_name,
              location: item.clock_in_address || "Office",
              time: item.clock_in,
            }));
        }

        const empRes = await api.get("/employee/getEmployees");
        const empData = empRes.data.data || [];
        const activeInOrg = empData.filter(
          (emp) => emp.organization_id == orgID && emp.status === "active"
        );

        setTodayClockIns(clockIns);
        setStats((prev) => ({
          ...prev,
          todayClockIns: clockIns.length,
          onlineEmployees: clockIns.length,
          totalEmployees: activeInOrg.length,
        }));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [orgID]);

  useEffect(() => {
    const fetchPendingLeaves = async () => {
      try {
        const response = await api.get("/leave/admin/leave-requests/pending");
        const data = response.data;
        if (response.status === 200 && data.success) {
          const formatted = data.data.map((item) => {
            const start = new Date(item.start_date);
            const end = new Date(item.end_date);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            const opts = { month: "short", day: "numeric" };
            const dates =
              start.toDateString() === end.toDateString()
                ? start.toLocaleDateString("en-US", opts)
                : `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
            return {
              name: item.employee_name,
              type: item.type,
              dates,
              days,
              organizationID: item.organization_id,
            };
          });
          const filtered = formatted.filter((l) => l.organizationID == orgID);
          setLeaveRequests(filtered);
          setStats((prev) => ({ ...prev, pendingLeaveRequests: filtered.length }));
        }
      } catch (err) {
        console.error("Error fetching leave requests:", err.message || err);
      }
    };
    fetchPendingLeaves();
  }, [orgID]);

  const fetchPendingWFH = async () => {
    try {
      const response = await api.get("/wfh/admin/wfh-requests/pending");
      const data = response.data;
      if (response.status === 200 && data.success) {
        const formatted = data.data.map((item) => {
          const start = new Date(item.start_date);
          const end = new Date(item.end_date);
          const days = item.is_half_day
            ? 0.5
            : Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          const opts = { month: "short", day: "numeric" };
          const dates =
            start.toDateString() === end.toDateString()
              ? start.toLocaleDateString("en-US", opts)
              : `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
          return {
            id: item.id,
            name: item.employee_name,
            dates,
            days,
            organizationID: item.organization_id,
          };
        });
        const filtered = formatted.filter((r) => r.organizationID == orgID);
        setWfhRequests(filtered);
        setStats((prev) => ({ ...prev, pendingWFHRequests: filtered.length }));
      }
    } catch (err) {
      console.error("Error fetching WFH requests:", err.message || err);
    }
  };

  useEffect(() => {
    fetchPendingWFH();
  }, [orgID]);

  const handleWfhAction = async (id, action) => {
    setWfhActioningId(id);
    try {
      await api.put(`/wfh/update/${id}`, { status: action });
      fetchPendingWFH();
    } catch (err) {
      console.error("Failed to update WFH request", err);
    } finally {
      setWfhActioningId(null);
    }
  };

  const STAT_CARDS = [
    {
      label: "Team Members",
      value: stats.totalEmployees,
      icon: <Users className="w-5 h-5 text-indigo-600" />,
      bg: "bg-indigo-50",
      sub: "Active members",
    },
    {
      label: "Today's Clock-ins",
      value: stats.todayClockIns,
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-50",
      sub: `of ${stats.totalEmployees} team members`,
    },
    {
      label: "Pending Leaves",
      value: stats.pendingLeaveRequests ?? 0,
      icon: <Hourglass className="w-5 h-5 text-yellow-600" />,
      bg: "bg-yellow-50",
      sub: "Awaiting approval",
    },
    {
      label: "Pending WFH",
      value: stats.pendingWFHRequests ?? 0,
      icon: <Home className="w-5 h-5 text-purple-600" />,
      bg: "bg-purple-50",
      sub: "Awaiting approval",
    },
    {
      label: "Online Now",
      value: stats.onlineEmployees,
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      bg: "bg-green-50",
      sub: "Clocked in today",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutDashboard className="w-7 h-7 text-indigo-600" />
              Dashboard
            </h1>
            <p className="text-gray-500 mt-1 text-sm">{formatToday()}</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {STAT_CARDS.map(({ label, value, icon, bg, sub }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4"
            >
              <div className={`p-2.5 rounded-lg ${bg} shrink-0`}>{icon}</div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs font-medium text-gray-700 truncate">{label}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Three-panel activity section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Clock-ins */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-800">Today's Clock-ins</h2>
              </div>
              <span className="text-xs font-medium text-gray-400">
                {todayClockIns.length} record{todayClockIns.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {todayClockIns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Clock className="w-8 h-8 mb-2 opacity-25" />
                  <p className="text-sm font-medium">No clock-ins yet</p>
                  <p className="text-xs mt-1">Check back later today.</p>
                </div>
              ) : (
                todayClockIns.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(item.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-400 truncate">{item.location}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-0.5 whitespace-nowrap shrink-0">
                      {item.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Leave Requests */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-yellow-500" />
                <h2 className="text-sm font-semibold text-gray-800">Pending Leave Requests</h2>
              </div>
              <span className="text-xs font-medium text-gray-400">
                {leaveRequests.length} pending
              </span>
            </div>

            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {leaveRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <CalendarRange className="w-8 h-8 mb-2 opacity-25" />
                  <p className="text-sm font-medium">No pending requests</p>
                  <p className="text-xs mt-1">All leave requests are handled.</p>
                </div>
              ) : (
                leaveRequests.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-yellow-50/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(item.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-200 rounded-full px-2 py-0.5 capitalize">
                          {item.type}
                        </span>
                        <p className="text-xs text-gray-400">{item.dates}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-orange-700 bg-orange-100 border border-orange-200 rounded-full px-2.5 py-0.5 whitespace-nowrap shrink-0">
                      {item.days}d
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Work From Home Requests */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-semibold text-gray-800">Pending Work From Home</h2>
              </div>
              <span className="text-xs font-medium text-gray-400">
                {wfhRequests.length} pending
              </span>
            </div>

            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {wfhRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Home className="w-8 h-8 mb-2 opacity-25" />
                  <p className="text-sm font-medium">No pending requests</p>
                  <p className="text-xs mt-1">All WFH requests are handled.</p>
                </div>
              ) : (
                wfhRequests.map((item, index) => {
                  const isActioning = wfhActioningId === item.id;
                  return (
                    <div
                      key={index}
                      className="px-5 py-3.5 hover:bg-purple-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {getInitials(item.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.dates}</p>
                        </div>
                        <span className="text-xs font-semibold text-purple-700 bg-purple-100 border border-purple-200 rounded-full px-2.5 py-0.5 whitespace-nowrap shrink-0">
                          {item.days}d
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2.5 pl-11">
                        <button
                          type="button"
                          disabled={isActioning}
                          onClick={() => handleWfhAction(item.id, "approved")}
                          className="inline-flex items-center gap-1 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium px-2.5 py-1 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={isActioning}
                          onClick={() => handleWfhAction(item.id, "rejected")}
                          className="inline-flex items-center gap-1 rounded-md bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-medium px-2.5 py-1 transition-colors"
                        >
                          <XCircle className="w-3 h-3" /> Deny
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Employee Reward Ranking — only rendered while the reward system is enabled.
            Gated on rankingInitialized (not rankingLoading) so refetches triggered by
            the date inputs keep this section mounted. */}
        {rankingInitialized && rankingEnabled && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-gray-900">Employee Reward Ranking</h2>
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wide">
                    From
                  </label>
                  <input
                    type="date"
                    value={rankingRange.from}
                    onChange={(e) =>
                      setRankingRange((prev) => ({ ...prev, from: e.target.value }))
                    }
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wide">
                    To
                  </label>
                  <input
                    type="date"
                    value={rankingRange.to}
                    onChange={(e) =>
                      setRankingRange((prev) => ({ ...prev, to: e.target.value }))
                    }
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {rankingLoading ? (
              <div className="p-8 text-center text-sm text-gray-500">Updating ranking…</div>
            ) : ranking.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No employees to rank for the selected period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 pl-5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 w-20">
                        Rank
                      </th>
                      <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Employee
                      </th>
                      <th className="py-3 pr-5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Reward Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((row, idx) => (
                      <tr
                        key={row.employee_id}
                        className={`border-t border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <td className="py-3 pl-5">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-indigo-50 text-indigo-700 text-sm font-semibold">
                            {row.rank}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                              {getInitials(row.employee_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {row.employee_name}
                              </p>
                              {row.email && (
                                <p className="text-xs text-gray-400 truncate">{row.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-5 text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {row.reward_points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;