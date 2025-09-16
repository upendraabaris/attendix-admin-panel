import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../hooks/useApi";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // ✅ New Task form state
  const [newTask, setNewTask] = useState({
    employee_id: "",
    title: "",
    due_date: "",
    notes: "",
  });

  // 👇 SpeechRecognition setup
  const startListening = (field) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("❌ Voice recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // 👈 Hindi ke liye "hi-IN" kar sakte ho
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setNewTask((prev) => ({
        ...prev,
        [field]: prev[field] + " " + transcript,
      }));
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
  };

  // 👇 Fetch tasks
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

  // 👇 Fetch employees
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/employee/getEmployees", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  // 👇 Add Task Function
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        employee_id: newTask.employee_id,
        title: newTask.title,
        due_date: newTask.due_date,
        description: newTask.notes,
      };

      await api.post("/task/assignTask", payload);
      alert("✅ Task added successfully!");

      setNewTask({
        employee_id: "",
        title: "",
        due_date: "",
        notes: "",
      });

      fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
      alert("❌ Failed to add task");
    }
  };

  // 👇 Task filter function
  const getFilteredTasks = (employee) => {
    if (filter === "completed") {
      return employee.tasks.filter((task) => task.completed);
    } else if (filter === "pending") {
      return employee.tasks.filter((task) => !task.completed);
    }
    return employee.tasks;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Employee Tasks</h1>
        <p className="text-gray-600">Manage and assign employee tasks</p>

        {/* 🔹 Add Task Form */}
        <form
          onSubmit={handleAddTask}
          className="bg-white shadow p-4 rounded-lg space-y-3"
        >
          <h2 className="font-semibold text-lg">➕ Assign New Task</h2>

          {/* Employee Select */}
          <select
            value={newTask.employee_id}
            onChange={(e) =>
              setNewTask({ ...newTask, employee_id: e.target.value })
            }
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

          {/* Task Title with Voice */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Task Title"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
            <button
              type="button"
              onClick={() => startListening("title")}
              className="px-3 py-2 bg-indigo-300 text-white rounded"
            >
              🎤
            </button>
          </div>

          {/* Due Date */}
          <input
            type="date"
            value={newTask.due_date}
            onChange={(e) =>
              setNewTask({ ...newTask, due_date: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />

          {/* Notes with Voice */}
          <div className="flex gap-2">
            <textarea
              placeholder="Task Notes (optional)"
              value={newTask.notes}
              onChange={(e) =>
                setNewTask({ ...newTask, notes: e.target.value })
              }
              className="w-full p-2 border rounded"
              rows="3"
            ></textarea>
            <button
              type="button"
              onClick={() => startListening("notes")}
              className="px-3 py-2 bg-indigo-300 text-white rounded h-10"
            >
              🎤
            </button>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Task
          </button>
        </form>

        {/* 🔹 Filter Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded ${
              filter === "completed"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded ${
              filter === "pending"
                ? "bg-yellow-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Pending
          </button>
        </div>

        {/* 🔹 Task List */}
        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500">No tasks found.</p>
        ) : (
          tasks.map((employee) => {
            const filteredTasks = getFilteredTasks(employee);

            if (filteredTasks.length === 0) return null;

            return (
              <div
                key={employee.employee_id}
                className="bg-white shadow rounded-lg p-4"
              >
                <h2 className="font-semibold">{employee.name}</h2>

                <div className="mt-3 space-y-3">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="border rounded p-3 bg-gray-50"
                    >
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-gray-500">
                        Due Date: {task.due_date || "Not set"}
                      </p>

                      {/* <p className="text-sm text-gray-500">
                        Time:{" "}
                        {new Date(task.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                          timeZone: "Asia/Kolkata",
                        })}
                      </p> */}

                      <p className="text-sm text-gray-500">
                        Notes: {task.description || "No notes"}
                      </p>

                      {!task.completed ? (
                        <button className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                          Pending
                        </button>
                      ) : (
                        <button className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                          Completed
                        </button>
                      )}
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
