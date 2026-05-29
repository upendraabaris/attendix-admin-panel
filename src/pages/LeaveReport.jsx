// import { useEffect, useMemo, useState } from "react";
// import { toast } from "sonner";
// import { FileBarChart, Search } from "lucide-react";

// import Layout from "../components/Layout";
// import api from "../hooks/useApi";
// import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
// import { Input } from "../components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../components/ui/table";

// const HIDDEN_TYPES = ["vacation", "other","unpaid",];
// const LEAVE_TYPE_ORDER = [
//   "sick",
//   "personal",
//   "earned",
//   "casual",
//   "compensation",
//   "paternity",
// ];

// const formatLeaveTypeLabel = (value) =>
//   String(value || "")
//     .split("_")
//     .join(" ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());

// const formatLeaveValue = (value) => {
//   const numericValue = Number(value || 0);
//   return Number.isInteger(numericValue)
//     ? String(numericValue)
//     : numericValue.toFixed(1);
// };

// const getLeaveTypeRank = (leaveType) => {
//   const index = LEAVE_TYPE_ORDER.indexOf(leaveType);
//   return index === -1 ? LEAVE_TYPE_ORDER.length : index;
// };

// const getVisibleLeaveTypes = (policies = [], reportRows = []) => {
//   const enabledPolicyTypes = policies
//     .filter((policy) => policy.leave_type && policy.is_enabled)
//     .map((policy) => policy.leave_type);

//   const reportTypes = reportRows.flatMap((row) =>
//     Object.keys(row.balances_by_type || {})
//   );

//   return [...new Set([...enabledPolicyTypes, ...reportTypes])]
//     .filter((type) => !HIDDEN_TYPES.includes(type))
//     .sort((a, b) => getLeaveTypeRank(a) - getLeaveTypeRank(b));
// };

// const LeaveReport = () => {
//   const role = String(localStorage.getItem("role") || "").toLowerCase();
//   const isAdmin = role.includes("admin");
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [policies, setPolicies] = useState([]);
//   const [adminRows, setAdminRows] = useState([]);
//   const [employeeBalances, setEmployeeBalances] = useState([]);

//   useEffect(() => {
//     const fetchReport = async () => {
//       try {
//         setLoading(true);

//         const policyPromise = api.get("/admin/leave-policy");

//         if (isAdmin) {
//           const [policyRes, reportRes] = await Promise.all([
//             policyPromise,
//             api.get("/leave/balance-report"),
//           ]);

//           setPolicies(policyRes?.data?.data || []);
//           setAdminRows(reportRes?.data?.data || []);
//         } else {
//           const employeeId = localStorage.getItem("employee_id");
//           const requests = [policyPromise, api.get("/leave/my-balances")];

//           if (employeeId) {
//             requests.push(api.get(`/comp-off/balance/${employeeId}`));
//           }

//           const [policyRes, balancesRes, compOffRes] = await Promise.all(requests);
//           const nextPolicies = policyRes?.data?.data || [];
//           const baseBalances = balancesRes?.data?.data || [];
//           const mergedBalances = [...baseBalances];
//           const compOffBalance = compOffRes?.data?.data;

//           if (compOffBalance) {
//             const compensationBalance = {
//               id: `comp-${compOffBalance.employee_id || employeeId || "self"}`,
//               leave_type: "compensation",
//               balance: Number(compOffBalance.available_balance || 0),
//               accrued_balance: Number(compOffBalance.available_balance || 0),
//               used_days: Number(compOffBalance.used_count || 0),
//               pending_days: Number(compOffBalance.pending_days || 0),
//             };

//             const existingIndex = mergedBalances.findIndex(
//               (item) => item.leave_type === "compensation"
//             );

//             if (existingIndex >= 0) {
//               mergedBalances[existingIndex] = compensationBalance;
//             } else {
//               mergedBalances.push(compensationBalance);
//             }
//           }

//           setPolicies(nextPolicies);
//           setEmployeeBalances(mergedBalances);
//         }
//       } catch (error) {
//         toast.error(error?.response?.data?.message || "Failed to load leave report");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [isAdmin]);

//   const leaveTypes = useMemo(
//     () =>
//       isAdmin
//         ? getVisibleLeaveTypes(policies, adminRows)
//         : getVisibleLeaveTypes(
//             policies,
//             [{ balances_by_type: Object.fromEntries(employeeBalances.map((item) => [item.leave_type, item])) }]
//           ),
//     [adminRows, employeeBalances, isAdmin, policies]
//   );

