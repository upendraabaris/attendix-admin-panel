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

const Dashboard = () => {
  const [todayClockIns, setTodayClockIns] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayClockIns: 0,
    pendingLeaveRequests: 0,
    onlineEmployees: 0,
  });

  const orgID = localStorage.getItem("orgID");

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

  const STAT_CARDS = [
    {
      label: "Total Employees",
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
      sub: `of ${stats.totalEmployees} employees`,
    },
    {
      label: "Pending Leaves",
      value: stats.pendingLeaveRequests ?? 0,
      icon: <Hourglass className="w-5 h-5 text-yellow-600" />,
      bg: "bg-yellow-50",
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Two-panel activity section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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

        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
