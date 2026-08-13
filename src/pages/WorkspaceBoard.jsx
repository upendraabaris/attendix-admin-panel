import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { PlusCircle, Search, Filter, ArrowUpDown, Mic, Sparkles, ArrowLeft } from "lucide-react";
import Layout from "../components/Layout";
import MeetingAiModal from "../components/MeetingAiModal";
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
  allowedEmployeeIds,
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
        const scopedEmployees =
          Array.isArray(allowedEmployeeIds) && allowedEmployeeIds.length > 0
            ? orgEmployees.filter((emp) => allowedEmployeeIds.includes(emp.id))
            : orgEmployees;

        setEmployees(
          [...scopedEmployees].sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );


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
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("daily"); // "daily", "weekly", or "master"

  // Filters & Sorting
  const [showFilters, setShowFilters] = useState(false);
  const [filterEmployeeId, setFilterEmployeeId] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterMasterTaskId, setFilterMasterTaskId] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "hours_high", "hours_low"

  // Quick Log Fields
  const [quickTitle, setQuickTitle] = useState("");
  const [quickKpi, setQuickKpi] = useState("");
  const [quickTarget, setQuickTarget] = useState("");
  const [quickEmployeeId, setQuickEmployeeId] = useState("");
  const [quickActual, setQuickActual] = useState("");
  const [quickRemark, setQuickRemark] = useState("");
  const [quickStatus, setQuickStatus] = useState("open");
  const [quickPriority, setQuickPriority] = useState("medium");
  const [quickMasterTaskId, setQuickMasterTaskId] = useState("");
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickAttachment, setQuickAttachment] = useState(null);
  const [editingDurationTaskId, setEditingDurationTaskId] = useState(null);
