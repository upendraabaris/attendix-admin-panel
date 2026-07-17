// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import Layout from "../components/Layout";
// import api from "../hooks/useApi";
// import { Card, CardContent } from "../components/ui/card";
// import { Badge } from "../components/ui/badge";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../components/ui/select";
// import { Button } from "../components/ui/button";
// import {
//   CheckCircle,
//   XCircle,
//   Hourglass,
//   ClipboardList,
//   CalendarRange,
//   ArrowRight,
//   ArrowLeft,
//   User,
// } from "lucide-react";

// const HIDDEN_BALANCE_TYPES = ["unpaid", "other"];
// const LEAVE_TYPE_ORDER = [
//   "sick",
//   "personal",
//   "earned",
//   "casual",
//   "compensation",
//   "paternity",
//   "vacation",
// ];

// const formatDate = (dateStr) =>
//   dateStr
//     ? new Date(dateStr).toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       })
//     : "—";

// const countDays = (start, end) => {
//   if (!start || !end) return 0;
//   const diff =
//     Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
//   return diff > 0 ? diff : 1;
// };

// const isHalfDayLeave = (leave) => {
//   if (!leave) return false;

//   if (
//     leave.is_half_day === true ||
//     leave.is_half_day === "true" ||
//     leave.is_half_day === "t" ||
//     leave.is_half_day === 1 ||
//     leave.is_half_day === "1"
//   ) {
//     return true;
//   }

//   const durationCandidates = [
//     leave.requested_days,
//     leave.leave_days,
//     leave.total_days,
//     leave.duration,
//     leave.days,
//   ];

//   return durationCandidates.some((value) => Number(value) === 0.5);
// };

// const getLeaveDuration = (leave) =>
//   isHalfDayLeave(leave) ? 0.5 : countDays(leave.start_date, leave.end_date);

// const formatLeaveValue = (value) => {
//   const numericValue = Number(value || 0);

//   return Number.isInteger(numericValue)
//     ? String(numericValue)
//     : numericValue.toFixed(1);
// };

// const formatLeaveTypeLabel = (value) =>
//   String(value || "")
//     .split("_")
//     .join(" ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());

// const getLeaveTypeRank = (leaveType) => {
//   const index = LEAVE_TYPE_ORDER.indexOf(leaveType);
//   return index === -1 ? LEAVE_TYPE_ORDER.length : index;
// };

// const STATUS_CONFIG = {
//   approved: {
//     border: "border-l-green-500",
//     badge: "bg-green-100 text-green-800 border-green-200",
//     icon: <CheckCircle className="w-3.5 h-3.5" />,
//     label: "Approved",
//   },
//   rejected: {
//     border: "border-l-red-400",
//     badge: "bg-red-100 text-red-800 border-red-200",
//     icon: <XCircle className="w-3.5 h-3.5" />,
//     label: "Rejected",
//   },
//   pending: {
//     border: "border-l-yellow-400",
//     badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
//     icon: <Hourglass className="w-3.5 h-3.5" />,
//     label: "Pending",
//   },
// };
// const HIDDEN_LEAVE_TYPES = ["other"];

// function Empleave() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [leaves, setLeaves] = useState([]);
//   const [leaveBalances, setLeaveBalances] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [employeeName, setEmployeeName] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");

//   const fetchLeaves = async () => {
//     setLoading(true);
//     try {
//       const requests = [api.get(`/leave/get`), api.get("/leave/balance-report")];
//       requests.push(api.get(`/comp-off/balance/${id}`));

//       const [leaveRes, balanceReportRes, compOffRes] = await Promise.all(requests);
//       const empLeaves = (leaveRes?.data?.data || []).filter(
//         (leave) => String(leave.employee_id) === String(id),
//       );
//       setLeaves(empLeaves);
//       if (empLeaves.length > 0) {
//         setEmployeeName(empLeaves[0].employee_name);
//       }

//       const reportRow = (balanceReportRes?.data?.data || []).find(
//         (row) => String(row.employee_id) === String(id),
//       );
//       if (!empLeaves.length && reportRow?.employee_name) {
//         setEmployeeName(reportRow.employee_name);
//       }
//       const balancesByType = reportRow?.balances_by_type || {};
//       const baseBalances = Object.entries(balancesByType)
//         .filter(([leaveType]) => !HIDDEN_BALANCE_TYPES.includes(leaveType))
//         .map(([leaveType, balance]) => ({
//           leave_type: leaveType,
//           ...balance,
//         }));

