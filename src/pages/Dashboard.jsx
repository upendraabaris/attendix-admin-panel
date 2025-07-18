import api from "../hooks/useApi";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Users, Clock, Calendar, CheckCircle } from "lucide-react";

const Dashboard = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayClockIns: 0,
    pendingLeaveRequests: 0,
    onlineEmployees: 0,
  });

  const [todayClockIns, setTodayClockIns] = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    const fetchDashboardData = async () => {
      try {
        // Clock-ins
        const clockRes = await api.get(
          `/attendance/admin/all-employee-attendance?startDate=${today}&endDate=${today}`
        );
        const clockData = await clockRes.data;

        let todayClockIns = [];
        if (clockData.data) {
          todayClockIns = clockData.data
            .filter((record) => record.type === "in")
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map((item) => ({
              name: item.employee_name,
              location: item.address || "Office",
              time: new Date(item.timestamp).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                // ❌ Removed timeZone
              }),
            }));
        }

        // Total Employees
        const empRes = await api.get("/employee/getEmployees");
        const empData = await empRes.data;

        setTodayClockIns(todayClockIns);
        setStats((prev) => ({
          ...prev,
          todayClockIns: todayClockIns.length,
          onlineEmployees: todayClockIns.length,
          totalEmployees: empData.length || 0,
        }));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  // Pending Leave Requests
  useEffect(() => {
    const fetchPendingLeaves = async () => {
      try {
        const response = await api.get("/leave/admin/leave-requests/pending");

        // Directly extract data
        const data = response.data;

        if (response.status === 200 && data.success) {
          const formatted = data.data.map((item) => {
            const start = new Date(item.start_date);
            const end = new Date(item.end_date);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            const options = { month: "short", day: "numeric" };
            const dateString =
              start.toDateString() === end.toDateString()
                ? start.toLocaleDateString("en-US", options)
                : `${start.toLocaleDateString(
                    "en-US",
                    options
                  )} - ${end.toLocaleDateString("en-US", options)}`;

            return {
              name: item.employee_name,
              type: item.type,
              dates: dateString,
              days: days,
            };
          });

          setLeaveRequests(formatted);
          setStats((prev) => ({
            ...prev,
            pendingLeaveRequests: formatted.length,
          }));
        } else {
          console.error("Failed to fetch pending leaves:", data.message);
        }
      } catch (err) {
        console.error("Error fetching leave requests:", err.message || err);
      }
    };

    fetchPendingLeaves();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's your employee overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground"></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Clock-ins
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayClockIns}</div>
              <p className="text-xs text-muted-foreground"></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Leave Requests
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pendingLeaveRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires your attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Now</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onlineEmployees}</div>
              <p className="text-xs text-muted-foreground"></p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Clock-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayClockIns.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No clock-ins yet for today.
                  </p>
                ) : (
                  todayClockIns.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.location}</p>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {item.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded bg-yellow-50"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.type} - {item.dates}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-orange-600">
                      {item.days} days
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