//   const filteredAdminRows = useMemo(() => {
//     const term = searchTerm.trim().toLowerCase();
//     if (!term) {
//       return adminRows;
//     }

//     return adminRows.filter((row) => {
//       return (
//         String(row.employee_name || "").toLowerCase().includes(term) ||
//         String(row.email || "").toLowerCase().includes(term) ||
//         String(row.role || "").toLowerCase().includes(term)
//       );
//     });
//   }, [adminRows, searchTerm]);

//   const employeeBalanceMap = useMemo(
//     () =>
//       employeeBalances.reduce((acc, item) => {
//         acc[item.leave_type] = item;
//         return acc;
//       }, {}),
//     [employeeBalances]
//   );

//   return (
//     <Layout>
//       <div className="space-y-6">
//         <div className="flex items-start justify-between gap-4">
//           <div>
//             <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
//               <FileBarChart className="h-7 w-7 text-indigo-600" />
//               Leave Report
//             </h1>
//             <p className="mt-1 text-sm text-gray-500">
//               {isAdmin
//                 ? "Review every employee's due leave balance across all leave types."
//                 : "Review your current leave balances including sick and personal leave."}
//             </p>
//           </div>
//         </div>

//         {isAdmin ? (
//           <>
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//               <Card className="border-gray-200 shadow-sm">
//                 <CardContent className="p-5">
//                   <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
//                     Employees
//                   </p>
//                   <p className="mt-2 text-3xl font-bold text-gray-900">
//                     {filteredAdminRows.length}
//                   </p>
//                 </CardContent>
//               </Card>
//               <Card className="border-gray-200 shadow-sm">
//                 <CardContent className="p-5">
//                   <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
//                     Leave Types
//                   </p>
//                   <p className="mt-2 text-3xl font-bold text-gray-900">
//                     {leaveTypes.length}
//                   </p>
//                 </CardContent>
//               </Card>
//               <Card className="border-gray-200 shadow-sm">
//                 <CardContent className="p-5">
//                   <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
//                     Report Scope
//                   </p>
//                   <p className="mt-2 text-lg font-semibold text-gray-900">
//                     Active employees
//                   </p>
//                 </CardContent>
//               </Card>
//             </div>