//       const compOffBalance = compOffRes?.data?.data;
//       const mergedBalances = [...baseBalances];

//       if (compOffBalance) {
//         const compensationBalance = {
//           leave_type: "compensation",
//           balance: Number(compOffBalance.available_balance || 0),
//           used_days: Number(compOffBalance.used_count || 0),
//           pending_days: Number(compOffBalance.pending_days || 0),
//         };

//         const existingIndex = mergedBalances.findIndex(
//           (item) => item.leave_type === "compensation",
//         );

//         if (existingIndex >= 0) {
//           mergedBalances[existingIndex] = compensationBalance;
//         } else {
//           mergedBalances.push(compensationBalance);
//         }
//       }

//       setLeaveBalances(
//         mergedBalances.sort(
//           (a, b) => getLeaveTypeRank(a.leave_type) - getLeaveTypeRank(b.leave_type),
//         ),
//       );
//     } catch (err) {
//       console.error("Error fetching leaves", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLeaves();
//   }, [id]);

//   const filteredLeaves =
//     statusFilter === "all"
//       ? leaves.filter((leave) => !HIDDEN_LEAVE_TYPES.includes(leave.type))
//       : leaves.filter(
//           (l) =>
//             l.status === statusFilter && !HIDDEN_LEAVE_TYPES.includes(l.type),
//         );

//   const counts = {
//     all: leaves.filter((leave) => !HIDDEN_LEAVE_TYPES.includes(leave.type)).length,
//     pending: leaves.filter((l) => l.status === "pending" && !HIDDEN_LEAVE_TYPES.includes(l.type)).length,
//     approved: leaves.filter((l) => l.status === "approved" && !HIDDEN_LEAVE_TYPES.includes(l.type)).length,
//     rejected: leaves.filter((l) => l.status === "rejected" && !HIDDEN_LEAVE_TYPES.includes(l.type)).length,
//   };

//   return (
//     <Layout>
//       <div className="space-y-6">
//         {/* Header */}
//         <div className="flex items-start justify-between">
//           <div>
//             <div className="flex items-center gap-2 mb-1">
//               <button
//                 onClick={() => navigate(-1)}
//                 className="text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <ArrowLeft className="w-4 h-4" />
//               </button>
//               <span className="text-sm text-gray-400">Employee Management</span>
//             </div>
//             <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
//               <CalendarRange className="w-7 h-7 text-indigo-600" />
//               Leave History
//             </h1>
//             <p className="text-gray-500 mt-1 text-sm flex items-center gap-1.5">
//               <User className="w-3.5 h-3.5" />
//               {employeeName || "Employee"}
//             </p>
//           </div>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//           {[
//             {
//               key: "all",
//               label: "Total Leaves",
//               color: "bg-indigo-50",
//               iconColor: "text-indigo-600",
//               icon: <ClipboardList className="w-5 h-5" />,
//             },
//             {
//               key: "pending",
//               label: "Pending",
//               color: "bg-yellow-50",
//               iconColor: "text-yellow-600",
//               icon: <Hourglass className="w-5 h-5" />,
//             },
//             {
//               key: "approved",
//               label: "Approved",
//               color: "bg-green-50",
//               iconColor: "text-green-600",
//               icon: <CheckCircle className="w-5 h-5" />,
//             },
//             {
//               key: "rejected",
//               label: "Rejected",
//               color: "bg-red-50",
//               iconColor: "text-red-500",
//               icon: <XCircle className="w-5 h-5" />,
//             },
//           ].map(({ key, label, color, iconColor, icon }) => (
//             <button
//               key={key}
//               onClick={() => setStatusFilter(key)}
//               className={`bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4 text-left transition-all ${
//                 statusFilter === key
//                   ? "border-indigo-300 ring-2 ring-indigo-100"
//                   : "border-gray-200 hover:border-gray-300"
//               }`}
//             >
//               <div className={`p-2.5 rounded-lg ${color} ${iconColor}`}>
//                 {icon}
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {counts[key]}
//                 </p>
//                 <p className="text-xs text-gray-500 mt-0.5">{label}</p>
//               </div>
//             </button>
//           ))}
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
//           {leaveBalances.length === 0 ? (
//             <Card className="border-gray-200 shadow-sm sm:col-span-2 xl:col-span-4">
//               <CardContent className="p-5 text-sm text-gray-500">
//                 No leave balances available for this employee.
//               </CardContent>
//             </Card>
//           ) : (
//             leaveBalances.map((item) => (
//               <Card
//                 key={`${item.leave_type}-${item.id || "balance"}`}
//                 className="border-gray-200 shadow-sm"
//               >
//                 <CardContent className="p-5">
//                   <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
//                     {formatLeaveTypeLabel(item.leave_type)}
//                   </p>
//                   <p className="text-2xl font-bold text-gray-900 mt-2">
//                     {formatLeaveValue(item.balance)}
//                   </p>
//                   <p className="text-xs text-gray-500 mt-1">Available balance</p>
//                   <p className="text-xs text-gray-400 mt-2">
//                     Used: {formatLeaveValue(item.used_days)}
//                   </p>
//                   {Number(item.pending_days || 0) > 0 && (
//                     <p className="text-xs text-amber-600 mt-1">
//                       Pending: {formatLeaveValue(item.pending_days)}
//                     </p>
//                   )}
//                 </CardContent>
//               </Card>
//             ))
//           )}
//         </div>

