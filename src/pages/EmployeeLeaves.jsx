import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

const LEAVE_TYPES = ["sick", "vacation", "personal", "other"];

function EmployeeLeaves() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveList, setLeaveList] = useState([]);
  const [formData, setFormData] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get("/leave/my");
      setLeaveList(res?.data?.data || []);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      toast.error("Unable to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.startDate || !formData.endDate) {
      toast.error("Type, start date and end date are required");
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End date cannot be before start date");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/leave", formData);
      toast.success("Leave request submitted");
      setFormData({
        type: "",
        startDate: "",
        endDate: "",
        reason: "",
      });
      fetchMyLeaves();
    } catch (error) {
      console.error("Error submitting leave:", error);
      toast.error(error?.response?.data?.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "approved") return "bg-green-100 text-green-800";
    if (status === "rejected") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Request</h1>
          <p className="text-gray-600">Apply for leave and track your requests</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Apply Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Leave Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Start Date</label>
                <Input
                  type="date"
                  min={today}
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">End Date</label>
                <Input
                  type="date"
                  min={formData.startDate || today}
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Reason (optional)</label>
                <Textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Write reason for leave"
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Leave Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-gray-500">Loading leave requests...</p>
            ) : leaveList.length === 0 ? (
              <p className="text-gray-500">No leave requests found.</p>
            ) : (
              leaveList.map((leave) => (
                <div
                  key={leave.leave_id || leave.id}
                  className="border rounded-lg p-3 bg-gray-50 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{String(leave.type || "").toUpperCase()} Leave</p>
                    <p className="text-sm text-gray-600">
                      {leave.start_date} to {leave.end_date}
                    </p>
                    <p className="text-sm text-gray-500">{leave.reason || "No reason"}</p>
                  </div>
                  <Badge className={getStatusClass(leave.status)}>{leave.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default EmployeeLeaves;
