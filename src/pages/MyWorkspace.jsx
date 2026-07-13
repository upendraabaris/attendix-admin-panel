import React, { useState, useEffect } from "react";

import api from "../hooks/useApi";
import { toast } from "sonner";
import { Search } from "lucide-react";

const MyWorkspace = () => {
  const [tasks, setTasks] = useState([]);
  const [masterTasks, setMasterTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("daily"); // "daily" or "master"
  const [searchTerm, setSearchTerm] = useState("");

  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isEmployee = !role.includes("admin");

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Fetch Daily/General Tasks
      const tasksRes = await api.get("/task/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasksRes.data?.data || []);

      // Fetch Master Tasks assigned to me
      try {
        const mtRes = await api.get("/master-task/my", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMasterTasks(mtRes.data?.data || []);
      } catch (err) {
        console.warn("Master task endpoint might not be ready yet.", err);
        setMasterTasks([]);
      }
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter((t) => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.workspace_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMasterTasks = masterTasks.filter((m) => 
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.workspace_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMasterTasks = () => {
    if (filteredMasterTasks.length === 0) {
      return (
        <div className="text-center p-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
          No master tasks assigned to you yet.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMasterTasks.map((task) => {
          const priorityStyles = {
            low: "bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:ring-emerald-100",
            medium: "bg-blue-50 border-blue-200 hover:border-blue-400 hover:ring-blue-100",
            high: "bg-orange-50 border-orange-200 hover:border-orange-400 hover:ring-orange-100",
            critical: "bg-red-50 border-red-300 hover:border-red-500 hover:ring-red-200"
          };
          const badgeStyles = {
            low: "bg-emerald-100 text-emerald-800 border-emerald-200",
            medium: "bg-blue-100 text-blue-800 border-blue-200",
            high: "bg-orange-100 text-orange-800 border-orange-200",
            critical: "bg-red-100 text-red-800 border-red-300"
          };
          const pStyle = priorityStyles[task.priority?.toLowerCase()] || "bg-white border-gray-200";
          const bStyle = badgeStyles[task.priority?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";

          return (
            <div key={task.id} className={`p-5 rounded-xl shadow-sm border transition-all flex flex-col justify-between ${pStyle}`}>
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex flex-wrap items-center gap-2 mb-2">
                  {task.title}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border ${bStyle}`}>
                    {task.priority || "Medium"}
                  </span>
                </h3>
                {task.workspace_name && (
                  <div className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded w-fit mb-2">
                    {task.workspace_name}
                  </div>
                )}
                <p className="text-sm text-gray-500 line-clamp-3 mb-3">{task.description || "No description provided."}</p>
              </div>
              <div className="mt-auto pt-3 border-t border-black/5 flex justify-between items-center">
                 <div className="text-[10px] font-semibold text-gray-600 bg-white/50 px-2 py-1 rounded inline-block border border-black/5">
                   📅 {task.start_date ? new Date(task.start_date).toLocaleDateString('en-GB') : 'N/A'} - {task.end_date ? new Date(task.end_date).toLocaleDateString('en-GB') : 'N/A'}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDailyTasks = () => {
    if (filteredTasks.length === 0) {
      return (
        <div className="text-center p-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
          No tasks found.
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b">
              <tr>
                <th className="px-4 py-3">Task Title</th>
                <th className="px-4 py-3">Workspace</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Tracked</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr key={task.task_id || task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{task.title}</td>
                  <td className="px-4 py-3 text-blue-600 font-medium">{task.workspace_name || "-"}</td>
                  <td className="px-4 py-3 capitalize">{task.task_type || "daily"}</td>
                  <td className="px-4 py-3 font-semibold text-purple-700">
                    {(() => {
                      if (!task.started_at) return "-";
                      const start = new Date(task.started_at).getTime();
                      const end = task.ended_at ? new Date(task.ended_at).getTime() : new Date().getTime();
                      const diffMs = Math.max(0, end - start);
                      const diffHrs = Math.floor(diffMs / 3600000);
                      const diffMins = Math.floor((diffMs % 3600000) / 60000);
                      return `${diffHrs}h ${diffMins}m ${!task.ended_at ? '(Live)' : ''}`;
                    })()}
                  </td>
                  <td className="px-4 py-3">{task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB') : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      task.status === 'closed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {task.status || 'open'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-transparent h-full">
      <div className="max-w-7xl mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Workspace</h1>
            <p className="text-sm text-gray-500 mt-1">Track all your assigned master tasks and logged tasks in one place.</p>
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
          <button 
            onClick={() => setActiveTab('master')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'master' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            My Master Tasks
          </button>
          <button 
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'daily' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            My Logged Tasks
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div>
            {activeTab === 'master' ? renderMasterTasks() : renderDailyTasks()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWorkspace;