//         {/* Filter Bar */}
//         <Card className="border-gray-200 shadow-sm">
//           <CardContent className="p-4">
//             <div className="flex items-center justify-between gap-3">
//               <p className="text-sm text-gray-500">
//                 Showing{" "}
//                 <span className="font-semibold text-gray-700">
//                   {filteredLeaves.length}
//                 </span>{" "}
//                 {statusFilter === "all" ? "total" : statusFilter} leave
//                 {filteredLeaves.length !== 1 ? "s" : ""}
//               </p>
//               <Select value={statusFilter} onValueChange={setStatusFilter}>
//                 <SelectTrigger className="w-44 h-9 text-sm">
//                   <SelectValue placeholder="Filter by status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Status</SelectItem>
//                   <SelectItem value="pending">Pending</SelectItem>
//                   <SelectItem value="approved">Approved</SelectItem>
//                   <SelectItem value="rejected">Rejected</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Leave Cards */}
//         {loading ? (
//           <div className="flex flex-col items-center justify-center py-16 text-gray-400">
//             <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
//             <p className="text-sm">Loading leave history...</p>
//           </div>
//         ) : filteredLeaves.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
//             <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
//             <p className="text-sm font-medium">No leave records found</p>
//             <p className="text-xs mt-1">Try adjusting your status filter.</p>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             {filteredLeaves.map((leave) => {
//               const cfg = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
//               const halfDay = isHalfDayLeave(leave);
//               return (
//                 <div
//                   key={leave.id}
//                   className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} shadow-sm overflow-hidden`}
//                 >
//                   <div className="p-5">
//                     {/* Top row: leave type + status badge */}
//                     <div className="flex items-center justify-between gap-4">
//                       <div>
//                         <div className="flex items-center gap-2 flex-wrap">
//                           <p className="font-semibold text-gray-900 text-sm">
//                             {leave.type
//                               ? leave.type.charAt(0).toUpperCase() +
//                                 leave.type.slice(1)
//                               : "Leave"}{" "}
//                             Leave
//                           </p>
//                           {halfDay && (
//                             <Badge className="border border-amber-200 bg-amber-50 text-amber-800">
//                               Half Day
//                             </Badge>
//                           )}
//                         </div>
//                         <p className="text-xs text-gray-500 mt-0.5">
//                           Applied {formatDate(leave.created_at)}
//                         </p>
//                       </div>
//                       <Badge
//                         className={`inline-flex items-center gap-1 border text-xs font-medium ${cfg.badge}`}
//                       >
//                         {cfg.icon}
//                         {cfg.label}
//                       </Badge>
//                     </div>