//             <Card className="border-gray-200 shadow-sm">
//               <CardContent className="p-4">
//                 <div className="relative max-w-md">
//                   <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
//                   <Input
//                     value={searchTerm}
//                     onChange={(event) => setSearchTerm(event.target.value)}
//                     placeholder="Search by employee, email or role..."
//                     className="pl-9"
//                   />
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="border-gray-200 shadow-sm">
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-base font-semibold text-gray-800">
//                   Employee Leave Balance Matrix
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {loading ? (
//                   <p className="text-sm text-gray-500">Loading leave report...</p>
//                 ) : filteredAdminRows.length === 0 ? (
//                   <p className="text-sm text-gray-500">No employees matched your search.</p>
//                 ) : (
//                   <div className="overflow-x-auto rounded-lg border border-gray-200">
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           <TableHead className="min-w-[220px]">Employee</TableHead>
//                           {leaveTypes.map((type) => (
//                             <TableHead key={type} className="min-w-[120px]">
//                               {formatLeaveTypeLabel(type)}
//                             </TableHead>
//                           ))}
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {filteredAdminRows.map((row) => (
//                           <TableRow key={row.employee_id}>
//                             <TableCell>
//                               <div>
//                                 <p className="font-medium text-gray-900">{row.employee_name}</p>
//                                 <p className="text-xs capitalize text-gray-500">
//                                   {row.role} {row.email ? `• ${row.email}` : ""}
//                                 </p>
//                               </div>
//                             </TableCell>
//                             {leaveTypes.map((type) => {
//                               const balance = row.balances_by_type?.[type];
//                               return (
//                                 <TableCell key={`${row.employee_id}-${type}`}>
//                                   <div className="space-y-1">
//                                     <p className="font-semibold text-indigo-700">
//                                       {formatLeaveValue(balance?.balance || 0)}
//                                     </p>
//                                     {/* <p className="text-[11px] text-gray-500">
//                                       Used: {formatLeaveValue(balance?.used_days || 0)}
//                                     </p>
//                                     <p className="text-[11px] text-amber-700">
//                                       Pending: {formatLeaveValue(balance?.pending_days || 0)}
//                                     </p> */}
//                                   </div>
//                                 </TableCell>
//                               );
//                             })}
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </>
//         ) : (
//           <Card className="border-gray-200 shadow-sm">
//             <CardHeader className="pb-3">
//               <CardTitle className="text-base font-semibold text-gray-800">
//                 My Leave Balances
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {loading ? (
//                 <p className="text-sm text-gray-500">Loading leave report...</p>
//               ) : leaveTypes.length === 0 ? (
//                 <p className="text-sm text-gray-500">No leave balances available yet.</p>
//               ) : (
//                 <div className="overflow-x-auto rounded-lg border border-gray-200">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Leave Type</TableHead>
//                         <TableHead>Available</TableHead>
//                         <TableHead>Used</TableHead>
//                         <TableHead>Pending</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {leaveTypes.map((type) => {
//                         const balance = employeeBalanceMap[type];
//                         return (
//                           <TableRow key={type}>
//                             <TableCell className="font-medium text-gray-900">
//                               {formatLeaveTypeLabel(type)}
//                             </TableCell>
//                             <TableCell className="font-semibold text-indigo-700">
//                               {formatLeaveValue(balance?.balance || 0)}
//                             </TableCell>
//                             <TableCell>{formatLeaveValue(balance?.used_days || 0)}</TableCell>
//                             <TableCell>
//                               <span className="text-amber-700">
//                                 {formatLeaveValue(balance?.pending_days || 0)}
//                               </span>
//                             </TableCell>
//                           </TableRow>
//                         );
//                       })}
//                     </TableBody>
//                   </Table>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </Layout>
//   );
// };

// export default LeaveReport;
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileBarChart, Search, Users, LayoutList } from "lucide-react";

import Layout from "../components/Layout";
import api from "../hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const HIDDEN_TYPES = ["vacation", "other", "unpaid"];
const LEAVE_TYPE_ORDER = [
  "sick",
  "personal",
  "earned",
  "casual",
  "compensation",
  "paternity",
];

const formatLeaveTypeLabel = (value) =>
  String(value || "")
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatLeaveValue = (value) => {
  const numericValue = Number(value || 0);
  return Number.isInteger(numericValue)
    ? String(numericValue)
    : numericValue.toFixed(1);
};

const getLeaveTypeRank = (leaveType) => {
  const index = LEAVE_TYPE_ORDER.indexOf(leaveType);
  return index === -1 ? LEAVE_TYPE_ORDER.length : index;
};

const getVisibleLeaveTypes = (policies = [], reportRows = []) => {
  const enabledPolicyTypes = policies
    .filter((p) => p.leave_type && p.is_enabled)
    .map((p) => p.leave_type);

  const reportTypes = reportRows.flatMap((row) =>
    Object.keys(row.balances_by_type || {})
  );

  return [...new Set([...enabledPolicyTypes, ...reportTypes])]
    .filter((type) => !HIDDEN_TYPES.includes(type))
    .sort((a, b) => getLeaveTypeRank(a) - getLeaveTypeRank(b));
};

// Avatar initials helper
const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || "")
    .join("");

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];
const getAvatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ── Badge for balance value ──────────────────────────────────────────────────
const BalanceBadge = ({ value }) => {
  const num = Number(value || 0);
  let cls = "inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-sm font-semibold ";
  if (num === 0) cls += "bg-gray-100 text-gray-400";
  else if (num <= 3) cls += "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  else cls += "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";
  return <span className={cls}>{formatLeaveValue(num)}</span>;
};

// ── ADMIN VIEW ───────────────────────────────────────────────────────────────
const AdminView = ({ policies, adminRows, loading }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const leaveTypes = useMemo(
    () => getVisibleLeaveTypes(policies, adminRows),
    [policies, adminRows]
  );

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return adminRows;
    return adminRows.filter(
      (row) =>
        String(row.employee_name || "").toLowerCase().includes(term) ||
        String(row.email || "").toLowerCase().includes(term) ||
        String(row.role || "").toLowerCase().includes(term)
    );
  }, [adminRows, searchTerm]);

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <LayoutList className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Leave Types</p>
              <p className="text-2xl font-bold text-gray-900">{leaveTypes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 border-gray-200 shadow-sm sm:col-span-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <FileBarChart className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Report Scope</p>
              <p className="text-base font-semibold text-gray-900">Active Employees</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search employee, email or role…"
          className="pl-9 text-sm"
        />
      </div>

      {/* Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 pb-3 pt-4">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Employee Leave Balance Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading leave report…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No employees matched your search.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="min-w-[220px] py-3 pl-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Employee
                    </TableHead>
                    {leaveTypes.map((type) => (
                      <TableHead
                        key={type}
                        className="min-w-[110px] py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {formatLeaveTypeLabel(type)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row, idx) => (
                    <TableRow
                      key={row.employee_id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                    >
                      <TableCell className="py-3 pl-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getAvatarColor(
                              row.employee_name
                            )}`}
                          >
                            {getInitials(row.employee_name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {row.employee_name}
                            </p>
                            <p className="text-xs capitalize text-gray-400">
                              {row.role}
                              {row.email ? ` · ${row.email}` : ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      {leaveTypes.map((type) => {
                        const bal = row.balances_by_type?.[type];
                        return (
                          <TableCell
                            key={`${row.employee_id}-${type}`}
                            className="py-3 text-center"
                          >
                            <BalanceBadge value={bal?.balance || 0} />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ── EMPLOYEE VIEW ────────────────────────────────────────────────────────────
const EmployeeView = ({ policies, employeeBalances, loading }) => {
  const leaveTypes = useMemo(
    () =>
      getVisibleLeaveTypes(policies, [
        {
          balances_by_type: Object.fromEntries(
            employeeBalances.map((item) => [item.leave_type, item])
          ),
        },
      ]),
    [policies, employeeBalances]
  );

  const balanceMap = useMemo(
    () =>
      employeeBalances.reduce((acc, item) => {
        acc[item.leave_type] = item;
        return acc;
      }, {}),
    [employeeBalances]
  );

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 pb-3 pt-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          My Leave Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading leave report…</p>
        ) : leaveTypes.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No leave balances available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="py-3 pl-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Leave Type
                  </TableHead>
                  <TableHead className="py-3 text-right pr-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Available Balance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.map((type, idx) => {
                  const bal = balanceMap[type];
                  return (
                    <TableRow
                      key={type}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                    >
                      <TableCell className="py-3 pl-5 font-medium text-gray-900">
                        {formatLeaveTypeLabel(type)}
                      </TableCell>
                      <TableCell className="py-3 pr-6 text-right">
                        <BalanceBadge value={bal?.balance || 0} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
const LeaveReport = () => {
  const role = String(localStorage.getItem("role") || "").toLowerCase();
  const isAdmin = role.includes("admin");

  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState([]);
  const [adminRows, setAdminRows] = useState([]);
  const [employeeBalances, setEmployeeBalances] = useState([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const policyPromise = api.get("/admin/leave-policy");

        if (isAdmin) {
          const [policyRes, reportRes] = await Promise.all([
            policyPromise,
            api.get("/leave/balance-report"),
          ]);
          const allRows = reportRes?.data?.data || [];
          const nonAdminRows = allRows.filter(
            (row) => !String(row.role || "").toLowerCase().includes("admin")
          );
          setPolicies(policyRes?.data?.data || []);
          setAdminRows(nonAdminRows);
        } else {
          const employeeId = localStorage.getItem("employee_id");
          const requests = [policyPromise, api.get("/leave/my-balances")];
          if (employeeId) requests.push(api.get(`/comp-off/balance/${employeeId}`));

          const [policyRes, balancesRes, compOffRes] = await Promise.all(requests);
          const nextPolicies = policyRes?.data?.data || [];
          const baseBalances = balancesRes?.data?.data || [];
          const mergedBalances = [...baseBalances];
          const compOffBalance = compOffRes?.data?.data;

          if (compOffBalance) {
            const compensationBalance = {
              id: `comp-${compOffBalance.employee_id || employeeId || "self"}`,
              leave_type: "compensation",
              balance: Number(compOffBalance.available_balance || 0),
              used_days: Number(compOffBalance.used_count || 0),
              pending_days: Number(compOffBalance.pending_days || 0),
            };
            const existingIndex = mergedBalances.findIndex(
              (item) => item.leave_type === "compensation"
            );
            if (existingIndex >= 0) mergedBalances[existingIndex] = compensationBalance;
            else mergedBalances.push(compensationBalance);
          }

          setPolicies(nextPolicies);
          setEmployeeBalances(mergedBalances);
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load leave report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [isAdmin]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
            <FileBarChart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Leave Report</h1>
            <p className="text-sm text-gray-500">
              {isAdmin
                ? "All employees' available leave balances at a glance."
                : "Your current available leave balances."}
            </p>
          </div>
        </div>

        {isAdmin ? (
          <AdminView policies={policies} adminRows={adminRows} loading={loading} />
        ) : (
          <EmployeeView
            policies={policies}
            employeeBalances={employeeBalances}
            loading={loading}
          />
        )}
      </div>
    </Layout>
  );
};

export default LeaveReport;
