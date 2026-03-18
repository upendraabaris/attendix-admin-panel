import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../hooks/useApi";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  ClipboardCheck,
  Mic,
  CalendarDays,
  CheckCircle2,
  Clock4,
  Trash2,
  ListTodo,
  ListChecks,
  Users,
} from "lucide-react";

const WEEKDAY_OPTIONS = [
  { key: "sun", label: "Sun" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
];

const getInitials = (name) =>
  (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const formatDate = (val) => {
  if (!val) return "Not set";
  const d = new Date(val);
  return isNaN(d)
    ? val
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

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
    recognition.onerror = (event) =>
      console.error("Speech recognition error:", event.error);
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
          ? prev.monthly_day ||
            (prev.due_date ? String(new Date(prev.due_date).getDate()) : "")
          : "",
    }));
  };

  const validateForm = () => {
    if (
      newTask.recurrence_type === "weekly" &&
      newTask.recurrence_days.length === 0
    ) {
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
          newTask.recurrence_type === "weekly"
            ? newTask.recurrence_days.join(",")
            : null,
        recurrence_end_date:
          newTask.recurrence_type === "none"
            ? null
            : newTask.recurrence_end_date,
        monthly_day:
          newTask.recurrence_type === "monthly"
            ? Number(newTask.monthly_day)
            : null,
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

  const normalizeDate = (value) => {
    if (!value) return null;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
      return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  };

  const isCurrentOrFutureTask = (task) => {
    const taskDate = normalizeDate(task.due_date_iso || task.due_date);
    if (!taskDate) return false;
    return taskDate >= normalizeDate(new Date());
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

  const getFilteredTasks = (employee) => {
    const list = employee.tasks || [];
    if (filter === "completed") return list.filter((t) => t.completed);
    if (filter === "pending") return list.filter((t) => !t.completed);
    return list;
  };

  // Summary stats across all employees
  const allTasks = tasks.flatMap((e) => e.tasks || []);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  const FILTER_TABS = [
    {
      key: "all",
      label: "All",
      count: totalTasks,
      icon: <ListTodo className="w-3.5 h-3.5" />,
    },
    {
      key: "completed",
      label: "Completed",
      count: completedTasks,
      icon: <ListChecks className="w-3.5 h-3.5" />,
    },
    {
      key: "pending",
      label: "Pending",
      count: pendingTasks,
      icon: <Clock4 className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-indigo-600" />
            Employee Tasks
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Assign and track tasks across your team.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Tasks",
              value: totalTasks,
              icon: <ListTodo className="w-5 h-5 text-indigo-600" />,
              bg: "bg-indigo-50",
            },
            {
              label: "Completed",
              value: completedTasks,
              icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
              bg: "bg-green-50",
            },
            {
              label: "Pending",
              value: pendingTasks,
              icon: <Clock4 className="w-5 h-5 text-yellow-600" />,
              bg: "bg-yellow-50",
            },
          ].map(({ label, value, icon, bg }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4"
            >
              <div className={`p-2.5 rounded-lg ${bg} shrink-0`}>{icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Assign New Task Form */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              Assign New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleAddTask}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Employee */}
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs text-gray-500 font-medium">
                  Employee
                </Label>
                <Select
                  value={newTask.employee_id}
                  onValueChange={(v) =>
                    setNewTask({ ...newTask, employee_id: v })
                  }
                  required
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Task Title */}
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs text-gray-500 font-medium">
                  Task Title
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter task title..."
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="h-9 text-sm"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-indigo-500 border-indigo-200 hover:bg-indigo-50"
                    onClick={() => startListening("title")}
                    title="Voice input"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 font-medium">
                  Due Date
                </Label>
                <Input
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
                  className="h-9 text-sm"
                  required
                />
              </div>

              {/* Recurrence */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 font-medium">
                  Recurrence
                </Label>
                <Select
                  value={newTask.recurrence_type}
                  onValueChange={handleRecurrenceTypeChange}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Weekly day picker */}
              {newTask.recurrence_type === "weekly" && (
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs text-gray-500 font-medium">
                    Repeat on
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAY_OPTIONS.map((day) => (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => toggleWeekday(day.key)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          newTask.recurrence_days.includes(day.key)
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly day */}
              {newTask.recurrence_type === "monthly" && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 font-medium">
                    Day of Month (1–31)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={newTask.monthly_day}
                    onChange={(e) =>
                      setNewTask({ ...newTask, monthly_day: e.target.value })
                    }
                    className="h-9 text-sm"
                    required
                  />
                </div>
              )}

              {/* Recurrence end date */}
              {newTask.recurrence_type !== "none" && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 font-medium">
                    Recurrence End Date
                  </Label>
                  <Input
                    type="date"
                    value={newTask.recurrence_end_date}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        recurrence_end_date: e.target.value,
                      })
                    }
                    className="h-9 text-sm"
                    required
                  />
                </div>
              )}

              {/* Notes */}
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs text-gray-500 font-medium">
                  Notes <span className="text-gray-400">(optional)</span>
                </Label>
                <div className="flex gap-2 items-start">
                  <Textarea
                    placeholder="Add any task notes..."
                    value={newTask.notes}
                    onChange={(e) =>
                      setNewTask({ ...newTask, notes: e.target.value })
                    }
                    rows={3}
                    className="text-sm resize-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-indigo-500 border-indigo-200 hover:bg-indigo-50 mt-0.5"
                    onClick={() => startListening("notes")}
                    title="Voice input"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-5 text-sm font-medium"
                >
                  <ClipboardCheck className="w-3.5 h-3.5 mr-2" />
                  Assign Task
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {FILTER_TABS.map(({ key, label, count, icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === key
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              {icon}
              {label}
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  filter === key
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Task List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading tasks...</p>
          </div>
        ) : totalTasks === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
            <ClipboardCheck className="w-10 h-10 mb-3 opacity-25" />
            <p className="text-sm font-medium">No tasks yet</p>
            <p className="text-xs mt-1">Assign a task using the form above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((employee) => {
              const filteredTasks = getFilteredTasks(employee);
              if (filteredTasks.length === 0) return null;

              return (
                <div
                  key={employee.employee_id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Employee header */}
                  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(employee.name)}
                    </div>
                    <p className="font-semibold text-sm text-gray-900">
                      {employee.name}
                    </p>
                    <span className="ml-auto text-xs font-medium text-gray-400">
                      {filteredTasks.length} task
                      {filteredTasks.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="divide-y divide-gray-50">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.task_id}
                        className={`flex items-start justify-between gap-4 px-5 py-4 border-l-4 ${
                          task.completed
                            ? "border-l-green-400"
                            : "border-l-yellow-400"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {formatDate(task.due_date)}
                            </span>
                            {task.completed ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-medium">
                                Completed
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs font-medium">
                                Pending
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-400 mt-1.5">
                              {task.description}
                            </p>
                          )}
                        </div>
                        {isCurrentOrFutureTask(task) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.task_id)}
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Tasks;
