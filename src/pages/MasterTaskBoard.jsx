import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import api from "../hooks/useApi";
import Layout from "../components/Layout";
import { PlusCircle, Search } from "lucide-react";
import { Button } from "../components/ui/button";

const MasterTaskBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const workspaceName = state?.workspaceName || `Workspace #${id}`;
  
  const [masterTasks, setMasterTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMasterTasks();
  }, []);

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

  const handleCreateMasterTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await api.post("/master-task/create", {
        workspace_id: id,
        title,
        description
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success("Master task created successfully");
      setTitle("");
      setDescription("");
      setIsModalOpen(false);
      fetchMasterTasks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create master task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = masterTasks.filter(t => 
    [t.title, t.description].some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{workspaceName} / Master Tasks</h1>
            <p className="text-gray-600 text-sm">Select a master task to view its logbook</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search master tasks..."
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="px-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Master Task
            </Button>
          </div>
        </div>

        {/* Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
              No master tasks found. Click "Add Master Task" to create one.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div 
                key={task.id} 
                onClick={() => navigate(`/workspace/${id}/master-task/${task.id}`, { state: { workspaceName, masterTaskTitle: task.title } })}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{task.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3">{task.description || "No description provided."}</p>
                
                <div className="mt-4 flex items-center text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Logbook &rarr;
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">Add Master Task</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
              </div>
              <form onSubmit={handleCreateMasterTask} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                  <input 
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="E.g., Quarterly Review"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="What is this master task about?"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || !title.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isSubmitting ? "Saving..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MasterTaskBoard;
