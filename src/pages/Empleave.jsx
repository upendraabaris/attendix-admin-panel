import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../hooks/useApi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

function Empleave() {
  const { id } = useParams(); // employee id from route
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // ✅ status filter

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leave/get`);
      const empLeaves = res.data.data.filter(
        (leave) => String(leave.employee_id) === String(id)
      );
      setLeaves(empLeaves);

      if (empLeaves.length > 0) {
        setEmployeeName(empLeaves[0].employee_name);
      }
    } catch (err) {
      console.error("Error fetching leaves", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [id]);

  // ✅ filter leaves by status
  const filteredLeaves = leaves.filter((leave) => {
    return statusFilter === "all" || leave.status === statusFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border border-red-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with filter */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {employeeName
              ? `Showing leave history for ${employeeName}`
              : `Showing leave history`}
          </h1>

          {/* ✅ Status Filter Dropdown */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading && <p>Loading...</p>}

        {!loading && filteredLeaves.length === 0 && (
          <p className="text-gray-500">No leave history found.</p>
        )}

        <div className="space-y-4">
          {filteredLeaves.map((leave) => (
            <Card
              key={leave.id}
              className="shadow-md hover:shadow-lg transition"
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  {leave.type.toUpperCase()} Leave
                </CardTitle>
                <Badge className={getStatusColor(leave.status)}>
                  {leave.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Reason:</span>{" "}
                  {leave.reason || "N/A"}
                </p>
                {/* ✅ Dates ek hi line me */}
                <div className="flex flex-wrap gap-6 text-sm text-gray-700">
                  <span>
                    <span className="font-medium">Start:</span>{" "}
                    {new Date(leave.start_date).toLocaleDateString()}
                  </span>
                  <span>
                    <span className="font-medium">End:</span>{" "}
                    {new Date(leave.end_date).toLocaleDateString()}
                  </span>
                  <span>
                    <span className="font-medium">Applied:</span>{" "}
                    {new Date(leave.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Empleave;
