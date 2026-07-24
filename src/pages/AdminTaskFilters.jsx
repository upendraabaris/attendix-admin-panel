import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import api from "../hooks/useApi";
import { toast } from "sonner";
import { Search, Filter, RotateCcw } from "lucide-react";

// Small helper -> avoids repeating the same formatting logic for Started/Ended At
const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Small helper -> avoids repeating the tracked-duration calculation
const getTrackedDuration = (startedAt, endedAt) => {
  if (!startedAt) return "-";
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);

  const totalSeconds = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return `${hrs}h ${mins}m ${secs}s ${!endedAt ? "(Live)" : ""}`;
};

// Admin-only view: filter any employee's tasks by User, Date, Status.
// Default (no filters applied) -> last 7 days, all employees, desc order.
const AdminTaskFilters = () => {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Tracks the in-flight request so a stale (slow) response can't overwrite a newer one
  const abortControllerRef = useRef(null);

  // Fetch employee list for the dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/employee/getEmployees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployees(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  const fetchTasks = useCallback(async () => {
    // Cancel any previous in-flight request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = {};

      if (selectedEmployee !== "all") params.employee_id = selectedEmployee;
      if (selectedDate) params.date = selectedDate;
      if (selectedStatus !== "all") params.status = selectedStatus;

      const res = await api.get("/task/admin/tasks/last-7-days", {
        headers: { Authorization: `Bearer ${token}` },
        params,
        signal: controller.signal,
      });

      setTasks(res.data?.data || []);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        console.error("Error fetching tasks:", err);
        toast.error("Failed to load tasks");
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedEmployee, selectedDate, selectedStatus]);

  useEffect(() => {
    fetchTasks();
    return () => abortControllerRef.current?.abort();
  }, [fetchTasks]);

  const resetFilters = () => {
    setSelectedEmployee("all");
    setSelectedDate("");
    setSelectedStatus("all");
  };

  // Memoized so it doesn't get recreated every render (and filteredTasks tracks it correctly)
  const getEmployeeName = useCallback(
    (id) => {
      const emp = employees.find((e) => String(e.id) === String(id));
      return emp?.name || `#${id}`;
    },
    [employees]
  );

  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return tasks;
    const term = searchTerm.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title?.toLowerCase().includes(term) ||
        getEmployeeName(t.employee_id).toLowerCase().includes(term) ||
        t.workspace_name?.toLowerCase().includes(term)
    );
  }, [tasks, searchTerm, getEmployeeName]);

  return (
    <div className="bg-transparent h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">All Employees' Tasks</h1>
            <p className="text-sm text-gray-500 mt-1">
              Showing last 7 days by default. Use filters to narrow the results.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </div>

          {/* User Filter */}
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-1.5 border-0 border-b-2 border-gray-200 bg-transparent text-sm text-gray-700 font-medium focus:outline-none focus:border-blue-500 transition-colors cursor-pointer min-w-[150px]"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border-0 border-b-2 border-gray-200 bg-transparent text-sm text-gray-700 font-medium focus:outline-none focus:border-blue-500 transition-colors"
          />

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 border-0 border-b-2 border-gray-200 bg-transparent text-sm text-gray-700 font-medium focus:outline-none focus:border-blue-500 transition-colors cursor-pointer min-w-[120px]"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>

          {(selectedEmployee !== "all" || selectedDate || selectedStatus !== "all") && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center p-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
            No tasks found for the selected filters.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b">
                  <tr>
                    <th className="px-4 py-3">Task Title</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Workspace</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Started At</th>
                    <th className="px-4 py-3">Ended At</th>
                    <th className="px-4 py-3">Tracked</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{task.title}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">
                        {getEmployeeName(task.employee_id)}
                      </td>
                      <td className="px-4 py-3">{task.workspace_name || "-"}</td>
                      <td className="px-4 py-3 capitalize">{task.task_type || "daily"}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDateTime(task.started_at)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDateTime(task.ended_at)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-purple-700">
                        {getTrackedDuration(task.started_at, task.ended_at)}
                      </td>
                      <td className="px-4 py-3">{task.due_date || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            task.status === "closed"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {task.status || "open"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTaskFilters;