import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  LogOut,
  Clock,
  MapPin,
  Calendar,
  Check,
  X,
  Filter
} from 'lucide-react';

const EmployeeDetails = ({ employee, onBack, onLogout }) => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [leaveComment, setLeaveComment] = useState('');
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(null);

  const attendanceRecords = [
    { id: 1, date: '2024-07-01', clockIn: '09:00 AM', clockOut: '05:30 PM', location: 'Office - Main Building', address: '123 Business St, Downtown', hoursWorked: 8.5 },
    { id: 2, date: '2024-06-30', clockIn: '08:45 AM', clockOut: '05:15 PM', location: 'Remote - Home Office', address: '456 Residential Ave', hoursWorked: 8.5 },
    { id: 3, date: '2024-06-29', clockIn: '09:15 AM', clockOut: '06:00 PM', location: 'Office - Meeting Room B', address: '123 Business St, Downtown', hoursWorked: 8.75 }
  ];

  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, type: 'Vacation', startDate: '2024-07-15', endDate: '2024-07-19', reason: 'Family vacation to beach resort', status: 'pending', submittedDate: '2024-07-01' },
    { id: 2, type: 'Sick Leave', startDate: '2024-06-20', endDate: '2024-06-20', reason: 'Doctor appointment', status: 'approved', submittedDate: '2024-06-18', adminComment: 'Approved. Hope you feel better!' },
    { id: 3, type: 'Personal', startDate: '2024-05-10', endDate: '2024-05-12', reason: 'Moving to new apartment', status: 'denied', submittedDate: '2024-05-05', adminComment: 'Please submit earlier notice for personal leave.' }
  ]);

  const filteredAttendance = attendanceRecords.filter(record => {
    if (!dateRange.start && !dateRange.end) return true;
    const recordDate = new Date(record.date);
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;
    if (startDate && recordDate < startDate) return false;
    if (endDate && recordDate > endDate) return false;
    return true;
  });

  const handleLeaveAction = (requestId, action) => {
    setLeaveRequests(prev => prev.map(request =>
      request.id === requestId ? {
        ...request,
        status: action === 'approve' ? 'approved' : 'denied',
        adminComment: leaveComment || undefined
      } : request
    ));
    setLeaveComment('');
    setSelectedLeaveRequest(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button onClick={onBack} variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{employee.avatar}</span>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{employee.name}</h1>
                  <p className="text-sm text-gray-600">{employee.position} • {employee.department}</p>
                </div>
              </div>
            </div>
            <Button onClick={onLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">Attendance Logs</TabsTrigger>
            <TabsTrigger value="leave">Leave Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input id="start-date" type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input id="end-date" type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {filteredAttendance.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Date</p>
                        <p className="text-lg font-semibold">{new Date(record.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Time</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span>{record.clockIn} - {record.clockOut}</span>
                        </div>
                        <p className="text-xs text-gray-500">{record.hoursWorked} hours worked</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Location</p>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium">{record.location}</p>
                            <p className="text-gray-500 text-xs">{record.address}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <Badge className="bg-green-100 text-green-800">Complete</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leave" className="space-y-6">
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          {request.type}
                        </h3>
                        <p className="text-sm text-gray-600">{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Reason</p>
                        <p className="text-sm">{request.reason}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Submitted</p>
                        <p className="text-sm text-gray-500">{new Date(request.submittedDate).toLocaleDateString()}</p>
                      </div>
                      {request.adminComment && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Admin Comment</p>
                          <p className="text-sm">{request.adminComment}</p>
                        </div>
                      )}
                      {request.status === 'pending' && (
                        <div className="border-t pt-4 space-y-3">
                          {selectedLeaveRequest === request.id ? (
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="comment">Comment (Optional)</Label>
                                <Textarea id="comment" placeholder="Add a comment for the employee..." value={leaveComment} onChange={(e) => setLeaveComment(e.target.value)} rows={3} />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => handleLeaveAction(request.id, 'approve')} className="bg-green-600 hover:bg-green-700">
                                  <Check className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                <Button onClick={() => handleLeaveAction(request.id, 'deny')} variant="destructive">
                                  <X className="w-4 h-4 mr-2" />
                                  Deny
                                </Button>
                                <Button onClick={() => setSelectedLeaveRequest(null)} variant="outline">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button onClick={() => setSelectedLeaveRequest(request.id)} variant="outline">
                              Review Request
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployeeDetails;
