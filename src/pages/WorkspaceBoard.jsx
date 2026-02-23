import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { PlusCircle, Search } from "lucide-react";
import Layout from "../components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import api from "../hooks/useApi";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"; // ✅ New
import { io } from "socket.io-client";
import { toast } from "sonner"; // ✅ Toast import
import BASE_URL from "../config/apiConfig";

const WEEKDAY_OPTIONS = [
  { key: "sun", label: "Sun" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
];

// const socket = io("http://localhost:4000"); // ✅ Adjust for your backend URL
const socket = io(BASE_URL); // ✅ Adjust for your backend URL
// ✅ Modal Component (unchanged)
const AddTaskModal = ({ isOpen, onClose, workspace_id, workspace_name, onTaskAdded }) => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: "",
    title: "",
    due_date: "",
    description: "",
    attachment: null,
    recurrence_type: "none",
    recurrence_days: [],
    recurrence_end_date: "",
    monthly_day: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/employee/getEmployees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployees(res.data.data || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  // const handleChange = (e) => {
  //   const { name, value, files } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: files ? files[0] : value,
  //   }));
  // };

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
      setFormData({
        employee_id: "",
        title: "",
        due_date: "",
        description: "",
        attachment: null,
        recurrence_type: "none",
        recurrence_days: [],
        recurrence_end_date: "",
        monthly_day: "",
      });

      onTaskAdded();
      onClose();
    } catch (error) {
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
              {employees.map((emp) => (
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
              value={formData.title}
              onChange={handleChange}
              required
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

          {/* Attachment */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
            <input
              type="file"
              name="attachment"
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md text-sm"
            />
          </div> */}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Saving..." : "Add Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ✅ Main Board Component
const WorkspaceBoard = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const workspaceName = state?.workspaceName || `Workspace #${id}`;

  const [columns, setColumns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch tasks from backend
  const fetchTasks = async () => {
    try {
      const res = await api.get("/task/all");
      // const res = await api.get("/tasks");
      console.log("📦 API Response:", res.data);

      // Step 1: Flatten all tasks with employee info
      const allTasks = res.data.data.flatMap((emp) =>
        emp.tasks.map((task) => ({
          ...task,
          employee_name: emp.name,
        }))
      );

      // Step 2: Filter by workspace_id from URL
      const workspaceTasks = allTasks.filter(
        (task) => String(task.workspace_id) === String(id)
      );

      console.log("🎯 Filtered Tasks for Workspace:", workspaceTasks);

      const grouped = {
        backlog: [],
        todo: [],
        inprogress: [],
        review: [],
        completed: [],
      };

      workspaceTasks.forEach((task) => {
        const status = task.status?.toLowerCase() || "backlog";

        if (status.includes("backlog")) grouped.backlog.push(task);
        else if (status.includes("to do")) grouped.todo.push(task);
        else if (status.includes("in progress")) grouped.inprogress.push(task);
        else if (status.includes("review")) grouped.review.push(task);
        else if (status.includes("completed")) grouped.completed.push(task);
        else grouped.backlog.push(task); // fallback
      });

      // Step 4️⃣: Set categorized columns
      setColumns([
        { id: "backlog", title: "Backlog", color: "bg-gray-100", tasks: grouped.backlog },
        { id: "todo", title: "To Do", color: "bg-blue-50", tasks: grouped.todo },
        { id: "inprogress", title: "In Progress", color: "bg-yellow-50", tasks: grouped.inprogress },
        { id: "review", title: "Review", color: "bg-purple-50", tasks: grouped.review },
        { id: "completed", title: "Completed", color: "bg-green-50", tasks: grouped.completed },
      ]);
    } catch (error) {
      console.error("❌ Error fetching tasks:", error);
      toast.error("Failed to fetch tasks!");
    }
  };

  useEffect(() => {
    fetchTasks();
    //  ✅ Listen for real-time updates
    socket.on("taskUpdated", (updatedTask) => {
      console.log("🟡 Real-time update received:", updatedTask);
      fetchTasks(); // refresh the board automatically
    });

    socket.on("taskDeleted", () => {
      fetchTasks();
    });

    return () => {
      socket.off("taskUpdated");
      socket.off("taskDeleted");
    };
  }, []);

  // 253 to 316
  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return; // dropped outside board
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newColumns = [...columns];
    const sourceCol = newColumns.find((col) => col.id === source.droppableId);
    const destCol = newColumns.find((col) => col.id === destination.droppableId);

    // Remove the task from source and add to destination
    const [movedTask] = sourceCol.tasks.splice(source.index, 1);
    destCol.tasks.splice(destination.index, 0, movedTask);

    // Update UI immediately
    setColumns(newColumns);

    // ✅ Define readable status values based on column IDs
    const statusMap = {
      backlog: "backlog",
      todo: "to do",
      inprogress: "in progress",
      review: "review",
      completed: "completed",
    };

    const newStatus = statusMap[destination.droppableId] || "backlog";
    const isCompleted = destination.droppableId === "completed";

    // ✅ Prepare payload for backend
    const payload = {
      taskId: movedTask.task_id,
      is_completed: isCompleted,
      status: newStatus,
    };

    console.log("📤 Sending update payload:", payload);

    try {
      const token = localStorage.getItem("token");

      // ✅ Call backend API
      const res = await api.post("/task/update-status", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Task updated successfully:", res.data);

    } catch (error) {
      console.error("❌ Error updating task:", error);

      // Optional: Revert UI change if API fails
      const revertedColumns = [...columns];
      const revertSourceCol = revertedColumns.find((col) => col.id === source.droppableId);
      const revertDestCol = revertedColumns.find((col) => col.id === destination.droppableId);

      // remove from destination, put back to source
      const [revertedTask] = revertDestCol.tasks.splice(destination.index, 1);
      revertSourceCol.tasks.splice(source.index, 0, revertedTask);

      setColumns(revertedColumns);
      // alert("Failed to update task on server!");
      toast.error("Failed to update task on server!");
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


  // Filter tasks based on search term
  const filtered = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((t) =>
      [t.title, t.description].some((v) =>
        v?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ),
  }));

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{workspaceName}</h1>
            <p className="text-gray-600 text-xs">Manage your project tasks</p>
          </div>
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
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="h-8 px-2 bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="w-3 h-3 mr-1" />
              <span className="text-xs">Add Task</span>
            </Button>
          </div>
        </div>

        {/* ✅ DragDropContext */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {filtered.map((col) => (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`${col.color} border-0 shadow-sm`}
                  >
                    <CardHeader className="px-3 py-2 border-b border-gray-200/50">
                      <CardTitle className="text-sm font-semibold text-gray-800">
                        {col.title} ({col.tasks.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 space-y-2 min-h-[100px]">
                      {col.tasks.length === 0 ? (
                        <p className="text-gray-500 text-xs text-center">No tasks yet</p>
                      ) : (
                        col.tasks.map((t, index) => (
                          <Draggable key={t.task_id} draggableId={String(t.task_id)} index={index}>
                            {(provided) => (
                              // <div
                              //   ref={provided.innerRef}
                              //   {...provided.draggableProps}
                              //   {...provided.dragHandleProps}
                              //   className="p-2 bg-white rounded-md border text-xs hover:shadow transition"
                              // >
                              //   <h3 className="font-medium text-gray-800">{t.title}</h3>
                              //   <p className="text-gray-500">{t.description}</p>
                              //   <p className="text-[10px] text-gray-400 mt-1">
                              //     👤 {t.employee_name} | 📅 {t.due_date || "N/A"}
                              //   </p>
                              //   {isCurrentOrFutureTask(t) && (
                              //     <button
                              //       type="button"
                              //       onMouseDown={(e) => e.stopPropagation()}
                              //       onClick={(e) => {
                              //         e.stopPropagation();
                              //         handleDeleteTask(t.task_id);
                              //       }}
                              //       className="mt-2 rounded bg-red-600 px-2 py-1 text-[10px] text-white hover:bg-red-700"
                              //     >
                              //       Delete
                              //     </button>
                              //   )}
                              // </div>
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                 className="relative p-2 bg-white rounded-md border text-xs hover:shadow transition"
                                
                  >
                                {/* Delete Red Cross Icon */}
                                {isCurrentOrFutureTask(t) && (
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTask(t.task_id);
                                    }}
                                    className="absolute top-1 right-1 z-50 text-red-500 hover:text-red-700 bg-white rounded-full px-[2px]"
                                  >
                                    ❌
                                  </button>
                                )}

                                <h3 className="font-medium text-gray-800">{t.title}</h3>
                                <p className="text-gray-500">{t.description}</p>

                                <p className="text-[10px] text-gray-400 mt-1">
                                  👤 {t.employee_name} | 📅 {t.due_date || "N/A"}
                                </p>
                              </div>


                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Popup Modal */}
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspace_id={id}
        workspace_name={workspaceName}
        onTaskAdded={fetchTasks}
      />
    </Layout>
  );
};
export default WorkspaceBoard;

