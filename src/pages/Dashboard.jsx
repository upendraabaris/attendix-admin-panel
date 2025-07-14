import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Clock, Calendar, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  // Mock data
  const stats = {
    totalEmployees: 156,
    todayClockIns: 134,
    pendingLeaveRequests: 8,
    onlineEmployees: 142
  };

  const recentClockIns = [
    { name: 'Sarah Johnson', time: '9:15 AM', location: 'Office - Floor 2' },
    { name: 'Michael Chen', time: '9:02 AM', location: 'Remote - Home' },
    { name: 'Emily Davis', time: '8:45 AM', location: 'Office - Floor 1' },
    { name: 'James Wilson', time: '8:30 AM', location: 'Office - Floor 3' },
  ];

  const leaveRequests = [
    { name: 'Alex Thompson', type: 'Vacation', dates: 'Dec 20-25', days: 5 },
    { name: 'Lisa Rodriguez', type: 'Sick Leave', dates: 'Dec 18', days: 1 },
    { name: 'David Kim', type: 'Personal', dates: 'Dec 22-23', days: 2 },
  ];
  

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your employee overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Clock-ins</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayClockIns}</div>
              <p className="text-xs text-muted-foreground">86% attendance rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Leave Requests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingLeaveRequests}</div>
              <p className="text-xs text-muted-foreground">Requires your attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Now</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onlineEmployees}</div>
              <p className="text-xs text-muted-foreground">91% of total staff</p>
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
                {recentClockIns.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.location}</p>
                    </div>
                    <span className="text-sm font-medium text-green-600">{item.time}</span>
                  </div>
                ))}
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
                    <span className="text-sm font-medium text-orange-600">{item.days} days</span>
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
