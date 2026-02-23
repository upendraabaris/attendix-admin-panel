  import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../hooks/useApi";
import { toast } from "sonner";

const WEEKDAY_OPTIONS = [
  { key: "sun", label: "Sun" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
];

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const [newTask, setNewTask] = useState({
    employee_id: "",
    title: "",
    due_date: "",
    notes: "",
    recurrence_type: "none",
    recurrence_days: [],
    recurrence_end_date: "",
    monthly_day: "",
  });

  const startListening = (field) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setNewTask((prev) => ({
        ...prev,
        [field]: prev[field] ? `${prev[field]} ${transcript}` : transcript,
      }));
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get("/task/all");
      setTasks(res.data.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/employee/getEmployees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const toggleWeekday = (day) => {
    setNewTask((prev) => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(day)
        ? prev.recurrence_days.filter((d) => d !== day)
        : [...prev.recurrence_days, day],
    }));
  };

  const handleRecurrenceTypeChange = (value) => {
    setNewTask((prev) => ({
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
    if (newTask.recurrence_type === "weekly" && newTask.recurrence_days.length === 0) {
      toast.error("Select at least one weekday for weekly recurrence");
      return false;
    }

    if (newTask.recurrence_type !== "none" && !newTask.recurrence_end_date) {
      toast.error("End date is required for recurring task");
      return false;
    }

    if (newTask.recurrence_type === "monthly") {
      const day = Number(newTask.monthly_day);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        toast.error("Monthly date must be between 1 and 31");
        return false;
      }
    }

    return true;
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        employee_id: newTask.employee_id,
        title: newTask.title,
        due_date: newTask.due_date,
        description: newTask.notes,
        attachment: null,
        workspace_id: 1,
        workspace_name: null,
        recurrence_type: newTask.recurrence_type,
        recurrence_days:
          newTask.recurrence_type === "weekly" ? newTask.recurrence_days.join(",") : null,
        recurrence_end_date:
          newTask.recurrence_type === "none" ? null : newTask.recurrence_end_date,
        monthly_day: newTask.recurrence_type === "monthly" ? Number(newTask.monthly_day) : null,
      };

      const res = await api.post("/task/assignTask", payload);
      const createdCount = res?.data?.count || 1;
      toast.success(`${createdCount} task(s) created successfully`);

      setNewTask({
        employee_id: "",
        title: "",
        due_date: "",
        notes: "",
        recurrence_type: "none",
        recurrence_days: [],
        recurrence_end_date: "",
        monthly_day: "",
      });

      fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error(error?.response?.data?.message || "Failed to add task");
    }
  };

  const getFilteredTasks = (employee) => {
    const list = employee.tasks || [];

    if (filter === "completed") return list.filter((task) => task.completed);
    if (filter === "pending") return list.filter((task) => !task.completed);
    return list;
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

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Employee Tasks</h1>
        <p className="text-gray-600">Manage and assign employee tasks</p>

        <form onSubmit={handleAddTask} className="bg-white shadow p-4 rounded-lg space-y-3">
          <h2 className="font-semibold text-lg">Assign New Task</h2>

          <select
            value={newTask.employee_id}
            onChange={(e) => setNewTask({ ...newTask, employee_id: e.target.value })}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <button
              type="button"
              onClick={() => startListening("title")}
              className="px-3 py-2 bg-indigo-300 text-white rounded"
            >
              Mic
            </button>
          </div>

          <input
            type="date"
            value={newTask.due_date}
            onChange={(e) => {
              const value = e.target.value;
              setNewTask((prev) => ({
                ...prev,
                due_date: value,
                monthly_day:
                  prev.recurrence_type === "monthly" && value
                    ? String(new Date(value).getDate())
                    : prev.monthly_day,
              }));
            }}
            className="w-full p-2 border rounded"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
            <select
              value={newTask.recurrence_type}
              onChange={(e) => handleRecurrenceTypeChange(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {newTask.recurrence_type === "weekly" && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Repeat on</p>
              <div className="flex flex-wrap gap-3">
                {WEEKDAY_OPTIONS.map((day) => (
                  <label key={day.key} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newTask.recurrence_days.includes(day.key)}
                      onChange={() => toggleWeekday(day.key)}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {newTask.recurrence_type === "monthly" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Date (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={newTask.monthly_day}
                onChange={(e) => setNewTask({ ...newTask, monthly_day: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          )}

          {newTask.recurrence_type !== "none" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={newTask.recurrence_end_date}
                onChange={(e) => setNewTask({ ...newTask, recurrence_end_date: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          )}

          <div className="flex gap-2">
            <textarea
              placeholder="Task Notes (optional)"
              value={newTask.notes}
              onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows="3"
            />
            <button
              type="button"
              onClick={() => startListening("notes")}
              className="px-3 py-2 bg-indigo-300 text-white rounded h-10"
            >
              Mic
            </button>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Task
          </button>
        </form>

        <div className="flex gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded ${
              filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded ${
              filter === "completed" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded ${
              filter === "pending" ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Pending
          </button>
        </div>

        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500">No tasks found.</p>
        ) : (
          tasks.map((employee) => {
            const filteredTasks = getFilteredTasks(employee);
            if (filteredTasks.length === 0) return null;

            return (
              <div key={employee.employee_id} className="bg-white shadow rounded-lg p-4">
                <h2 className="font-semibold">{employee.name}</h2>

                <div className="mt-3 space-y-3">
                  {filteredTasks.map((task) => (
                    <div key={task.task_id} className="border rounded p-3 bg-gray-50">
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-gray-500">Due Date: {task.due_date || "Not set"}</p>
                      <p className="text-sm text-gray-500">Notes: {task.description || "No notes"}</p>

                      <div className="mt-2 flex items-center gap-2">
                        {!task.completed ? (
                          <button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                            Pending
                          </button>
                        ) : (
                          <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                            Completed
                          </button>
                        )}

                        {isCurrentOrFutureTask(task) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.task_id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}

export default Tasks;
