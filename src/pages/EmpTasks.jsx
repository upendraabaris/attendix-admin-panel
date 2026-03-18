import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../hooks/useApi";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  ClipboardCheck,
  UserCircle2,
  ListTodo,
  CheckCircle2,
  Clock4,
  CalendarDays,
} from "lucide-react";

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d)
    ? val
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

function EmpTasks() {
  const { id } = useParams();
  const [tasks, setTasks] = useState([]);
  const [employeeName, setEmployeeName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/task/all");
      const employees = res.data.data || [];
      const emp = employees.find((e) => String(e.employee_id) === String(id));
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

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50">
            <UserCircle2 className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{employeeName || "..."}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Task History</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Tasks", value: tasks.length, icon: <ListTodo className="w-5 h-5 text-indigo-600" />, bg: "bg-indigo-50" },
            { label: "Completed", value: completedCount, icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, bg: "bg-green-50" },
            { label: "Pending", value: pendingCount, icon: <Clock4 className="w-5 h-5 text-yellow-600" />, bg: "bg-yellow-50" },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${bg} shrink-0`}>{icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ClipboardCheck className="w-10 h-10 mb-3 opacity-25" />
              <p className="text-sm font-medium">No tasks found</p>
              <p className="text-xs mt-1">No tasks have been assigned to this employee yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="w-10 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      #
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Title
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                      Due Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Notes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task, index) => (
                    <TableRow
                      key={task.task_id}
                      className={
                        task.completed
                          ? "hover:bg-green-50/30"
                          : "hover:bg-yellow-50/30"
                      }
                    >
                      <TableCell className="text-center text-gray-400 text-xs font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-sm text-gray-900">
                        {task.title}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(task.due_date)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {task.completed ? (
                          <Badge className="bg-green-100 text-green-800 border border-green-200 text-xs font-medium whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs font-medium whitespace-nowrap">
                            <Clock4 className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-xs whitespace-normal break-words">
                        {task.description || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}

export default EmpTasks;
