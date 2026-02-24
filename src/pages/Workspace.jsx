import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Card, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { PlusCircle, Users, ArrowRight, Search, FolderOpen, Sparkles } from "lucide-react";
import api from "../hooks/useApi";


const Workspace = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
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

// useEffect(() => {
//   const fetchWorkspaces = async () => {
//     try {
//       const role = localStorage.getItem("role");

//       if (role === "admin") {
//         // ✅ Admin: show all workspaces
//         const res = await api.get("/workspaces");
//         setWorkspaces(res.data);
//       } else {
//         // ✅ Employee: show only assigned workspaces
//         const [allRes, empRes] = await Promise.all([
//           api.get("/workspaces"),
//           api.get("/workspaces/emp/workspace"),
//         ]);

//         const allWorkspaces = allRes.data;
//         const empWorkspaces = empRes.data;
//         const empWorkspaceIds = empWorkspaces.map((ws) => ws.id);

//         const filtered = allWorkspaces.filter((ws) =>
//           empWorkspaceIds.includes(ws.id)
//         );

//         setWorkspaces(filtered);
//       }
//     } catch (error) {
//       console.error("Error fetching workspaces:", error);
//     }
//   };

//   fetchWorkspaces();
// }, []);

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
    
    api
      .post("/workspaces", { name: newWorkspaceName })
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

  const getRandomColor = () => {
    const colors = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-green-500 to-green-600",
      "bg-gradient-to-br from-purple-500 to-purple-600",
      "bg-gradient-to-br from-orange-500 to-orange-600",
      "bg-gradient-to-br from-pink-500 to-pink-600",
      "bg-gradient-to-br from-indigo-500 to-indigo-600"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

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
            </div>
          </div>
        </div>

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
              <div className={`h-3 ${getRandomColor()}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {ws.name}
                  </CardTitle>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                </div>
                
                {/* <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Users className="w-4 h-4" />
                  <span>{ws.memberCount || 1} member{ws.memberCount !== 1 ? 's' : ''}</span>
                </div> */}
                
                <div className="flex items-center justify-between">
                  {/* <span className="text-xs text-gray-400">
                    Updated {ws.lastUpdated || 'recently'}
                  </span> */}
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                    <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
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
      </div>
    </Layout>
  );
};

export default Workspace;
