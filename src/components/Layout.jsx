import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  LogOut,
  Menu,
  User,
  Briefcase,
} from "lucide-react";
import { cn } from "../lib/utils";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const employeeName = localStorage.getItem("employee_name");

  const role = localStorage.getItem("role");
  const normalizedRole = (role || "").toLowerCase();
  const isAdminRole = normalizedRole.includes("admin");
  let navigation = [];
  if (isAdminRole) {
    navigation = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Employees", href: "/employees", icon: Users },
      { name: "Leave Requests", href: "/leaves", icon: Calendar },
      { name: "Attendance", href: "/attendance", icon: Clock },
      { name: "Employee Task", href: "/tasks", icon: Users },
      { name: "Workspace", href: "/workspace", icon: Briefcase },
    ];
  } else {
    navigation = [
      { name: "Attendance", href: "/employee-attendance", icon: Clock },
      { name: "Leave Request", href: "/employee-leaves", icon: Calendar },
      { name: "Workspace", href: "/workspace", icon: Briefcase }
    ]
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("orgID");
    localStorage.removeItem("role");
    localStorage.removeItem("employee_name");
    navigate("/login");
  };

  const isActive = (href) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={cn(
          "bg-white shadow-lg transition-all duration-300 flex flex-col h-screen sticky top-0",
          sidebarOpen ? "w-64" : "w-16",
        )}
      >
        {/* Admin Panel Fixed Section */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <h1 className="text-lg font-semibold text-gray-900">
                {role === "admin" ? "Admin Panel" : "Employee Portal"}
              </h1>
            )}
          </div>
        </div>

        {/* Navigation (also fixed, not scrollable) */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                  isActive(item.href)
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                <Icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout Button Fixed at Bottom */}
        <div className="p-4 border-t">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <button
                  onClick={role === "admin" ? () => navigate("/change-password") : undefined}
                  className={`text-sm font-medium ${role === "admin"
                    ? "text-gray-700 hover:underline"
                    : "text-gray-400"
                    }`}
                >
                  {employeeName ? employeeName : "Admin User"}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content (scroll only here) */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