const [durationHours, setDurationHours] = useState(0);
const [durationMinutes, setDurationMinutes] = useState(0);

  // Master Task Modal Fields
  const [mtTitle, setMtTitle] = useState("");
  const [mtDescription, setMtDescription] = useState("");
  const [mtStartDate, setMtStartDate] = useState("");
  const [mtEndDate, setMtEndDate] = useState("");
  const [mtAssignees, setMtAssignees] = useState([]);
  const [mtPriority, setMtPriority] = useState("medium");
  const [mtWorkspaces, setMtWorkspaces] = useState([]);
  const [editMasterTaskId, setEditMasterTaskId] = useState(null);
  const [workspaceEmployees, setWorkspaceEmployees] = useState([]);
  const [allWorkspaces, setAllWorkspaces] = useState([]);
  const [currentWorkspaceEmployeeIds, setCurrentWorkspaceEmployeeIds] = useState([]);


  const openMasterTaskModal = (task = null) => {
    if (task) {
      setEditMasterTaskId(task.id);
      setMtTitle(task.title || "");
      setMtDescription(task.description || "");
      setMtStartDate(task.start_date ? new Date(task.start_date).toISOString().split("T")[0] : "");
      setMtEndDate(task.end_date ? new Date(task.end_date).toISOString().split("T")[0] : "");
      setMtAssignees(task.assignees || []);
      setMtPriority(task.priority || "medium");
      setMtWorkspaces(task.workspace_ids || [Number(id)]);
    } else {
      setEditMasterTaskId(null);
      setMtTitle("");
      setMtDescription("");
      setMtStartDate("");
      setMtEndDate("");
      setMtAssignees([]);
      setMtPriority("medium");
      setMtWorkspaces([Number(id)]);

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
      setMtWorkspaces([Number(id)]);
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

  const fetchTasksForMasterTask = async (masterTaskId) => {
  try {
    const queryParams = new URLSearchParams({
      workspace_id: id,
      sort_by: sortBy,
      master_task_id: masterTaskId,
    });
    if (filterEmployeeId !== "all") queryParams.append("employee_id", filterEmployeeId);
    if (filterStatus !== "all") queryParams.append("status", filterStatus);
    if (filterDateFrom) queryParams.append("start_date", filterDateFrom);
    if (filterDateTo) queryParams.append("end_date", filterDateTo);

    const token = localStorage.getItem("token");
    const res = await api.get(`/task/filter?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
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

const handleDeleteMasterTask = async (masterTaskId) => {
    if (!window.confirm("Delete this master task? This will hide it from the list, but its child tasks won't be deleted.")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await api.patch(`/master-task/${masterTaskId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Master task deleted");
      fetchMasterTasks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete master task");
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
        setWorkspaceEmployees(
          orgEmployees
            .filter(emp => emp.status === "active")
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();

    // const fetchAllWorkspaces = async () => {
    //   try {
    //     const token = localStorage.getItem("token");
    //     const role = (localStorage.getItem("role") || "").toLowerCase();
    //     const isAdminRole = role.includes("admin");
    //     let res;
    //     if (isAdminRole) {
    //       res = await api.get("/workspaces", { headers: { Authorization: `Bearer ${token}` } });
    //     } else {
    //       res = await api.get("/workspaces/emp/workspace", { headers: { Authorization: `Bearer ${token}` } });
    //     }
    //     const workspacesData = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    //     setAllWorkspaces(workspacesData);
    //   } catch (err) {
    //     console.error("Error fetching all workspaces:", err);
    //   }
    // };
    // fetchAllWorkspaces();

    const fetchAllWorkspaces = async () => {
      try {
        const token = localStorage.getItem("token");
        const role = (localStorage.getItem("role") || "").toLowerCase();
        const isAdminRole = role.includes("admin");
        let res;
        if (isAdminRole) {
          res = await api.get("/workspaces", { headers: { Authorization: `Bearer ${token}` } });
        } else {
          res = await api.get("/workspaces/emp/workspace", { headers: { Authorization: `Bearer ${token}` } });
        }
        const workspacesData = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
        setAllWorkspaces(workspacesData);

        const currentWs = workspacesData.find((ws) => String(ws.id) === String(id));
        setCurrentWorkspaceEmployeeIds(Array.isArray(currentWs?.employee_ids) ? currentWs.employee_ids : []);
      } catch (err) {
        console.error("Error fetching all workspaces:", err);
      }
    };
    fetchAllWorkspaces();
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
        hours_worked: 0,
        date: quickDate || new Date().toISOString().split("T")[0],
        workspace_id: id,
        master_task_id: quickMasterTaskId || null,
        employee_id: quickEmployeeId || null,
        task_type: activeTab,
        kpi: quickKpi,
        target_val: quickTarget,
        actual_result: quickActual,
        remark: quickRemark,
        status: quickStatus,
        priority: quickPriority,
        attachment: quickAttachment
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success("Task logged successfully!");
      setQuickTitle("");
      setQuickKpi("");
      setQuickTarget("");
      setQuickActual("");
      setQuickRemark("");
      setQuickStatus("open");
      setQuickPriority("medium");
      setQuickMasterTaskId("");
      setQuickEmployeeId("");
      setQuickDate(new Date().toISOString().split("T")[0]);
      setQuickAttachment(null);
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
        workspace_ids: mtWorkspaces,
        title: mtTitle,
        description: mtDescription,
        start_date: mtStartDate,
        end_date: mtEndDate,
        assignees: mtAssignees,
        priority: mtPriority
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
      setMtPriority("medium");
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

  // const handleInlineUpdate = async (taskId, field, newValue) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     await api.post("/task/update-inline", {
  //       taskId,
  //       [field]: field === 'hours_worked' ? (parseFloat(newValue) || 0) : newValue
  //     }, { headers: { Authorization: `Bearer ${token}` } });

  //     // Optimistic local update
  //     setTasksList(prev => prev.map(t => t.task_id === taskId ? { ...t, [field]: newValue } : t));
  //   } catch (err) {
  //     console.error(err);
  //     toast.error("Failed to update task");
  //   }
  // };

// const handleInlineUpdate = async (taskId, field, newValue) => {
//   try {
//     const token = localStorage.getItem("token");
//     const res = await api.post("/task/update-inline", {
//       taskId,
//       [field]: field === 'hours_worked' ? (parseFloat(newValue) || 0) : newValue
//     }, { headers: { Authorization: `Bearer ${token}` } });

//     const updatedTask = res.data?.data;

//     if (updatedTask) {
//       // Backend se poora updated task (ended_at, hours_worked, completed, etc.) merge karo
//       setTasksList(prev =>
//         prev.map(t =>
//           t.task_id === taskId ? { ...t, ...updatedTask, task_id: t.task_id } : t
//         )
//       );
//     } else {
//       // Fallback agar response mein data na aaye
//       setTasksList(prev => prev.map(t => t.task_id === taskId ? { ...t, [field]: newValue } : t));
//     }
//   } catch (err) {
//     console.error(err);
//     toast.error("Failed to update task");
//   }
// };

const handleInlineUpdate = async (taskId, field, newValue) => {
  try {
    const token = localStorage.getItem("token");
    const res = await api.post("/task/update-inline", {
      taskId,
      [field]: field === 'hours_worked' ? (parseFloat(newValue) || 0) : newValue
    }, { headers: { Authorization: `Bearer ${token}` } });

    const updatedTask = res.data?.data;

    if (updatedTask) {
      // Backend se poora updated task (ended_at, hours_worked, completed, etc.) merge karo
      setTasksList(prev =>
        prev.map(t =>
          t.task_id === taskId ? { ...t, ...updatedTask, task_id: t.task_id } : t
        )
      );
    } else {
      // Fallback agar response mein data na aaye
      setTasksList(prev => prev.map(t => t.task_id === taskId ? { ...t, [field]: newValue } : t));
    }

    // Agar status change hua hai aur task kisi Master Task se linked hai,
    // to Master Task ka computed status bhi refresh karo (bina full page reload ke)
    if (field === 'status' && (updatedTask?.master_task_id || quickMasterTaskId)) {
      fetchMasterTasks();
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to update task");
  }
};

 const handleDurationSave = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/task/update-duration",
        { taskId, hours: durationHours, minutes: durationMinutes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Tracked time updated successfully!");
      setEditingDurationTaskId(null);
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to update tracked time");
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
  const assignableEmployees =
    currentWorkspaceEmployeeIds.length > 0
      ? workspaceEmployees.filter((emp) => currentWorkspaceEmployeeIds.includes(emp.id))
      : workspaceEmployees;

  // Filter tasks based on search term
  const filteredTasks = tasksList.filter((t) => {
    const matchesTab = (t.task_type || "daily") === activeTab;
    const matchesSearch = [t.title, t.description, t.remark, t.kpi, t.employee_name].some((v) =>
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

  const formatDecimalHoursToTime = (decimalHours) => {
    if (!decimalHours || isNaN(decimalHours)) return "0h 0m";
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const totalHoursDec = filteredTasks.reduce((sum, task) => {
    if (task.status === 'closed') return sum;
    return sum + (parseFloat(task.hours_worked) || 0);
  }, 0);

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/workspace")}
              className="p-2 bg-white hover:bg-gray-100 rounded-xl shadow-sm border text-gray-600 hover:text-blue-600 transition-all duration-200 flex items-center justify-center"
              title="Back to Workspaces"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{workspaceName}</h1>
              <p className="text-gray-600 text-xs">Manage your project tasks and milestones</p>
            </div>
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

            <Button
              size="sm"
              onClick={() => setIsMeetingModalOpen(true)}
              className="h-8 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-sm transition-all"
            >
              <Sparkles className="w-3 h-3 mr-1 text-purple-200" />
              <span className="text-xs font-semibold">Process Meeting</span>
            </Button>
          </div>
        </div>

        {/* Filters Drawer */}
        {showFilters && (
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-4 flex flex-wrap gap-4 items-end animate-in fade-in duration-200">
              {/* <div>
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
              </div> */}

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Team Member</label>
                <select
                  value={filterEmployeeId}
                  onChange={e => setFilterEmployeeId(e.target.value)}
                  className="w-full md:w-40 text-xs border border-gray-200 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Team Member</option>
                  {assignableEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

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
                <option value="active">Active Tasks</option>
                <option value="all">All (Inc. Closed)</option>
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

              {/* <select
                value={quickEmployeeId}
                onChange={(e) => setQuickEmployeeId(e.target.value)}
                className="w-full md:w-40 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
              >
                <option value="">Assign To (Myself)</option>
                {workspaceEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select> */}

              <select
                value={quickEmployeeId}
                onChange={(e) => setQuickEmployeeId(e.target.value)}
                className="w-full md:w-40 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
              >
                <option value="">Assign To (Myself)</option>
                {assignableEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>

              {/* Priority Dropdown */}
              <select
                value={quickPriority}
                onChange={(e) => setQuickPriority(e.target.value)}
                className="w-full md:w-28 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 font-semibold"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
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

              <input
                type="date"
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="w-full md:w-36 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 font-semibold"
                title="Task Date"
              />
            </div>

            {activeTab === 'daily' ? (
              <div className="flex flex-col md:flex-row gap-3">
                <input type="text" value={quickKpi} onChange={e => setQuickKpi(e.target.value)} placeholder="KPI" className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                <input type="text" value={quickTarget} onChange={e => setQuickTarget(e.target.value)} placeholder="Target" className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                <input type="text" value={quickActual} onChange={e => setQuickActual(e.target.value)} placeholder="Actual Result" className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                <input type="text" value={quickRemark} onChange={e => setQuickRemark(e.target.value)} placeholder="Remark" className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              ) : (
            <div className="flex flex-col md:flex-row gap-3">
              <input type="text" value={quickKpi} onChange={e => setQuickKpi(e.target.value)} placeholder="KPI" className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
              <input type="text" value={quickTarget} onChange={e => setQuickTarget(e.target.value)} placeholder="Expected Outcome" className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
              <input type="text" value={quickRemark} onChange={e => setQuickRemark(e.target.value)} placeholder="Remark" className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          )}

            <div className="flex flex-col gap-1 mt-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attachment</label>
              <div 
                onPaste={(e) => {
                  const items = e.clipboardData?.items;
                  if (items) {
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf("image") !== -1) {
                        const file = items[i].getAsFile();
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setQuickAttachment(event.target.result);
                          toast.success("Image pasted successfully!");
                        };
                        reader.readAsDataURL(file);
                        break;
                      }
                    }
                  }
                }}
                onClick={(e) => e.currentTarget.focus()}
                className="min-h-[56px] border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-blue-400 transition cursor-pointer relative p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                tabIndex={0}
                title="Click here and press Ctrl+V to paste an image"
              >
                {quickAttachment ? (
                  <div className="relative flex items-center justify-center">
                    <img src={quickAttachment} alt="Pasted preview" className="max-h-20 object-contain rounded border bg-white" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickAttachment(null);
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-center text-gray-400 font-medium select-none">
                    📋 Click here & press <kbd className="bg-white border px-1 py-0.5 rounded text-[10px] font-bold text-gray-600">Ctrl + V</kbd> to paste screenshot/image
                  </div>
                )}
              </div>
            </div>

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
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    {filteredMasterTasks.length === 0 ? (
      <div className="p-8 text-center text-gray-500 text-sm">
        No master tasks found. Click "Add Master Task" to create one.
      </div>
    ) : (
      <ul className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
        {/* {filteredMasterTasks.map((task) => {
          const badgeStyles = {
            low: "bg-emerald-100 text-emerald-800 border-emerald-200",
            medium: "bg-blue-100 text-blue-800 border-blue-200",
            high: "bg-orange-100 text-orange-800 border-orange-200",
            critical: "bg-red-100 text-red-800 border-red-300"
          };
          const bStyle = badgeStyles[task.priority?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"; */}
{filteredMasterTasks.map((task) => {
          const badgeStyles = {
            low: "bg-emerald-100 text-emerald-800 border-emerald-200",
            medium: "bg-blue-100 text-blue-800 border-blue-200",
            high: "bg-orange-100 text-orange-800 border-orange-200",
            critical: "bg-red-100 text-red-800 border-red-300"
          };
          const bStyle = badgeStyles[task.priority?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";

          const statusStyles = {
            open: "bg-blue-50 text-blue-700 border-blue-200",
            "in progress": "bg-yellow-50 text-yellow-700 border-yellow-200",
            closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
          };
          const taskStatus = task.computed_status || "open";
          const statusStyle = statusStyles[taskStatus] || statusStyles.open;

          const priorityRowStyles = {
            low: "bg-emerald-50/50 hover:bg-emerald-50",
            medium: "bg-blue-50/50 hover:bg-blue-50",
            high: "bg-orange-50/50 hover:bg-orange-50",
            critical: "bg-red-50/50 hover:bg-red-50"
          };
          const pRowStyle = priorityRowStyles[task.priority?.toLowerCase()] || "hover:bg-blue-50/30";

          return (
            // <li
            //   key={task.id}
            //   onClick={() => {
            //     setTasksList([]);
            //     setFilterMasterTaskId(String(task.id));
            //     setQuickMasterTaskId(String(task.id));
            //     setActiveTab('daily');
            //     fetchTasksForMasterTask(task.id);
            //   }}
            //   className={`p-4 transition border-b border-gray-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer group ${pRowStyle}`}
            // >
            <li
              key={task.id}
              onClick={() => {
                setTasksList([]);
                setFilterMasterTaskId(String(task.id));
                setQuickMasterTaskId(String(task.id));
                setActiveTab('daily');
                fetchTasksForMasterTask(task.id);
              }}
              className={`m-3 p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer group ${pRowStyle}`}
            >
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="text-gray-400">📅</span>
                    {task.start_date ? new Date(task.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                    {' - '}
                    {task.end_date ? new Date(task.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1 text-purple-600">
                    <span className="text-purple-400">👤</span> {task.created_by_name || "Admin"}
                  </span>
                </div>

                {/* <div className="flex items-center gap-2 w-full flex-wrap">
                  <span className="font-bold text-gray-900 text-[15px]">{task.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border ${bStyle}`}>
                    {task.priority || "Medium"}
                  </span>
                </div> */}

                <div className="flex items-center gap-2 w-full flex-wrap">
                  <span className="font-bold text-gray-900 text-[15px]">{task.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border ${bStyle}`}>
                    {task.priority || "Medium"}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border ${statusStyle}`}>
                    {taskStatus}
                  </span>
                </div>

                <p className="text-[12px] text-gray-500 line-clamp-2">{task.description || "No description provided."}</p>

                {task.assignees && task.assignees.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {task.assignees.map(empId => {
                      const emp = workspaceEmployees.find(e => String(e.id) === String(empId));
                      return emp ? (
                        <span key={empId} className="text-[10px] bg-slate-50 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 font-medium">
                          {emp.name.split(' ')[0]}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openMasterTaskModal(task);
                  }}
                  className="text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50 p-1.5 rounded-md transition opacity-0 group-hover:opacity-100 border border-transparent hover:border-blue-100"
                  title="Edit Master Task"
                >
                  ✏️
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMasterTask(task.id);
                  }}
                  className="text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 p-1.5 rounded-md transition opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-100"
                  title="Delete Master Task"
                >
                  🗑️
                </button>

                <span className="text-blue-600 text-[11px] font-bold whitespace-nowrap group-hover:underline">
                  View Tasks ➔
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </div>
) : (
          <>
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-gray-800">{activeTab === 'daily' ? 'Daily Timeline' : 'Weekly Outcomes'}</h2>
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

                    const priorityStyles = {
                      low: "bg-emerald-50/50 hover:bg-emerald-50",
                      medium: "bg-blue-50/50 hover:bg-blue-50",
                      high: "bg-orange-50/50 hover:bg-orange-50",
                      critical: "bg-red-50/50 hover:bg-red-50"
                    };
                    const pStyle = priorityStyles[t.priority?.toLowerCase()] || "hover:bg-blue-50/30";

                    return (
                      <li key={t.task_id} className={`p-4 transition border-b border-gray-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4 group ${pStyle}`}>
                        {/* Left Side: Info */}
                        <div className="flex-1 flex flex-col gap-1.5">
                          {/* 1. Date & Employee */}
                          {/* <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <span className="text-gray-400">📅</span>
                              {t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1 text-blue-600"><span className="text-blue-400">👤</span> {t.employee_name}</span>
                          </div> */}

                          {/* <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <span className="text-gray-400">📅</span>
                              <span className="opacity-70">Due Date:</span>
                              {t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1 text-blue-600"><span className="text-blue-400">👤</span> {t.employee_name}</span>
                          </div> */}


                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <span className="text-gray-400">📅</span>
                              <span className="opacity-70">Due Date:</span>
                              {t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                            </span>
                            <span className="text-gray-300">|</span>
                            {isAdmin ? (
                              <span className="flex items-center gap-1 text-blue-600">
                                <span className="text-blue-400">👤</span>
                                <select
                                  value={t.employee_id || ""}
                                  onChange={(e) => handleInlineUpdate(t.task_id || t.id, 'employee_id', e.target.value)}
                                  className="bg-transparent border-none outline-none text-blue-600 font-bold text-[10px] uppercase cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {assignableEmployees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                  ))}
                                </select>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-blue-600"><span className="text-blue-400">👤</span> {t.employee_name}</span>
                            )}
                          </div>

                          {/* 2. Title & Master Task */}
                          <div className="flex items-center gap-2 w-full">
                            <InlineInput 
                              disabled={!canEdit} 
                              value={t.title} 
                              placeholder="Task title" 
                              onSave={(val) => handleInlineUpdate(t.task_id || t.id, 'title', val)} 
                              className="font-bold text-gray-900 text-[15px] bg-transparent border-none outline-none w-full disabled:cursor-not-allowed" 
                            />
                            {t.master_task_id && (
                              <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200 font-bold uppercase tracking-wide whitespace-nowrap">
                                🗂️ {masterTasks.find(m => String(m.id) === String(t.master_task_id))?.title || "Master Task"}
                              </span>
                            )}
                          </div>

                          {/* 3. KPI, Target, Actual, Remark */}
                          <div className="flex flex-wrap gap-2 mt-1">
                           {activeTab === 'daily' && (
  <>
                              <div className={`flex items-center text-[11px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 shadow-sm flex-1 min-w-[100px] ${!canEdit ? 'opacity-70' : ''}`}>
                                <span className="font-bold mr-1 opacity-70 whitespace-nowrap">KPI:</span>
                                <InlineInput disabled={!canEdit} value={t.kpi} placeholder="..." onSave={(val) => handleInlineUpdate(t.task_id, 'kpi', val)} className="bg-transparent border-none outline-none w-full text-indigo-700 placeholder-indigo-300 font-medium disabled:cursor-not-allowed" />
                              </div>
                              <div className={`flex items-center text-[11px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 shadow-sm flex-1 min-w-[100px] ${!canEdit ? 'opacity-70' : ''}`}>
                                <span className="font-bold mr-1 opacity-70 whitespace-nowrap">Target:</span>
                                <InlineInput disabled={!canEdit} value={t.target_val} placeholder="..." onSave={(val) => handleInlineUpdate(t.task_id, 'target_val', val)} className="bg-transparent border-none outline-none w-full text-indigo-700 placeholder-indigo-300 font-medium disabled:cursor-not-allowed" />
                              </div>
                            </>
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

                        {activeTab === 'weekly' && (
                          <div className={`flex items-center text-[11px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 shadow-sm flex-1 min-w-[120px] ${!canEdit ? 'opacity-70' : ''}`}>
                            <span className="font-bold mr-1 opacity-70 whitespace-nowrap">Expected Outcome:</span>
                            <InlineInput
                              disabled={!canEdit}
                              value={t.target_val}
                              placeholder="..."
                              onSave={(val) => handleInlineUpdate(t.task_id, 'target_val', val)}
                              className="bg-transparent border-none outline-none w-full text-indigo-700 placeholder-indigo-300 font-medium disabled:cursor-not-allowed"
                            />
                          </div>
                        )}
                            <div className={`flex items-center text-[11px] bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-200 flex-1 min-w-[150px] shadow-sm ${!canEdit ? 'opacity-70' : ''}`}>
                              <span className="font-bold mr-1 text-gray-400">Remark:</span>
                              <InlineInput disabled={!canEdit} value={t.remark} placeholder="..." onSave={(val) => handleInlineUpdate(t.task_id, 'remark', val)} className="bg-transparent border-none outline-none w-full italic text-gray-700 placeholder-gray-300 disabled:cursor-not-allowed" />
                            </div>
                          </div>

                          {/* Image Attachment Preview / Inline Paste Area */}
                          <div className="mt-3 flex flex-wrap gap-2 items-center">
                            {t.attachment ? (
                              <div className="relative group/image rounded-xl overflow-hidden border border-gray-200 bg-white p-1 hover:shadow-md transition duration-200">
                                <img 
                                  src={t.attachment} 
                                  alt="Task attachment" 
                                  className="max-h-24 w-auto object-contain rounded-lg cursor-zoom-in hover:opacity-90 transition"
                                  onClick={() => {
                                    const newTab = window.open();
                                    newTab.document.write(`<img src="${t.attachment}" style="max-width: 100vw; max-height: 100vh; object-fit: contain; display: block; margin: auto;" />`);
                                  }} 
                                />
                                {canEdit && (
                                  <button
                                    onClick={() => handleInlineUpdate(t.task_id || t.id, 'attachment', null)}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md transition duration-200 opacity-0 group-hover/image:opacity-100"
                                    title="Remove Image"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ) : (
                              canEdit && (
                                <div 
                                  onPaste={(e) => {
                                    const items = e.clipboardData?.items;
                                    if (items) {
                                      for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf("image") !== -1) {
                                          const file = items[i].getAsFile();
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            handleInlineUpdate(t.task_id || t.id, 'attachment', event.target.result);
                                            toast.success("Image pasted successfully to task!");
                                          };
                                          reader.readAsDataURL(file);
                                          break;
                                        }
                                      }
                                    }
                                  }}
                                  onClick={(e) => e.currentTarget.focus()}
                                  className="flex items-center gap-1.5 text-[10px] bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded border border-dashed border-slate-200 cursor-pointer transition shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  tabIndex={0}
                                  title="Click and press Ctrl+V to paste an image for this task"
                                >
                                  <span>📋</span>
                                  <span className="font-semibold">Paste Screenshot</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 w-full sm:w-auto">
                          <div className="flex gap-2">
                            {/* Priority Dropdown */}
                            <select
                              disabled={!canEdit}
                              value={t.priority || 'medium'}
                              onChange={(e) => handleInlineUpdate(t.task_id || t.id, 'priority', e.target.value)}
                              className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-1 rounded border outline-none text-center shadow-sm ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} ${
                                t.priority === 'low' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                t.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                t.priority === 'critical' ? 'bg-red-100 text-red-800 border-red-300' :
                                'bg-blue-100 text-blue-800 border-blue-200'
                              }`}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>

                            {/* Status Dropdown */}
                            <select
                              disabled={!canEdit}
                              value={t.status || 'open'}
                              onChange={(e) => handleInlineUpdate(t.task_id || t.id, 'status', e.target.value)}
                              className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-1 rounded border outline-none text-center shadow-sm ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} ${
                                t.status === 'closed' ? 'bg-green-100 text-green-700 border-green-200' :
                                t.status === 'in progress' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                t.status === 'waiting' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                'bg-blue-100 text-blue-700 border-blue-200'
                              }`}
                            >
                              <option value="open">Open</option>
                              <option value="in progress">In Prog</option>
                              <option value="waiting">Waiting</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            {activeTab === 'daily' && (
                              <>
                                {t.started_at && (
                                  editingDurationTaskId === (t.task_id || t.id) ? (
                                    <div className="bg-purple-50 border border-purple-200 px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                      <input
                                        type="number"
                                        min="0"
                                        value={durationHours}
                                        onChange={(e) => setDurationHours(Math.max(0, Number(e.target.value)))}
                                        className="w-10 text-[11px] text-center border border-purple-200 rounded px-1 py-0.5 outline-none"
                                      />
                                      <span className="text-[10px] text-purple-700 font-bold">h</span>
                                      <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={durationMinutes}
                                        onChange={(e) => setDurationMinutes(Math.min(59, Math.max(0, Number(e.target.value))))}
                                        className="w-10 text-[11px] text-center border border-purple-200 rounded px-1 py-0.5 outline-none"
                                      />
                                      <span className="text-[10px] text-purple-700 font-bold">m</span>
                                      <button
                                        onClick={() => handleDurationSave(t.task_id || t.id)}
                                        className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded hover:bg-purple-700 ml-1"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => setEditingDurationTaskId(null)}
                                        className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-300"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                  <div
                                    onClick={() => {
                                      if (!canEdit) {
                                        toast.error("You are not authorized to edit this task");
                                        return;
                                      }
                                      if (String(t.status).toLowerCase() !== "closed") {
                                        toast.error("Only closed tasks can have their tracked time edited");
                                        return;
                                      }
                                      const hrs = parseFloat(t.hours_worked) || 0;
                                      setDurationHours(Math.floor(hrs));
                                      setDurationMinutes(Math.round((hrs % 1) * 60));
                                      setEditingDurationTaskId(t.task_id || t.id);
                                    }}
                                    className={`bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md flex items-center shadow-sm justify-center transition ${canEdit ? 'cursor-pointer hover:bg-purple-100' : 'cursor-not-allowed opacity-70'}`}
                                    title={canEdit ? "Click to manually edit tracked time (closed tasks only)" : "You can only edit your own tasks"}
                              >
                                      <span className="font-bold mr-1 opacity-70 whitespace-nowrap text-[10px] uppercase tracking-wide">
                                        Tracked:
                                      </span>
                                      <span className="text-purple-800 font-bold text-[12px] p-0 leading-none">
                                          {/* {(() => {
                                            // Agar task closed hai (ended_at set hai) -> hamesha hours_worked dikhao (manually edited value)
                                            if (t.ended_at) {
                                              const hrs = parseFloat(t.hours_worked) || 0;
                                              const h = Math.floor(hrs);
                                              const m = Math.round((hrs % 1) * 60);
                                              return `${h}h ${m}m`;
                                            }
                                            // Agar task abhi live hai -> real time calculate karo
                                            const start = new Date(t.started_at).getTime();
                                            const end = new Date().getTime();
                                            const diffMs = Math.max(0, end - start);
                                            const diffHrs = Math.floor(diffMs / 3600000);
                                            const diffMins = Math.floor((diffMs % 3600000) / 60000);
                                            return `${diffHrs}h ${diffMins}m (Live)`;
                                          })()} */}

                                          {(() => {
                                        const start = new Date(t.started_at).getTime();
                                        const end = t.ended_at ? new Date(t.ended_at).getTime() : new Date().getTime();
                                        const diffMs = Math.max(0, end - start);
                                        const diffHrs = Math.floor(diffMs / 3600000);
                                        const diffMins = Math.floor((diffMs % 3600000) / 60000);
                                        return `${diffHrs}h ${diffMins}m ${!t.ended_at ? '(Live)' : ''}`;
                                      })()}
                                      </span>
                                    </div>
                                  )
                                )}
                              </>
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
              <div className="mb-6 grid grid-cols-2 gap-4">
                {/* Left Column: Priority and Assign To */}
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                    <select
                      value={mtPriority}
                      onChange={(e) => setMtPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Assign To (Optional)</label>
                    {/* <div className="flex-1 min-h-[120px] max-h-[120px] overflow-y-auto border border-gray-200 rounded-md p-2 bg-white flex flex-col gap-1">
                      {workspaceEmployees.length === 0 ? (
                        <span className="text-xs text-gray-400 p-1">No active employees found</span>
                      ) : (
                        workspaceEmployees.map(emp => ( */}
                        <div className="flex-1 min-h-[120px] max-h-[120px] overflow-y-auto border border-gray-200 rounded-md p-2 bg-white flex flex-col gap-1">
                      {assignableEmployees.length === 0 ? (
                        <span className="text-xs text-gray-400 p-1">No active employees found</span>
                      ) : (
                        assignableEmployees.map(emp => (
                          <label key={emp.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded text-blue-600 focus:ring-blue-500"
                              checked={mtAssignees.includes(emp.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setMtAssignees([...mtAssignees, emp.id]);
                                } else {
                                  setMtAssignees(mtAssignees.filter(empId => empId !== emp.id));
                                }
                              }}
                            />
                            <span className="text-xs text-gray-700">{emp.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Workspaces */}
                <div className="flex flex-col">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Map to Workspaces <span className="text-red-500">*</span></label>
                  <div className="flex-1 min-h-[185px] max-h-[185px] overflow-y-auto border border-gray-200 rounded-md p-2 bg-white flex flex-col gap-1">
                    {allWorkspaces.map(ws => (
                      <label key={ws.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-blue-600 focus:ring-blue-500"
                          checked={mtWorkspaces.includes(ws.id)}
                          onChange={(e) => {
                            if (e.target.checked) setMtWorkspaces([...mtWorkspaces, ws.id]);
                            else setMtWorkspaces(mtWorkspaces.filter(wId => wId !== ws.id));
                          }}
                        />
                        <span className="text-xs text-gray-700 font-medium flex items-center gap-1">
                          {ws.name} 
                          {ws.id === Number(id) && <span className="text-blue-500 italic">(Current)</span>}
                        </span>
                      </label>
                    ))}
                  </div>
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

      <MeetingAiModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        workspaceId={id}
        workspaceEmployees={workspaceEmployees}
        onSuccess={() => {
          fetchTasks();
          fetchMasterTasks();
        }}
      />
    </Layout>
  );
};
export default WorkspaceBoard;

