// src/pages/EmpTasks.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../hooks/useApi";

function EmpTasks() {
  const { id } = useParams(); // 👈 URL से employeeId
  const [tasks, setTasks] = useState([]);
  const [employeeName, setEmployeeName] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch all tasks
  const fetchTasks = async () => {
    try {
      const res = await api.get("/task/all");
      const employees = res.data.data || [];

      // 🔍 Find employee by id
      const emp = employees.find(
        (e) => String(e.employee_id) === String(id)
      );

      if (emp) {
        setEmployeeName(emp.name);
        setTasks(emp.tasks || []);
      } else {
        setEmployeeName("Unknown Employee");
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [id]);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Task History for {employeeName} 
        </h1>

        {loading ? (
          <p>Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500">No tasks found for this employee.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.task_id}
                className="border rounded p-4 bg-white shadow"
              >
                <h3 className="text-lg font-semibold">{task.title}</h3>
                <p className="text-sm text-gray-500">
                  Due Date: {task.due_date}
                </p>
                {/* <p className="text-sm text-gray-500">
                  Created: {task.created_at}
                </p>
                <p className="text-sm text-gray-500">
                  Updated: {task.updated_at}
                </p> */}
                <p className="text-sm text-gray-700">
                  Notes: {task.description || "No notes"}
                </p>

                {task.completed ? (
                  <span className="inline-block mt-2 px-3 py-1 text-sm rounded bg-green-500 text-white">
                    ✅ Completed
                  </span>
                ) : (
                  <span className="inline-block mt-2 px-3 py-1 text-sm rounded bg-yellow-500 text-white">
                    ⏳ Pending
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default EmpTasks;