//                     {/* Date range + days */}
//                     <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
//                       <div className="flex items-center gap-1.5 text-sm text-gray-700">
//                         <CalendarRange className="w-4 h-4 text-gray-400 shrink-0" />
//                         <span className="font-medium">
//                           {formatDate(leave.start_date)}
//                         </span>
//                         <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
//                         <span className="font-medium">
//                           {formatDate(leave.end_date)}
//                         </span>
//                       </div>
//                       <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
//                         {getLeaveDuration(leave)}{" "}
//                         {halfDay
//                           ? "day"
//                           : countDays(leave.start_date, leave.end_date) !== 1
//                             ? "days"
//                             : "day"}
//                       </span>
//                     </div>

//                     {/* Reason */}
//                     {leave.reason && (
//                       <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-3.5 py-2.5">
//                         <p className="text-xs font-medium text-gray-500 mb-0.5">
//                           Reason
//                         </p>
//                         <p className="text-sm text-gray-700">{leave.reason}</p>
//                       </div>
//                     )}

//                     {/* Admin comment */}
//                     {leave.adminComment && (
//                       <div className="mt-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3.5 py-2.5">
//                         <p className="text-xs font-medium text-indigo-500 mb-0.5">
//                           Admin Note
//                         </p>
//                         <p className="text-sm text-indigo-800">
//                           {leave.adminComment}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </Layout>
//   );
// }

// export default Empleave;

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../hooks/useApi";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import {
  CheckCircle,
  XCircle,
  Hourglass,
  ClipboardList,
  CalendarRange,
  ArrowRight,
  ArrowLeft,
  User,
  Wallet,
  History,
  AlertTriangle,
} from "lucide-react";

const HIDDEN_BALANCE_TYPES = ["unpaid", "other"];
const LEAVE_TYPE_ORDER = [
  "sick",
  "personal",
  "earned",
  "casual",
  "compensation",
  "paternity",
  "vacation",
];

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const countDays = (start, end) => {
  if (!start || !end) return 0;
  const diff =
    Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
};

const isHalfDayLeave = (leave) => {
  if (!leave) return false;

  if (
    leave.is_half_day === true ||
    leave.is_half_day === "true" ||
    leave.is_half_day === "t" ||
    leave.is_half_day === 1 ||
    leave.is_half_day === "1"
  ) {
    return true;
  }

  const durationCandidates = [
    leave.requested_days,
    leave.leave_days,
    leave.total_days,
    leave.duration,
    leave.days,
  ];

  return durationCandidates.some((value) => Number(value) === 0.5);
};

const getLeaveDuration = (leave) =>
  isHalfDayLeave(leave) ? 0.5 : countDays(leave.start_date, leave.end_date);

const formatLeaveValue = (value) => {
  const numericValue = Number(value || 0);

  return Number.isInteger(numericValue)
    ? String(numericValue)
    : numericValue.toFixed(1);
};

const formatLeaveTypeLabel = (value) =>
  String(value || "")
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getLeaveTypeRank = (leaveType) => {
  const index = LEAVE_TYPE_ORDER.indexOf(leaveType);
  return index === -1 ? LEAVE_TYPE_ORDER.length : index;
};

const STATUS_CONFIG = {
  approved: {
    border: "border-l-green-500",
    badge: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: "Approved",
  },
  rejected: {
    border: "border-l-red-400",
    badge: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: "Rejected",
  },
  pending: {
    border: "border-l-yellow-400",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <Hourglass className="w-3.5 h-3.5" />,
    label: "Pending",
  },
};
const HIDDEN_LEAVE_TYPES = ["other"];

