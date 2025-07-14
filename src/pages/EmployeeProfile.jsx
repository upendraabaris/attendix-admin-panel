import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft, Edit, MapPin, Clock, Calendar,
  CheckCircle, XCircle, Hourglass
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const employee = {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'Marketing Manager',
    department: 'Marketing',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, New York, NY 10001',
    status: 'active',
    avatar: '👩‍💼',
    joinDate: '2023-01-15'
  };

  const attendanceRecords = [
    {
      id: 1,
      date: '2024-01-15',
      clockIn: '09:00 AM',
      clockOut: '05:30 PM',
      location: 'Office - Floor 2',
      address: '456 Business Ave, New York, NY',
      hours: 8.5
    },
    {
      id: 2,
      date: '2024-01-14',
      clockIn: '08:45 AM',
      clockOut: '05:15 PM',
      location: 'Remote - Home',
      address: '123 Main St, New York, NY',
      hours: 8.5
    },
    {
      id: 3,
      date: '2024-01-13',
      clockIn: '09:15 AM',
      clockOut: '06:00 PM',
      location: 'Office - Floor 2',
      address: '456 Business Ave, New York, NY',
      hours: 8.75
    }
  ];

  const leaveRequests = [
    {
      id: 1,
      type: 'Vacation',
      startDate: '2024-02-15',
      endDate: '2024-02-20',
      days: 5,
      status: 'pending',
      reason: 'Family vacation to Hawaii',
      submittedDate: '2024-01-10'
    },
    {
      id: 2,
      type: 'Sick Leave',
      startDate: '2024-01-08',
      endDate: '2024-01-08',
      days: 1,
      status: 'approved',
      reason: 'Doctor appointment',
      submittedDate: '2024-01-07',
      adminComment: 'Approved for medical appointment'
    },
    {
      id: 3,
      type: 'Personal',
      startDate: '2023-12-22',
      endDate: '2023-12-23',
      days: 2,
      status: 'approved',
      reason: 'Personal matters',
      submittedDate: '2023-12-15',
      adminComment: 'Approved for end of year time off'
    }
  ];

  const handleLeaveAction = (leaveId, action, comment) => {
    console.log(`${action} leave request ${leaveId}`, comment);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'denied':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Hourglass className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/employees')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Employees
            </Button>
          </div>
          <Button onClick={() => navigate(`/employees/edit/${id}`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Employee
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="text-4xl">{employee.avatar}</div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
                <p className="text-gray-600">{employee.role} • {employee.department}</p>
                <p className="text-sm text-gray-500">{employee.email}</p>
                <p className="text-sm text-gray-500">{employee.phone}</p>
                <div className="mt-2">
                  <Badge className={getStatusColor(employee.status)}>
                    {employee.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="attendance">Attendance Logs</TabsTrigger>
            <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, start: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, end: e.target.value }))
                      }
                    />
                  </div>
                  <Button>Filter</Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {attendanceRecords.map((record) => (
                <Card key={record.id}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">Date</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{record.clockIn} - {record.clockOut}</p>
                          <p className="text-sm text-gray-500">{record.hours} hours</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{record.location}</p>
                          <p className="text-sm text-gray-500">Location</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-sm text-gray-500">{record.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaves" className="space-y-4">
            {leaveRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(request.status)}
                      <CardTitle className="text-lg">{request.type}</CardTitle>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.days} day{request.days > 1 ? 's' : ''}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Start Date</p>
                        <p className="text-sm text-gray-900">{new Date(request.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">End Date</p>
                        <p className="text-sm text-gray-900">{new Date(request.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Reason</p>
                      <p className="text-sm text-gray-900">{request.reason}</p>
                    </div>

                    {request.adminComment && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Admin Comment</p>
                        <p className="text-sm text-gray-900">{request.adminComment}</p>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className="space-y-2">
                          <Label htmlFor={`comment-${request.id}`}>Admin Comment (Optional)</Label>
                          <Textarea id={`comment-${request.id}`} placeholder="Add a comment..." rows={3} />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleLeaveAction(request.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleLeaveAction(request.id, 'deny')}
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Deny
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EmployeeProfile;
