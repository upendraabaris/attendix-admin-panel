// export default Layout;
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  Clock,
  LogOut,
  Menu,
  Briefcase,
  KeyRound,
  ChevronLeft,
  FileBarChart,
  Scale,
  CheckSquare,
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
  const orgID = localStorage.getItem("orgID");

  let navigation = [];
  if (isAdminRole) {
    navigation = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Employees", href: "/employees", icon: Users },
      { name: "Leave Requests", href: "/leaves", icon: Calendar },
      { name: "Leave Policy", href: "/leave-policy", icon: KeyRound },
      { name: "Work Week Policy", href: "/work-week-policy", icon: Scale },
      { name: "Attendance", href: "/attendance", icon: Clock },
      { name: "Employee Task", href: "/tasks", icon: CheckSquare },
      { name: "Workspace", href: "/workspace", icon: Briefcase },
      { name: "Reports", href: "/reports", icon: FileBarChart },
    ];
  } else {
    navigation = [
      { name: "Attendance", href: "/employee-attendance", icon: Clock },
      { name: "Leave Request", href: "/employee-leaves", icon: Calendar },
      { name: "Work Week Policy", href: "/employee-work-week-policy", icon: KeyRound },
      { name: "Leave Policy", href: "/employee-leave-policy", icon: KeyRound },
      { name: "Holiday", href: "/employee-holidays", icon: CalendarDays },
      ...(orgID !== "13"
        ? [{ name: "Workspace", href: "/workspace", icon: Briefcase }]
        : []),
    ];
  }

  const handleLogout = () => {
    ["token", "user", "isAuthenticated", "orgID", "role", "employee_id", "employee_name"].forEach(
      (k) => localStorage.removeItem(k)
    );
    navigate("/login", { replace: true });
  };

  const isActive = (href) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  const displayName = employeeName || (isAdminRole ? "Admin User" : "Employee User");
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "#f0f4f8", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out flex-shrink-0",
          sidebarOpen ? "w-60" : "w-[68px]"
        )}
        style={{
          background: "#ffffff",
          borderRight: "1px solid #e5eaf2",
          boxShadow: "2px 0 16px rgba(0,0,0,0.05)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center px-4 py-5 min-h-[68px] gap-3" style={{ borderBottom: "1px solid #e5eaf2" }}>
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}
          >
            <Briefcase style={{ width: 17, height: 17, color: "#fff" }} />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-slate-800 whitespace-nowrap leading-tight">
                {isAdminRole ? "Admin Panel" : "Employee Portal"}
              </p>
              <p className="text-[11px] text-slate-400 whitespace-nowrap">Management Suite</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group relative",
                  active
                    ? "text-blue-600 font-medium"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
                style={
                  active
                    ? { background: "#eff6ff", boxShadow: "inset 3px 0 0 #3b82f6" }
                    : {}
                }
              >
                <Icon
                  style={{ width: 18, height: 18, flexShrink: 0 }}
                  className={active ? "text-blue-500" : "text-slate-400 group-hover:text-slate-500"}
                />
                {sidebarOpen && (
                  <span className="text-sm truncate">{item.name}</span>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: user + logout */}
        <div className="px-3 pb-4 pt-2 space-y-1" style={{ borderTop: "1px solid #e5eaf2" }}>
          {sidebarOpen && (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
              style={{ background: "#f8fafc" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
              >
                {initials}
              </div>
              <div className="overflow-hidden">
                <button
                  onClick={() => navigate("/change-password")}
                  className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors truncate block max-w-[130px]"
                  title={displayName}
                >
                  {displayName}
                </button>
                <p className="text-[11px] text-slate-400 capitalize">{normalizedRole}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-slate-400 hover:text-red-500 hover:bg-red-50 group",
              !sidebarOpen && "justify-center relative"
            )}
          >
            <LogOut style={{ width: 17, height: 17, flexShrink: 0 }} />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
            {!sidebarOpen && (
              <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header
          className="flex items-center justify-between px-6 sticky top-0 z-20 min-h-[68px]"
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e5eaf2",
            boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft style={{ width: 18, height: 18 }} />
            ) : (
              <Menu style={{ width: 18, height: 18 }} />
            )}
          </button>

          <div className="flex items-center gap-3">
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: "#eff6ff", color: "#3b82f6" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: "#3b82f6", boxShadow: "0 0 0 3px rgba(59,130,246,0.2)" }}
              />
              {navigation.find((n) => isActive(n.href))?.name || "Home"}
            </span>

            <div className="w-px h-6 bg-slate-200 hidden sm:block" />

            <button
              onClick={() => navigate("/change-password")}
              className="flex items-center gap-2.5 group"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
              >
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors leading-tight">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-400 capitalize">{normalizedRole}</p>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
