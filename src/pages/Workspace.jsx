import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Card, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { PlusCircle, Users, ArrowRight, Search, FolderOpen, Sparkles, Mic, X } from "lucide-react";
import api from "../hooks/useApi";
import { toast } from "sonner";
import MyWorkspace from "./MyWorkspace";


const Workspace = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isAdminRole = role.includes("admin");

  const handleAuthFailure = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("orgID");
    localStorage.removeItem("role");
    localStorage.removeItem("employee_name");
    navigate("/login");
  };

  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [mtTitle, setMtTitle] = useState("");
  const [mtDescription, setMtDescription] = useState("");
  const [mtStartDate, setMtStartDate] = useState("");
  const [mtEndDate, setMtEndDate] = useState("");
  const [mtAssignees, setMtAssignees] = useState([]);
  const [mtPriority, setMtPriority] = useState("medium");
  const [mtWorkspaces, setMtWorkspaces] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/employee/getEmployees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployees(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  const openMasterTaskModal = () => {
    setMtTitle("");
    setMtDescription("");
    setMtStartDate("");
    setMtEndDate("");
    setMtAssignees([]);
    setMtWorkspaces([]);
    setMtPriority("medium");
    setIsMasterModalOpen(true);
  };

  const handleCreateMasterTask = async (e) => {
    e.preventDefault();
    if (!mtTitle.trim()) {
      toast.error("Master Task title is required!");
      return;
    }
    if (mtWorkspaces.length === 0) {
      toast.error("Please select at least one workspace!");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await api.post("/master-task/create", {
        workspace_ids: mtWorkspaces,
        title: mtTitle,
        description: mtDescription,
        start_date: mtStartDate,
        end_date: mtEndDate,
        assignees: mtAssignees,
        priority: mtPriority
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Master task created successfully!");
      setIsMasterModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create master task!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startListening = (setterFunc, currentValue) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition is not supported in your browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setterFunc(currentValue ? `${currentValue} ${transcript}` : transcript);
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      toast.error("Error recognizing voice.");
    };
    recognition.start();
  };

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        let res;
        if (isAdminRole) {
          // ✅ Admin: show all workspaces
          res = await api.get("/workspaces");
        } else {
          // ✅ Employee: show only assigned workspaces directly
          res = await api.get("/workspaces/emp/workspace");
        }

        const allWorkspaces = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        setWorkspaces(allWorkspaces);
      } catch (error) {
        if ([401, 403].includes(error.response?.status)) {
          handleAuthFailure();
          return;
        }
        console.error("Error fetching workspaces:", error);
      }
    };

    fetchWorkspaces();
  }, [isAdminRole]);

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) return;
    setIsCreating(true);
    
    const employeeName = localStorage.getItem("employee_name") || "Admin";

    api
      .post("/workspaces", { name: newWorkspaceName, created_by_name: employeeName })
      .then((res) => {
        const createdWorkspace = res.data?.data ?? res.data;
        setWorkspaces((prev) => [...prev, createdWorkspace]);
        setNewWorkspaceName("");
        setIsCreating(false);
      })
      .catch((error) => {
        if ([401, 403].includes(error.response?.status)) {
          handleAuthFailure();
          return;
        }
        setIsCreating(false);
      });
  };

  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchTerm.toLowerCase())
  );



  return (
    <Layout>
      <div className="flex flex-col h-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border">
              <FolderOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Workspaces</h1>
              <p className="text-gray-600 mt-1">Organize your projects and collaborate with your team</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search workspaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm w-full lg:w-64"
              />
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Workspace name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm min-w-[200px]"
              />
              <Button
                size="sm"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 transition-all duration-200"
                onClick={handleCreateWorkspace}
                disabled={isCreating}
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
                Create
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-200"
                onClick={openMasterTaskModal}
              >
                <PlusCircle className="w-4 h-4" />
                Master Task
              </Button>
            </div>
          </div>
        </div>

        {/* Workspace Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'all' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            All Workspaces
          </button>
          <button 
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'my' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            My Workspace
          </button>
        </div>

        {activeTab === "my" ? (
          <MyWorkspace />
        ) : (
          <>
            {/* Empty State */}
            {workspaces.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No workspaces yet</h2>
                <p className="text-gray-600 max-w-md mb-6">
                  Create your first workspace to start organizing your projects and collaborating with your team.
                </p>
              </div>
            )}

            {/* Workspace Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredWorkspaces.map((ws) => (
                <Card
                  key={ws.id}
                  className="cursor-pointer group bg-white border border-gray-200 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
                  onClick={() => navigate(`/workspace/${ws.id}`, { state: { workspaceName: ws.name } })}
                >
                  <div className="h-2 bg-blue-200" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {ws.name}
                      </CardTitle>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                    </div>

                    <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                      <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 w-fit">
                        <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Created By:</span>
                        <span className="text-[9px] text-blue-700 font-semibold">
                          {ws.created_by_name || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 w-fit">
                        <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Created On:</span>
                        <span className="text-[9px] text-blue-700 font-semibold">
                          {ws.created_at ? new Date(ws.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Search Empty State */}
            {workspaces.length > 0 && filteredWorkspaces.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No workspaces found</h3>
                <p className="text-gray-600">Try adjusting your search terms</p>
              </div>
            )}
          </>
        )}

        {/* Master Task Modal */}
        {isMasterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Create Master Task
                </h2>
                <button
                  onClick={() => setIsMasterModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleCreateMasterTask}>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={mtTitle}
                        onChange={(e) => setMtTitle(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="E.g., Implement Authentication"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => startListening(setMtTitle, mtTitle)}
                      >
                        <Mic className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={mtStartDate}
                        onChange={(e) => setMtStartDate(e.target.value)}
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

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <div className="flex gap-2 items-start">
                      <textarea
                        value={mtDescription}
                        onChange={(e) => setMtDescription(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        placeholder="What is this master task about?"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-blue-500 border-blue-200 hover:bg-blue-50 mt-1"
                        onClick={() => startListening(setMtDescription, mtDescription)}
                      >
                        <Mic className="w-4 h-4" />
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
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Assign To</label>
                        <div className="flex-1 min-h-[120px] max-h-[120px] overflow-y-auto border border-gray-200 rounded-md p-2 bg-white flex flex-col gap-1">
                          {employees.map(emp => (
                            <label key={emp.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded text-blue-600"
                                checked={mtAssignees.includes(emp.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setMtAssignees([...mtAssignees, emp.id]);
                                  else setMtAssignees(mtAssignees.filter(id => id !== emp.id));
                                }}
                              />
                              <span className="text-xs text-gray-700">{emp.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Workspaces */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Map to Workspaces <span className="text-red-500">*</span></label>
                      <div className="flex-1 min-h-[185px] max-h-[185px] overflow-y-auto border border-gray-200 rounded-md p-2 bg-white flex flex-col gap-1">
                        {workspaces.map(ws => (
                          <label key={ws.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded text-blue-600"
                              checked={mtWorkspaces.includes(ws.id)}
                              onChange={(e) => {
                                if (e.target.checked) setMtWorkspaces([...mtWorkspaces, ws.id]);
                                else setMtWorkspaces(mtWorkspaces.filter(id => id !== ws.id));
                              }}
                            />
                            <span className="text-xs text-gray-700 font-medium">{ws.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                    <Button type="button" variant="outline" onClick={() => setIsMasterModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !mtTitle.trim() || mtWorkspaces.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white">
                      {isSubmitting ? "Creating..." : "Create Task"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Workspace;