function Empleave() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const requests = [api.get(`/leave/get`), api.get("/leave/balance-report")];
      requests.push(api.get(`/comp-off/balance/${id}`));

      const [leaveRes, balanceReportRes, compOffRes] = await Promise.all(requests);
      const empLeaves = (leaveRes?.data?.data || []).filter(
        (leave) => String(leave.employee_id) === String(id),
      );
      setLeaves(empLeaves);
      if (empLeaves.length > 0) {
        setEmployeeName(empLeaves[0].employee_name);
      }

      const reportRow = (balanceReportRes?.data?.data || []).find(
        (row) => String(row.employee_id) === String(id),
      );
      if (!empLeaves.length && reportRow?.employee_name) {
        setEmployeeName(reportRow.employee_name);
      }
      const balancesByType = reportRow?.balances_by_type || {};
      const baseBalances = Object.entries(balancesByType)
        .filter(([leaveType]) => !HIDDEN_BALANCE_TYPES.includes(leaveType))
        .map(([leaveType, balance]) => ({
          leave_type: leaveType,
          balance: balance.balance || 0,
        }));

      const compOffBalance = compOffRes?.data?.data;
      const mergedBalances = [...baseBalances];

      if (compOffBalance) {
        const compensationBalance = {
          leave_type: "compensation",
          balance: Number(compOffBalance.available_balance || 0),
        };

        const existingIndex = mergedBalances.findIndex(
          (item) => item.leave_type === "compensation",
        );

        if (existingIndex >= 0) {
          mergedBalances[existingIndex] = compensationBalance;
        } else {
          mergedBalances.push(compensationBalance);
        }
      }

      setLeaveBalances(
        mergedBalances.sort(
          (a, b) => getLeaveTypeRank(a.leave_type) - getLeaveTypeRank(b.leave_type),
        ),
      );

      // Fetch expired leave history for this employee (admin API)
      try {
        const historyRes = await api.get("/leave/balance-history");
        const allHistory = historyRes?.data?.data || [];
        const empHistory = allHistory.filter(
          (h) => String(h.employee_id) === String(id),
        );
        // Sort by leave_type then cycle_start descending
        empHistory.sort((a, b) => {
          if (a.leave_type !== b.leave_type)
            return a.leave_type.localeCompare(b.leave_type);
          return new Date(b.cycle_start) - new Date(a.cycle_start);
        });
        setLeaveHistory(empHistory);
      } catch (histErr) {
        console.warn("Could not fetch leave expiry history:", histErr.message);
      }
    } catch (err) {
      console.error("Error fetching leaves", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [id]);

  const filteredLeaves =
    statusFilter === "all"
      ? leaves.filter((leave) => !HIDDEN_LEAVE_TYPES.includes(leave.type))
      : leaves.filter(
          (l) =>
            l.status === statusFilter && !HIDDEN_LEAVE_TYPES.includes(l.type),
        );

  const counts = {
    all: leaves.filter((leave) => !HIDDEN_LEAVE_TYPES.includes(leave.type)).length,
    pending: leaves.filter((l) => l.status === "pending" && !HIDDEN_LEAVE_TYPES.includes(l.type)).length,
    approved: leaves.filter((l) => l.status === "approved" && !HIDDEN_LEAVE_TYPES.includes(l.type)).length,
    rejected: leaves.filter((l) => l.status === "rejected" && !HIDDEN_LEAVE_TYPES.includes(l.type)).length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400">Employee Management</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarRange className="w-7 h-7 text-indigo-600" />
              Leave History
            </h1>
            <p className="text-gray-500 mt-1 text-sm flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {employeeName || "Employee"}
            </p>
          </div>
        </div>

        {/* Leave Balance Section - Moved to Top */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Leave Balance Overview</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {leaveBalances.length === 0 ? (
              <Card className="border-gray-200 shadow-sm col-span-full">
                <CardContent className="p-5 text-sm text-gray-500 text-center">
                  No leave balances available for this employee.
                </CardContent>
              </Card>
            ) : (
              leaveBalances.map((item) => (
                <Card
                  key={`${item.leave_type}-${item.id || "balance"}`}
                  className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-white to-gray-50"
                >
                  <CardContent className="p-4 text-center">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                      {formatLeaveTypeLabel(item.leave_type)}
                    </p>
                    <p className="text-3xl font-bold text-indigo-600 my-2">
                      {formatLeaveValue(item.balance)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Available Balance</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* ── Expired Leave History Section ─────────────────────────────────── */}
        {/* {leaveHistory.length > 0 && ( */}
        {false && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Previous Years — Expired Leave
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-5 gap-2 px-5 py-3 bg-rose-50 border-b border-rose-100 text-xs font-semibold uppercase tracking-wider text-rose-600">
                <span>Leave Type</span>
                <span>Cycle</span>
                <span className="text-right">Earned</span>
                <span className="text-right">Used</span>
                <span className="text-right">Expired</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {leaveHistory.map((h, idx) => {
                  const cycleLabel = `${new Date(h.cycle_start).getFullYear()}`;
                  const expiredDays = Number(h.expired_days || 0);
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-5 gap-2 px-5 py-3.5 items-center hover:bg-rose-50/40 transition-colors"
                    >
                      {/* Leave Type */}
                      <span className="inline-flex items-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {formatLeaveTypeLabel(h.leave_type)}
                        </span>
                      </span>

                      {/* Cycle year */}
                      <span className="text-sm text-gray-500">{cycleLabel}</span>

                      {/* Earned */}
                      <span className="text-sm font-medium text-gray-700 text-right">
                        {formatLeaveValue(h.earned_days)}
                      </span>

                      {/* Used */}
                      <span className="text-sm text-gray-600 text-right">
                        {formatLeaveValue(h.used_days)}
                      </span>

                      {/* Expired */}
                      <span className="text-right">
                        {expiredDays > 0 ? (
                          <span className="inline-flex items-center justify-end gap-1 font-semibold text-rose-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {formatLeaveValue(expiredDays)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Footer note */}
              <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                Expired days are unused leaves that lapsed at the end of each cycle and cannot be used.
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              key: "all",
              label: "Total Leaves",
              color: "bg-indigo-50",
              iconColor: "text-indigo-600",
              icon: <ClipboardList className="w-5 h-5" />,
            },
            {
              key: "pending",
              label: "Pending",
              color: "bg-yellow-50",
              iconColor: "text-yellow-600",
              icon: <Hourglass className="w-5 h-5" />,
            },
            {
              key: "approved",
              label: "Approved",
              color: "bg-green-50",
              iconColor: "text-green-600",
              icon: <CheckCircle className="w-5 h-5" />,
            },
            {
              key: "rejected",
              label: "Rejected",
              color: "bg-red-50",
              iconColor: "text-red-500",
              icon: <XCircle className="w-5 h-5" />,
            },
          ].map(({ key, label, color, iconColor, icon }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4 text-left transition-all ${
                statusFilter === key
                  ? "border-indigo-300 ring-2 ring-indigo-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`p-2.5 rounded-lg ${color} ${iconColor}`}>
                {icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {counts[key]}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {filteredLeaves.length}
                </span>{" "}
                {statusFilter === "all" ? "total" : statusFilter} leave
                {filteredLeaves.length !== 1 ? "s" : ""}
              </p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44 h-9 text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leave Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading leave history...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
            <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No leave records found</p>
            <p className="text-xs mt-1">Try adjusting your status filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeaves.map((leave) => {
              const cfg = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
              const halfDay = isHalfDayLeave(leave);
              return (
                <div
                  key={leave.id}
                  className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} shadow-sm overflow-hidden`}
                >
                  <div className="p-5">
                    {/* Top row: leave type + status badge */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">
                            {leave.type
                              ? leave.type.charAt(0).toUpperCase() +
                                leave.type.slice(1)
                              : "Leave"}{" "}
                            Leave
                          </p>
                          {halfDay && (
                            <Badge className="border border-amber-200 bg-amber-50 text-amber-800">
                              Half Day
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Applied {formatDate(leave.created_at)}
                        </p>
                      </div>
                      <Badge
                        className={`inline-flex items-center gap-1 border text-xs font-medium ${cfg.badge}`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </div>

                    {/* Date range + days */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <CalendarRange className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-medium">
                          {formatDate(leave.start_date)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">
                          {formatDate(leave.end_date)}
                        </span>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {getLeaveDuration(leave)}{" "}
                        {halfDay
                          ? "day"
                          : countDays(leave.start_date, leave.end_date) !== 1
                            ? "days"
                            : "day"}
                      </span>
                    </div>

                    {/* Reason */}
                    {leave.reason && (
                      <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-3.5 py-2.5">
                        <p className="text-xs font-medium text-gray-500 mb-0.5">
                          Reason
                        </p>
                        <p className="text-sm text-gray-700">{leave.reason}</p>
                      </div>
                    )}

                    {/* Admin comment */}
                    {leave.adminComment && (
                      <div className="mt-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3.5 py-2.5">
                        <p className="text-xs font-medium text-indigo-500 mb-0.5">
                          Admin Note
                        </p>
                        <p className="text-sm text-indigo-800">
                          {leave.adminComment}
                        </p>
                      </div>
                    )}
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

export default Empleave;