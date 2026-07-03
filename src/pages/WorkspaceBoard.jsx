import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { PlusCircle, Search, Filter, ArrowUpDown, Mic } from "lucide-react";
import Layout from "../components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import api from "../hooks/useApi";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"; // ✅ New
import { toast } from "sonner"; // ✅ Toast import

const WEEKDAY_OPTIONS = [
  { key: "sun", label: "Sun" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
];

const currentUser = localStorage.getItem("employee_name");

// ✅ Modal Component (unchanged)
const AddTaskModal = ({
  isOpen,
  onClose,
  workspace_id,
  workspace_name,
  onTaskAdded,
  onAuthFailure,
}) => {
  const [employees, setEmployees] = useState([]);
  const storedOrgID = localStorage.getItem("orgID");
  const orgID =
    storedOrgID && storedOrgID !== "undefined" && storedOrgID !== "null"
      ? storedOrgID
      : null;
  const [formData, setFormData] = useState({
    employee_id: "",
    title: "",
    due_date: new Date().toISOString().split("T")[0],
    description: "",
    attachment: null,
    recurrence_type: "none",
    recurrence_days: [],
    recurrence_end_date: "",
    monthly_day: "",
  });
  const [loading, setLoading] = useState(false);
  const keepOpenRef = React.useRef(false);
  const titleInputRef = React.useRef(null);

  const getOrgIdFromItem = (item) =>
    item?.organization_id ??
    item?.organizationId ??
    item?.organizationID ??
    item?.org_id ??
    null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (employees.length > 0 && isOpen && !formData.employee_id) {
      const currentUserName = localStorage.getItem("employee_name");
      if (currentUserName) {
        const myEmp = employees.find(e => String(e.name).toLowerCase() === String(currentUserName).toLowerCase());
        if (myEmp) {
          setFormData(prev => ({ ...prev, employee_id: myEmp.id }));
        }
      }
    }
  }, [employees, isOpen]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/employee/getEmployees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allEmployees = res.data?.data || [];
        const hasOrgOnPayload = allEmployees.some((emp) => getOrgIdFromItem(emp) != null);
        const orgEmployees =
          orgID && hasOrgOnPayload
            ? allEmployees.filter(
              (emp) => String(getOrgIdFromItem(emp)) === String(orgID)
            )
            : allEmployees;

        setEmployees(orgEmployees);
      } catch (err) {
        if ([401, 403].includes(err.response?.status)) {
          onAuthFailure?.();
          return;
        }
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, []);


  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const toggleWeekday = (day) => {
    setFormData((prev) => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(day)
        ? prev.recurrence_days.filter((d) => d !== day)
        : [...prev.recurrence_days, day],
    }));
  };

  const handleRecurrenceTypeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      recurrence_type: value,
      recurrence_days: value === "weekly" ? prev.recurrence_days : [],
      recurrence_end_date: value === "none" ? "" : prev.recurrence_end_date,
      monthly_day:
        value === "monthly"
          ? prev.monthly_day || (prev.due_date ? String(new Date(prev.due_date).getDate()) : "")
          : "",
    }));
  };

  const validateForm = () => {
    if (formData.recurrence_type === "weekly" && formData.recurrence_days.length === 0) {
      toast.error("Select at least one weekday for weekly recurrence");
      return false;
    }

    if (formData.recurrence_type !== "none" && !formData.recurrence_end_date) {
      toast.error("End date is required for recurring task");
      return false;
    }

    if (formData.recurrence_type === "monthly") {
      const day = Number(formData.monthly_day);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        toast.error("Monthly date must be between 1 and 31");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const payload = {
        employee_id: formData.employee_id,
        title: formData.title,
        due_date: formData.due_date,
        description: formData.description,
        workspace_id,
        workspace_name,
        attachment: formData.attachment ? formData.attachment.name : "demo.pdf",
        recurrence_type: formData.recurrence_type,
        recurrence_days:
          formData.recurrence_type === "weekly" ? formData.recurrence_days.join(",") : null,
        recurrence_end_date:
          formData.recurrence_type === "none" ? null : formData.recurrence_end_date,
        monthly_day: formData.recurrence_type === "monthly" ? Number(formData.monthly_day) : null,
      };

      const res = await api.post("/task/assignTask", payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("🟢 RESPONSE:", res.data);
      toast.success(`${res?.data?.count || 1} task(s) added successfully!`);

      onTaskAdded();

      if (keepOpenRef.current) {
        // Keep modal open, clear only title and description
        setFormData((prev) => ({
          ...prev,
          title: "",
          description: "",
        }));
        // Refocus the title input
        setTimeout(() => {
          if (titleInputRef.current) titleInputRef.current.focus();
        }, 10);
      } else {
        // Normal submit, clear all and close
        setFormData({
          employee_id: "",
          title: "",
          due_date: new Date().toISOString().split("T")[0],
          description: "",
          attachment: null,
          recurrence_type: "none",
          recurrence_days: [],
          recurrence_end_date: "",
          monthly_day: "",
        });
        onClose();
      }
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        onAuthFailure?.();
        return;
      }
      console.error("❌ Error adding task:", error);
      toast.error("Failed to add task!");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">➕ Assign New Task</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Employee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded-md text-sm"
            >
              <option value="">Select Employee</option>
              {/* {employees.map((emp) => ( */}
              {employees.filter(emp => emp.status === "active").map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              ref={titleInputRef}
              value={formData.title}
              onChange={handleChange}
              required
              autoFocus
              className="w-full border px-3 py-2 rounded-md text-sm"
              placeholder="Enter task title"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  due_date: value,
                  monthly_day:
                    prev.recurrence_type === "monthly" && value
                      ? String(new Date(value).getDate())
                      : prev.monthly_day,
                }));
              }}
              required
              className="w-full border px-3 py-2 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
            <select
              name="recurrence_type"
              value={formData.recurrence_type}
              onChange={(e) => handleRecurrenceTypeChange(e.target.value)}
              className="w-full border px-3 py-2 rounded-md text-sm"
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {formData.recurrence_type === "weekly" && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Repeat on</p>
              <div className="flex flex-wrap gap-3">
                {WEEKDAY_OPTIONS.map((day) => (
                  <label key={day.key} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.recurrence_days.includes(day.key)}
                      onChange={() => toggleWeekday(day.key)}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.recurrence_type === "monthly" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Date (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                name="monthly_day"
                value={formData.monthly_day}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md text-sm"
                required
              />
            </div>
          )}

          {formData.recurrence_type !== "none" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="recurrence_end_date"
                value={formData.recurrence_end_date}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md text-sm"
                required
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full border px-3 py-2 rounded-md text-sm resize-none"
              placeholder="Enter task description..."
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={(e) => {
                keepOpenRef.current = true;
                handleSubmit(e);
              }}
              className="bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              Save & Add Another
            </Button>
            <Button
              type="submit"
              disabled={loading}
              onClick={() => { keepOpenRef.current = false; }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Add Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InlineInput = ({ value, placeholder, onSave, className, type = "text", step, disabled }) => {
  const [val, setVal] = useState(value || "");
  useEffect(() => setVal(value || ""), [value]);
  return (
    <input
      disabled={disabled}
      type={type}
      step={step}
      min={type === "number" ? "0" : undefined}
      value={val}
      onChange={e => {
        if (type === "number" && Number(e.target.value) < 0) return;
        setVal(e.target.value);
      }}
      onBlur={() => {
        let finalVal = val;
        if (type === "number" && Number(val) < 0) {
          finalVal = 0;
          setVal(0);
        }
        if (String(finalVal).trim() !== String(value || "").trim()) {
          onSave(finalVal);
        }
      }}
      placeholder={placeholder}
      className={className}
    />
  );
};

// ✅ Main Board Component
const WorkspaceBoard = () => {
  const { id, masterTaskId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const workspaceName = state?.workspaceName || `Workspace #${id}`;
  const masterTaskTitle = state?.masterTaskTitle || "";
  const storedOrgID = localStorage.getItem("orgID");
  const orgID =
    storedOrgID && storedOrgID !== "undefined" && storedOrgID !== "null"
      ? storedOrgID
      : null;
  const getOrgIdFromItem = (item) =>
    item?.organization_id ??
    item?.organizationId ??
    item?.organizationID ??
    item?.org_id ??
    item?.organization?.id ??
    null;

  const [tasksList, setTasksList] = useState([]);
  const [masterTasks, setMasterTasks] = useState([]);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("daily"); // "daily", "weekly", or "master"

  // Filters & Sorting
  const [showFilters, setShowFilters] = useState(false);
  const [filterEmployeeId, setFilterEmployeeId] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMasterTaskId, setFilterMasterTaskId] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "hours_high", "hours_low"

  // Quick Log Fields
  const [quickTitle, setQuickTitle] = useState("");
  const [quickHours, setQuickHours] = useState("");
  const [quickKpi, setQuickKpi] = useState("");
  const [quickTarget, setQuickTarget] = useState("");
  const [quickActual, setQuickActual] = useState("");
  const [quickRemark, setQuickRemark] = useState("");
  const [quickStatus, setQuickStatus] = useState("open");
  const [quickMasterTaskId, setQuickMasterTaskId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master Task Modal Fields
  const [mtTitle, setMtTitle] = useState("");
  const [mtDescription, setMtDescription] = useState("");
  const [mtStartDate, setMtStartDate] = useState("");
  const [mtEndDate, setMtEndDate] = useState("");
  const [mtAssignees, setMtAssignees] = useState([]);
  const [editMasterTaskId, setEditMasterTaskId] = useState(null);
  const [workspaceEmployees, setWorkspaceEmployees] = useState([]);

  const openMasterTaskModal = (task = null) => {
    if (task) {
      setEditMasterTaskId(task.id);
      setMtTitle(task.title || "");
      setMtDescription(task.description || "");
      setMtStartDate(task.start_date ? new Date(task.start_date).toISOString().split("T")[0] : "");
      setMtEndDate(task.end_date ? new Date(task.end_date).toISOString().split("T")[0] : "");
      setMtAssignees(task.assignees || []);
    } else {
      setEditMasterTaskId(null);
      setMtTitle("");
      setMtDescription("");
      
      const formatLocal = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      setMtStartDate(formatLocal(today));
      setMtEndDate(formatLocal(nextWeek));
      setMtAssignees([]);
    }
    setIsMasterModalOpen(true);
  };

  const handleAuthFailure = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("orgID");
    localStorage.removeItem("role");
    localStorage.removeItem("employee_name");
    navigate("/login");
  };

  // ✅ Fetch tasks from backend (using backend filtering)
  const fetchTasks = async () => {
    try {
      const queryParams = new URLSearchParams({
        workspace_id: id,
        sort_by: sortBy,
      });
      if (filterEmployeeId !== "all") queryParams.append("employee_id", filterEmployeeId);
      if (filterStatus !== "all") queryParams.append("status", filterStatus);
      if (filterMasterTaskId !== "all") queryParams.append("master_task_id", filterMasterTaskId);
      if (filterDateFrom) queryParams.append("start_date", filterDateFrom);
      if (filterDateTo) queryParams.append("end_date", filterDateTo);

      const token = localStorage.getItem("token");
      const res = await api.get(`/task/filter?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("📦 Filtered API Response:", res.data);
      setTasksList(res.data?.data || []);
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        handleAuthFailure();
        return;
      }
      console.error("❌ Error fetching tasks:", error);
      toast.error("Failed to fetch tasks!");
    }
  };

  const fetchMasterTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/master-task/workspace/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMasterTasks(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch master tasks");
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchMasterTasks();

    // Fetch employees for assignment
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/employee/getEmployees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allEmployees = res.data?.data || [];
        const hasOrgOnPayload = allEmployees.some((emp) => getOrgIdFromItem(emp) != null);
        const orgEmployees =
          orgID && hasOrgOnPayload
            ? allEmployees.filter(
              (emp) => String(getOrgIdFromItem(emp)) === String(orgID)
            )
            : allEmployees;
        setWorkspaceEmployees(orgEmployees.filter(emp => emp.status === "active"));
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, [id, filterEmployeeId, filterStatus, filterMasterTaskId, filterDateFrom, filterDateTo, sortBy]);

  const startListening = (setter, currentValue) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice recognition is not supported in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.start();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setter(currentValue ? `${currentValue} ${transcript}` : transcript);
    };
    recognition.onerror = (event) => console.error("Speech recognition error:", event.error);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return toast.error("Enter task title");
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await api.post("/task/quick-add", {
        title: quickTitle,
        hours_worked: activeTab === "daily" && quickHours ? parseFloat(quickHours) : 0,
        date: new Date().toISOString().split("T")[0],
        workspace_id: id,
        master_task_id: quickMasterTaskId || null,
        employee_id: null,
        task_type: activeTab,
        kpi: quickKpi,
        target_val: quickTarget,
        actual_result: quickActual,
        remark: quickRemark,
        status: quickStatus
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success("Task logged successfully!");
      setQuickTitle("");
      setQuickHours("");
      setQuickKpi("");
      setQuickTarget("");
      setQuickActual("");
      setQuickRemark("");
      setQuickStatus("open");
      setQuickMasterTaskId("");
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to log task. Database may need new columns.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMasterTask = async (e) => {
    e.preventDefault();
    if (!mtTitle.trim()) return toast.error("Title is required");
    
    if (mtStartDate && mtEndDate && new Date(mtEndDate) < new Date(mtStartDate)) {
      return toast.error("End Date cannot be earlier than Start Date");
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        workspace_id: id,
        title: mtTitle,
        description: mtDescription,
        start_date: mtStartDate,
        end_date: mtEndDate,
        assignees: mtAssignees
      };

      if (editMasterTaskId) {
        await api.put(`/master-task/update/${editMasterTaskId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Master task updated successfully");
      } else {
        await api.post("/master-task/create", payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Master task created successfully");
      }

      setMtTitle("");
      setMtDescription("");
      setMtStartDate("");
      setMtEndDate("");
      setMtAssignees([]);
      setEditMasterTaskId(null);
      setIsMasterModalOpen(false);
      fetchMasterTasks();
    } catch (err) {
      console.error(err);
      toast.error(editMasterTaskId ? "Failed to update master task" : "Failed to create master task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInlineUpdate = async (taskId, field, newValue) => {
    try {
      const token = localStorage.getItem("token");
      await api.post("/task/update-inline", {
        taskId,
        [field]: field === 'hours_worked' ? (parseFloat(newValue) || 0) : newValue
      }, { headers: { Authorization: `Bearer ${token}` } });

      // Optimistic local update
      setTasksList(prev => prev.map(t => t.task_id === taskId ? { ...t, [field]: newValue } : t));
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task");
    }
  };

  const normalizeDate = (value) => {
    if (!value) return null;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isCurrentOrFutureTask = (task) => {
    const taskDate = normalizeDate(task.due_date_iso || task.due_date);
    if (!taskDate) return false;
    const today = normalizeDate(new Date());
    return taskDate >= today;
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/task/${taskId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      toast.success("Task deleted successfully");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(error?.response?.data?.message || "Failed to delete task");
    }
  };


  const currentRole = localStorage.getItem("role") || "";
  const isUserAdmin = currentRole.toLowerCase().includes("admin");
  const myEmp = workspaceEmployees.find(e => String(e.name).toLowerCase() === String(currentUser).toLowerCase());
  const myEmpId = myEmp?.id;

  // Filter tasks based on search term
  const filteredTasks = tasksList.filter((t) => {
    const matchesTab = (t.task_type || "daily") === activeTab;
    const matchesSearch = [t.title, t.description, t.remark, t.kpi].some((v) =>
      (v || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesTab && matchesSearch;
  });

  const filteredMasterTasks = masterTasks.filter(t => {
    const matchesSearch = [t.title, t.description].some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()));

    let isAuthorized = isUserAdmin;
    if (!isUserAdmin) {
      if (t.assignees && t.assignees.length > 0) {
        isAuthorized = t.assignees.includes(myEmpId);
      } else {
        isAuthorized = true; // Unassigned master tasks are visible to all
      }
    }

    return matchesSearch && isAuthorized;
  });

  const totalHours = tasksList.reduce((sum, task) => sum + (parseFloat(task.hours_worked) || 0), 0);

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{workspaceName}</h1>
            <p className="text-gray-600 text-xs">Manage your project tasks and milestones</p>
          </div>

          {/* 
          <div className="flex bg-white rounded-lg p-1 border shadow-sm">
             <button 
               onClick={() => setViewMode("kanban")} 
               className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === "kanban" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
             >
                Kanban
             </button>
             <button 
               onClick={() => setViewMode("spreadsheet")} 
               className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === "spreadsheet" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
             >
                Spreadsheet
             </button>
          </div>
          */}

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-7 pr-3 py-1.5 text-xs border rounded-md focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-8 px-3 ${showFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-600 border-gray-200'}`}
            >
              <Filter className="w-3 h-3 mr-1" />
              <span className="text-xs">Filters</span>
            </Button>

            {activeTab === "master" && (
              <Button
                size="sm"
                onClick={() => openMasterTaskModal()}
                className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle className="w-3 h-3 mr-1" />
                <span className="text-xs">Add Master Task</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filters Drawer */}
        {showFilters && (
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-4 flex flex-wrap gap-4 items-end animate-in fade-in duration-200">
            {isUserAdmin && (
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Employee</label>
                <select
                  value={filterEmployeeId}
                  onChange={e => setFilterEmployeeId(e.target.value)}
                  className="w-full md:w-40 text-xs border border-gray-200 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Employees</option>
                  {workspaceEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Date From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full md:w-36 text-xs border border-gray-200 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Date To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-full md:w-36 text-xs border border-gray-200 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full md:w-32 text-xs border border-gray-200 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Master Task</label>
              <select
                value={filterMasterTaskId}
                onChange={e => setFilterMasterTaskId(e.target.value)}
                className="w-full md:w-40 text-xs border border-gray-200 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Master Tasks</option>
                {masterTasks.map(mt => (
                  <option key={mt.id} value={mt.id}>{mt.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full md:w-40 text-xs border border-gray-200 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="newest">Date: Newest First</option>
                <option value="oldest">Date: Oldest First</option>
                <option value="hours_high">Hours: High to Low</option>
                <option value="hours_low">Hours: Low to High</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterEmployeeId("all");
                setFilterStatus("all");
                setFilterMasterTaskId("all");
                setFilterDateFrom("");
                setFilterDateTo("");
                setSortBy("newest");
              }}
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* ✅ Tabs for Daily/Weekly/Master */}
        <div className="flex gap-6 border-b border-gray-200 mb-4 px-2">
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'daily' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ☀️ Daily Log
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'weekly' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📅 Weekly Log
          </button>
          <button
            onClick={() => setActiveTab('master')}
            className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'master' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🗂️ Master Tasks
          </button>
        </div>

        {filterMasterTaskId !== 'all' && activeTab !== 'master' && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">🗂️</span>
              <div>
                <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Filtered by Master Task</p>
                <p className="text-sm font-semibold text-purple-900">
                  {masterTasks.find(m => String(m.id) === String(filterMasterTaskId))?.title || 'Unknown Task'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setTasksList([]); // Clear stale data
                setFilterMasterTaskId('all');
                setQuickMasterTaskId(""); // Reset quick add selection
              }}
              className="text-xs bg-white text-purple-600 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-md font-bold transition-colors"
            >
              Clear Filter ✖
            </button>
          </div>
        )}

        {activeTab !== 'master' && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(e)}
                  placeholder={activeTab === 'daily' ? "Task (with KPI & Impact)" : "Task"}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-blue-500 border-blue-200 hover:bg-blue-50"
                  onClick={() => startListening(setQuickTitle, quickTitle)}
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>

              <select
                value={quickMasterTaskId}
                onChange={(e) => setQuickMasterTaskId(e.target.value)}
                className="w-full md:w-48 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
              >
                <option value="">No Master Task (Direct)</option>
                {filteredMasterTasks.map(mt => (
                  <option key={mt.id} value={mt.id}>{mt.title}</option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={quickStatus}
                onChange={(e) => setQuickStatus(e.target.value)}
                className="w-full md:w-32 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 font-semibold"
              >
                <option value="open">🟢 Open</option>
                <option value="in progress">🟡 In Progress</option>
                <option value="waiting">🟠 Waiting</option>
                <option value="closed">🔴 Closed</option>
              </select>

              {activeTab === 'daily' && (
                <input
                  type="number"
                  value={quickHours}
                  onChange={(e) => setQuickHours(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(e)}
                  placeholder="Est. Hours (e.g. 1.5)"
                  step="0.5"
                  min="0"
                  className="w-full md:w-40 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              )}
            </div>

            {activeTab === 'daily' ? (
              <div className="flex flex-col md:flex-row gap-3">
                <input type="text" value={quickKpi} onChange={e => setQuickKpi(e.target.value)} placeholder="KPI / Target" className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                <input type="text" value={quickActual} onChange={e => setQuickActual(e.target.value)} placeholder="Actual Result" className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                <input type="text" value={quickRemark} onChange={e => setQuickRemark(e.target.value)} placeholder="Remark" className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-3">
                <input type="text" value={quickKpi} onChange={e => setQuickKpi(e.target.value)} placeholder="KPI / Expected Outcome" className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                <input type="text" value={quickRemark} onChange={e => setQuickRemark(e.target.value)} placeholder="Remark" className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
            )}

            <Button
              onClick={handleQuickAdd}
              disabled={isSubmitting || !quickTitle.trim()}
              className="self-end w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white mt-1"
            >
              {isSubmitting ? "Logging..." : "Log Task"}
            </Button>
          </div>
        )}

        {/* ✅ Timesheet Timeline (Logbook) */}
        {activeTab === 'master' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMasterTasks.length === 0 ? (
              <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                No master tasks found. Click "Add Master Task" to create one.
              </div>
            ) : (
              filteredMasterTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    setTasksList([]); // Clear stale data instantly
                    setFilterMasterTaskId(String(task.id));
                    setQuickMasterTaskId(String(task.id)); // Auto-select for quick add
                    setActiveTab('daily');
                  }}
                  className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-400 hover:ring-2 hover:ring-blue-100 transition-all cursor-pointer group relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2 relative">
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-700 transition-colors pr-6">{task.title}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMasterTaskModal(task);
                        }}
                        className="text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 p-1.5 rounded-md transition opacity-0 group-hover:opacity-100 absolute top-0 right-0 z-10"
                        title="Edit Master Task"
                      >
                        ✏️
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-3">{task.description || "No description provided."}</p>
                  </div>

                  <div className="flex flex-col gap-2 mb-3">
                    {/* Created By Badge (Placeholder if backend doesn't send it yet) */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Created By:</span>
                      <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100 font-bold">
                        {task.created_by_name || "Admin"}
                      </span>
                    </div>

                    {/* Assigned To Badges */}
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Assigned To:</span>
                        <div className="flex flex-wrap gap-1">
                          {task.assignees.map(empId => {
                            const emp = workspaceEmployees.find(e => String(e.id) === String(empId));
                            return emp ? (
                              <span key={empId} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 font-medium" title={emp.name}>
                                {emp.name.split(' ')[0]}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-end mt-auto pt-2 border-t border-gray-50">
                    {(task.start_date || task.end_date) ? (
                      <div className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block">
                        📅 {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'N/A'} - {task.end_date ? new Date(task.end_date).toLocaleDateString() : 'N/A'}
                      </div>
                    ) : <div />}
                    <span className="text-blue-600 text-[11px] font-bold group-hover:underline">
                      View Tasks ➔
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-lg font-semibold text-gray-800">{activeTab === 'daily' ? 'Daily Timeline' : 'Weekly Outcomes'}</h2>
              {activeTab === 'daily' && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm border border-blue-200">
                  Total Hours: {totalHours.toFixed(2)} Hrs
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No {activeTab} tasks logged yet. Add one above!</div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                  {filteredTasks.map((t) => {
                    const currentUser = localStorage.getItem("employee_name");
                    const role = localStorage.getItem("role");
                    const isAdmin = role?.toLowerCase().includes("admin");
                    const isMyTask = t.employee_name === currentUser;
                    const canEdit = isAdmin || isMyTask;
                    const canDelete = isAdmin || isMyTask;

                    return (
                      <li key={t.task_id} className="p-4 hover:bg-blue-50/30 transition border-b border-gray-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4 group">
                        {/* Left Side: Info */}
                        <div className="flex-1 flex flex-col gap-1.5">
                          {/* 1. Date & Employee */}
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <span className="text-gray-400">📅</span>
                              {t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1 text-blue-600"><span className="text-blue-400">👤</span> {t.employee_name}</span>
                          </div>

                          {/* 2. Title & Master Task */}
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-[15px]">{t.title}</h3>
                            {t.master_task_id && (
                              <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200 font-bold uppercase tracking-wide">
                                🗂️ {masterTasks.find(m => String(m.id) === String(t.master_task_id))?.title || "Master Task"}
                              </span>
                            )}
                          </div>

                          {/* 3. KPI, Target, Actual, Remark */}
                          <div className="flex flex-wrap gap-2 mt-1">
                            {activeTab === 'daily' && (
                              <div className={`flex items-center text-[11px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 shadow-sm flex-1 min-w-[120px] ${!canEdit ? 'opacity-70' : ''}`}>
                                <span className="font-bold mr-1 opacity-70 whitespace-nowrap">KPI / Target:</span>
                                <InlineInput disabled={!canEdit} value={t.kpi} placeholder="..." onSave={(val) => handleInlineUpdate(t.task_id, 'kpi', val)} className="bg-transparent border-none outline-none w-full text-indigo-700 placeholder-indigo-300 font-medium disabled:cursor-not-allowed" />
                              </div>
                            )}

                            {(activeTab === 'weekly' || activeTab === 'daily') && (
                              <div className={`flex items-center text-[11px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100 shadow-sm flex-1 min-w-[120px] ${!canEdit ? 'opacity-70' : ''}`}>
                                <span className="font-bold mr-1 opacity-70 whitespace-nowrap">{activeTab === 'daily' ? 'Actual:' : 'KPI:'}</span>
                                <InlineInput
                                  disabled={!canEdit}
                                  value={activeTab === 'daily' ? t.actual_result : t.kpi}
                                  placeholder="..."
                                  onSave={(val) => handleInlineUpdate(t.task_id, activeTab === 'daily' ? 'actual_result' : 'kpi', val)}
                                  className="bg-transparent border-none outline-none w-full text-emerald-700 placeholder-emerald-300 font-medium disabled:cursor-not-allowed"
                                />
                              </div>
                            )}

                            <div className={`flex items-center text-[11px] bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-200 flex-1 min-w-[150px] shadow-sm ${!canEdit ? 'opacity-70' : ''}`}>
                              <span className="font-bold mr-1 text-gray-400">Remark:</span>
                              <InlineInput disabled={!canEdit} value={t.remark} placeholder="..." onSave={(val) => handleInlineUpdate(t.task_id, 'remark', val)} className="bg-transparent border-none outline-none w-full italic text-gray-700 placeholder-gray-300 disabled:cursor-not-allowed" />
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Status, Time, Delete */}
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 w-full sm:w-auto">
                          {/* Status Dropdown */}
                          <select
                            disabled={!canEdit}
                            value={t.status || 'open'}
                            onChange={(e) => handleInlineUpdate(t.task_id || t.id, 'status', e.target.value)}
                            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1.5 rounded-md border outline-none text-center w-[100px] shadow-sm ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} ${t.status === 'closed' ? 'bg-green-100 text-green-700 border-green-200' :
                              t.status === 'in progress' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                t.status === 'waiting' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                  'bg-blue-100 text-blue-700 border-blue-200'
                              }`}
                          >
                            <option value="open">Open</option>
                            <option value="in progress">In Progress</option>
                            <option value="waiting">Waiting</option>
                            <option value="closed">Closed</option>
                          </select>

                          <div className="flex items-center gap-2">
                            {activeTab === 'daily' && (
                              <div className={`bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-md flex items-center shadow-sm justify-center transition ${canEdit ? 'group-hover:bg-green-100' : 'opacity-70'}`}>
                                <span className="font-bold mr-1 opacity-70 whitespace-nowrap text-[10px] uppercase tracking-wide">Est. Hours:</span>
                                <InlineInput
                                  disabled={!canEdit}
                                  type="number"
                                  step="0.5"
                                  value={t.hours_worked}
                                  placeholder="0"
                                  onSave={(val) => handleInlineUpdate(t.task_id, 'hours_worked', val)}
                                  className="bg-transparent border-none outline-none w-10 text-center text-green-800 font-bold text-[13px] p-0 leading-none focus:ring-1 focus:ring-green-400 rounded-sm disabled:cursor-not-allowed"
                                />
                              </div>
                            )}

                            {canDelete && isCurrentOrFutureTask(t) && (
                              <button
                                onClick={() => handleDeleteTask(t.task_id)}
                                className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition opacity-0 group-hover:opacity-100 shadow-sm"
                                title="Delete Task"
                              >
                                ❌
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      {/* ✅ Add Master Task Modal */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{editMasterTaskId ? "Edit Master Task" : "Add Master Task"}</h3>
              <button onClick={() => setIsMasterModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreateMasterTask} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <div className="flex gap-2 items-center">
                  <input
                    autoFocus
                    value={mtTitle}
                    onChange={(e) => setMtTitle(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="E.g., Quarterly Review"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 text-blue-500 border-blue-200 hover:bg-blue-50"
                    onClick={() => startListening(setMtTitle, mtTitle)}
                    title="Voice input"
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={mtStartDate}
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      setMtStartDate(newStartDate);
                      if (newStartDate) {
                        const d = new Date(newStartDate);
                        d.setDate(d.getDate() + 7);
                        const formatLocal = (dateObj) => {
                          const y = dateObj.getFullYear();
                          const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                          const day = String(dateObj.getDate()).padStart(2, '0');
                          return `${y}-${m}-${day}`;
                        };
                        setMtEndDate(formatLocal(d));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={mtEndDate}
                    min={mtStartDate || undefined}
                    onChange={(e) => setMtEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <div className="flex gap-2 items-start">
                  <textarea
                    value={mtDescription}
                    onChange={(e) => setMtDescription(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="What is this master task about?"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 text-blue-500 border-blue-200 hover:bg-blue-50 mt-1"
                    onClick={() => startListening(setMtDescription, mtDescription)}
                    title="Voice input"
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To (Optional)</label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white flex flex-col gap-1">
                  {workspaceEmployees.length === 0 ? (
                    <span className="text-xs text-gray-400 p-1">No active employees found</span>
                  ) : (
                    workspaceEmployees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-blue-600 focus:ring-blue-500"
                          checked={mtAssignees.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMtAssignees([...mtAssignees, emp.id]);
                            } else {
                              setMtAssignees(mtAssignees.filter(id => id !== emp.id));
                            }
                          }}
                        />
                        <span className="text-sm text-gray-700">{emp.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsMasterModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !mtTitle.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isSubmitting ? "Saving..." : (editMasterTaskId ? "Save Changes" : "Create Task")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup Modal (Removed) */}
    </Layout>
  );
};
export default WorkspaceBoard;

