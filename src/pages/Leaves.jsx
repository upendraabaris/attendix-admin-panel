import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select'
import { CheckCircle, XCircle, Hourglass, Filter, Search } from 'lucide-react'
import api from '../hooks/useApi'

const Leaves = () => {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [leaves,setLeaves] = useState([]);

  const fetchLeaves = async () => {
    try {
      const res = await api.get(`/leave/get`,
    //     {
    //     headers:{
    //         Authorization: `Bearer ${user.token}`
    //     }
    //   }
      );
      console.log(res);
      setLeaves(res.data.data);
    } catch (err) {
      console.error("Error fetching client list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const leaveRequests = [
    {
      id: 1,
      employeeName: 'Sarah Johnson',
      employeeId: 1,
      type: 'Vacation',
      startDate: '2024-02-15',
      endDate: '2024-02-20',
      days: 5,
      status: 'pending',
      reason: 'Family vacation to Hawaii',
      submittedDate: '2024-01-10',
      avatar: '👩‍💼'
    },
    {
      id: 2,
      employeeName: 'Michael Chen',
      employeeId: 2,
      type: 'Sick Leave',
      startDate: '2024-01-18',
      endDate: '2024-01-19',
      days: 2,
      status: 'pending',
      reason: 'Flu symptoms',
      submittedDate: '2024-01-17',
      avatar: '👨‍💻'
    },
    {
      id: 3,
      employeeName: 'Emily Davis',
      employeeId: 3,
      type: 'Personal',
      startDate: '2024-01-22',
      endDate: '2024-01-23',
      days: 2,
      status: 'approved',
      reason: 'Family emergency',
      submittedDate: '2024-01-15',
      adminComment: 'Approved due to family emergency',
      avatar: '👩‍🏫'
    },
    {
      id: 4,
      employeeName: 'James Wilson',
      employeeId: 4,
      type: 'Vacation',
      startDate: '2024-01-10',
      endDate: '2024-01-12',
      days: 3,
      status: 'denied',
      reason: 'Weekend getaway',
      submittedDate: '2024-01-05',
      adminComment: 'Insufficient notice period',
      avatar: '👨‍💼'
    }
  ]

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesSearch =
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.type.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const handleLeaveAction = async(requestId, action, comment) => {
    // console.log(`${action} leave request ${requestId}`, comment)
    // implement leave approval/denial logic here

    try {
    const res = await api.put(
      `/leave/update/${requestId}`,
      {
        status: action,         // "approved" or "rejected"
        comment: comment || "", // Optional comment
        id:1
      }
      // If you're using auth:
      // , { headers: { Authorization: `Bearer ${user.token}` } }
    );

    console.log("✅ Leave updated:", res.data);
    // Optional: refresh leave list
    fetchLeaves(); // if you have this function

  } catch (err) {
    console.error("❌ Failed to update leave request", err);
  }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'pending':
        return <Hourglass className="w-4 h-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'denied':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-600">Manage employee leave requests</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by employee name or leave type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {leaves.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{request.avatar}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{request.employee_name}</CardTitle>
                        {getStatusIcon(request.status)}
                        <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {request.type} • {request.days} day{request.days > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Start Date</p>
                      <p className="text-sm text-gray-900">
                        {new Date(request.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">End Date</p>
                      <p className="text-sm text-gray-900">
                        {new Date(request.end_date).toLocaleDateString()}
                      </p>
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
                        <Textarea
                          id={`comment-${request.id}`}
                          placeholder="Add a comment..."
                          rows={3}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleLeaveAction(request.id, 'approved','done')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleLeaveAction(request.id, 'rejected','done')}
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
        </div>

        {filteredRequests.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No leave requests found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}

export default Leaves
