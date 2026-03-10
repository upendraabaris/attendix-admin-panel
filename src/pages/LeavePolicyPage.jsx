// import { useEffect, useState } from "react";
// import { toast } from "sonner";
// import Layout from "../components/Layout";
// import api from "../hooks/useApi";

// import { Button } from "../components/ui/button";
// import { Badge } from "../components/ui/badge";
// import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
// import { Input } from "../components/ui/input";
// import { Label } from "../components/ui/label";
// import { Switch } from "../components/ui/switch";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../components/ui/table";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../components/ui/select";

// const LEAVE_TYPES = ["sick", "vacation", "personal", "other", "earned"];

// /* ─── Slide-out Edit Drawer ─────────────────────────────────────────── */
// const EditDrawer = ({ policy, onClose, onSaved }) => {
//   const [formData, setFormData] = useState({
//     leave_type: policy.leave_type || "sick",
//     yearly_limit: Number(policy.yearly_limit ?? 0),
//     is_enabled: Boolean(policy.is_enabled),
//     earned_days_required: Number(policy.earned_days_required ?? 20),
//     earned_leave_award: Number(policy.earned_leave_award ?? 1),
//   });
//   const [submitting, setSubmitting] = useState(false);

//   const isEarned = formData.leave_type === "earned";

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const payload = {
//       leave_type: formData.leave_type,
//       yearly_limit: isEarned ? null : Number(formData.yearly_limit),
//       is_enabled: Boolean(formData.is_enabled),
//       earned_days_required: isEarned ? Number(formData.earned_days_required) : null,
//       earned_leave_award: isEarned ? Number(formData.earned_leave_award) : null,
//     };
//     try {
//       setSubmitting(true);
//       await api.put(`/admin/leave-policy/${policy.id}`, payload);
//       toast.success("Leave policy updated");
//       onSaved();
//       onClose();
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to update leave policy");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <>
//       {/* Backdrop */}
//       <div
//         className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
//         onClick={onClose}
//       />

//       {/* Drawer Panel */}
//       <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-5 border-b bg-gray-50">
//           <div>
//             <h2 className="text-lg font-semibold text-gray-900">Edit Leave Policy</h2>
//             <p className="text-sm text-gray-500 capitalize mt-0.5">
//               {policy.leave_type} leave
//             </p>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
//             aria-label="Close"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
//               viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         {/* Form Body */}
//         <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
//           <div className="flex-1 px-6 py-6 space-y-5">

//             {/* Leave Type (read-only in edit mode) */}
//             <div className="space-y-1.5">
//               <Label className="text-sm font-medium text-gray-700">Leave Type</Label>
//               <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md border text-sm capitalize text-gray-600 cursor-not-allowed">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none"
//                   viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                   <path strokeLinecap="round" strokeLinejoin="round"
//                     d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                 </svg>
//                 {formData.leave_type}
//                 <span className="ml-auto text-xs text-gray-400">Cannot be changed</span>
//               </div>
//             </div>

//             {/* Yearly Limit — hidden for earned */}
//             {!isEarned && (
//               <div className="space-y-1.5">
//                 <Label className="text-sm font-medium text-gray-700">Yearly Limit (days)</Label>
//                 <Input
//                   type="number"
//                   min={0}
//                   value={formData.yearly_limit}
//                   onChange={(e) =>
//                     setFormData((prev) => ({ ...prev, yearly_limit: e.target.value }))
//                   }
//                   required
//                   className="focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             )}

//             {/* Enabled Toggle */}
//             <div className="flex items-center justify-between rounded-lg border px-4 py-3 bg-gray-50">
//               <div>
//                 <p className="text-sm font-medium text-gray-700">Policy Status</p>
//                 <p className="text-xs text-gray-500 mt-0.5">
//                   {formData.is_enabled ? "Employees can apply for this leave" : "This leave type is disabled"}
//                 </p>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className={`text-xs font-medium ${formData.is_enabled ? "text-green-600" : "text-gray-400"}`}>
//                   {formData.is_enabled ? "Enabled" : "Disabled"}
//                 </span>
//                 <Switch
//                   checked={formData.is_enabled}
//                   onCheckedChange={(checked) =>
//                     setFormData((prev) => ({ ...prev, is_enabled: checked }))
//                   }
//                 />
//               </div>
//             </div>

//             {/* Earned Leave Rules (conditional) */}
//             {isEarned && (
//               <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-4">
//                 <div className="flex items-center gap-2 mb-1">
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none"
//                     viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                     <path strokeLinecap="round" strokeLinejoin="round"
//                       d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <p className="text-sm font-semibold text-blue-700">Earned Leave Rules</p>
//                 </div>

//                 <div className="space-y-1.5">
//                   <Label className="text-sm font-medium text-gray-700">Working Days Required</Label>
//                   <Input
//                     type="number"
//                     min={1}
//                     value={formData.earned_days_required}
//                     onChange={(e) =>
//                       setFormData((prev) => ({ ...prev, earned_days_required: e.target.value }))
//                     }
//                     className="bg-white"
//                   />
//                   <p className="text-xs text-gray-500">Days employee must work to earn leave</p>
//                 </div>

//                 <div className="space-y-1.5">
//                   <Label className="text-sm font-medium text-gray-700">Leave Days Awarded</Label>
//                   <Input
//                     type="number"
//                     min={0.5}
//                     step="0.5"
//                     value={formData.earned_leave_award}
//                     onChange={(e) =>
//                       setFormData((prev) => ({ ...prev, earned_leave_award: e.target.value }))
//                     }
//                     className="bg-white"
//                   />
//                   <p className="text-xs text-gray-500">Leave days given after required days are worked</p>
//                 </div>

//                 {/* Rule Preview */}
//                 <div className="rounded-md bg-white border border-blue-200 px-3 py-2 text-sm text-blue-800">
//                   <span className="font-medium">Rule: </span>
//                   Every <span className="font-semibold">{formData.earned_days_required || "?"} working days</span>
//                   {" → "}
//                   <span className="font-semibold">{formData.earned_leave_award || "?"} leave day(s)</span> awarded
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Footer Actions */}
//           <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
//             <Button
//               type="submit"
//               disabled={submitting}
//               className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
//             >
//               {submitting ? (
//                 <span className="flex items-center gap-2">
//                   <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                     <path className="opacity-75" fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                   </svg>
//                   Saving...
//                 </span>
//               ) : "Update Policy"}
//             </Button>
//             <Button type="button" variant="outline" onClick={onClose} className="flex-1">
//               Cancel
//             </Button>
//           </div>
//         </form>
//       </div>

//       <style>{`
//         @keyframes slide-in {
//           from { transform: translateX(100%); opacity: 0; }
//           to   { transform: translateX(0);    opacity: 1; }
//         }
//         .animate-slide-in {
//           animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
//         }
//       `}</style>
//     </>
//   );
// };

// /* ─── Main Page ──────────────────────────────────────────────────────── */
// const LeavePolicyPage = () => {
//   const [policies, setPolicies] = useState([]);
//   const [editingPolicy, setEditingPolicy] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);

//   const [formData, setFormData] = useState({
//     leave_type: "sick",
//     yearly_limit: 0,
//     is_enabled: true,
//     earned_days_required: 20,
//     earned_leave_award: 1,
//   });

//   const isEarned = formData.leave_type === "earned";

//   const fetchPolicies = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/admin/leave-policy");
//       setPolicies(res?.data?.data || []);
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to fetch leave policies");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPolicies();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const payload = {
//       leave_type: formData.leave_type,
//       yearly_limit: isEarned ? null : Number(formData.yearly_limit),
//       is_enabled: Boolean(formData.is_enabled),
//       earned_days_required: isEarned ? Number(formData.earned_days_required) : null,
//       earned_leave_award: isEarned ? Number(formData.earned_leave_award) : null,
//     };
//     try {
//       setSubmitting(true);
//       await api.post("/admin/leave-policy", payload);
//       toast.success("Leave policy created");
//       setFormData({
//         leave_type: "sick",
//         yearly_limit: 0,
//         is_enabled: true,
//         earned_days_required: 20,
//         earned_leave_award: 1,
//       });
//       fetchPolicies();
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to save leave policy");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <Layout>
//       <div className="space-y-6">
//         <div>
//           <h1 className="text-2xl font-bold">Leave Policy</h1>
//           <p className="text-gray-600">Configure yearly leave limits and earned leave rules</p>
//         </div>

//         {/* ADD FORM */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Add Leave Policy</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <Label>Leave Type</Label>
//                 <Select
//                   value={formData.leave_type}
//                   onValueChange={(value) =>
//                     setFormData((prev) => ({ ...prev, leave_type: value }))
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select leave type" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {LEAVE_TYPES.map((type) => (
//                       <SelectItem key={type} value={type}>{type}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Yearly Limit — hidden when earned is selected */}
//               {!isEarned && (
//                 <div>
//                   <Label>Yearly Limit</Label>
//                   <Input
//                     type="number"
//                     min={0}
//                     value={formData.yearly_limit}
//                     onChange={(e) =>
//                       setFormData((prev) => ({ ...prev, yearly_limit: e.target.value }))
//                     }
//                     required
//                   />
//                 </div>
//               )}

//               {/* <div className="md:col-span-2 flex items-center justify-between border rounded-lg px-3 py-2">
//                 <Label>Enabled</Label>
//                 <Switch
//                   checked={formData.is_enabled}
//                   onCheckedChange={(checked) =>
//                     setFormData((prev) => ({ ...prev, is_enabled: checked }))
//                   }
//                 />
//               </div> */}

//               {isEarned && (
//                 <>
//                   <div>
//                     <Label>Earned Days Required</Label>
//                     <Input
//                       type="number"
//                       min={1}
//                       value={formData.earned_days_required}
//                       onChange={(e) =>
//                         setFormData((prev) => ({ ...prev, earned_days_required: e.target.value }))
//                       }
//                     />
//                   </div>
//                   <div>
//                     <Label>Earned Leave Award</Label>
//                     <Input
//                       type="number"
//                       min={0.5}
//                       step="0.5"
//                       value={formData.earned_leave_award}
//                       onChange={(e) =>
//                         setFormData((prev) => ({ ...prev, earned_leave_award: e.target.value }))
//                       }
//                     />
//                   </div>
//                 </>
//               )}

//               <div className="md:col-span-2">
//                 <Button type="submit" disabled={submitting}>
//                   {submitting ? "Saving..." : "Save Policy"}
//                 </Button>
//               </div>
//             </form>
//           </CardContent>
//         </Card>

//         {/* TABLE */}
//         <div className="border rounded-lg overflow-hidden bg-white">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Leave Type</TableHead>
//                 <TableHead>Yearly Limit</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Earned Rule</TableHead>
//                 <TableHead className="text-right">Action</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {policies.map((policy) => (
//                 <TableRow key={policy.id}>
//                   <TableCell className="capitalize">{policy.leave_type}</TableCell>

//                   {/* Yearly Limit — show "-" for earned rows */}
//                   <TableCell>
//                     {policy.leave_type === "earned" ? "-" : policy.yearly_limit}
//                   </TableCell>

//                   <TableCell>
//                     <Badge
//                       className={
//                         policy.is_enabled
//                           ? "bg-green-100 text-green-800"
//                           : "bg-gray-100 text-gray-700"
//                       }
//                     >
//                       {policy.is_enabled ? "Enabled" : "Disabled"}
//                     </Badge>
//                   </TableCell>
//                   <TableCell>
//                     {policy.leave_type === "earned"
//                       ? `${policy.earned_days_required} days → ${policy.earned_leave_award} leave`
//                       : "-"}
//                   </TableCell>
//                   <TableCell className="text-right">
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() => setEditingPolicy(policy)}
//                     >
//                       Edit
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               ))}
//               {!policies.length && (
//                 <TableRow>
//                   <TableCell colSpan={5} className="text-center text-gray-500">
//                     No leave policies configured yet
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </div>
//       </div>

//       {/* Edit Drawer */}
//       {editingPolicy && (
//         <EditDrawer
//           policy={editingPolicy}
//           onClose={() => setEditingPolicy(null)}
//           onSaved={fetchPolicies}
//         />
//       )}
//     </Layout>
//   );
// };

// export default LeavePolicyPage;

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "../components/Layout";
import api from "../hooks/useApi";

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const LEAVE_TYPES = ["sick", "vacation", "personal", "other", "earned"];

/* ─── Custom Toggle (always visible, no Tailwind dependency) ─────────── */
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{
      width: 44,
      height: 24,
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      padding: 2,
      backgroundColor: checked ? "#16a34a" : "#d1d5db",
      transition: "background-color 0.2s ease",
      display: "flex",
      alignItems: "center",
      flexShrink: 0,
      outline: "none",
    }}
  >
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        transform: checked ? "translateX(20px)" : "translateX(0px)",
        transition: "transform 0.2s ease",
        display: "block",
      }}
    />
  </button>
);

/* ─── Slide-out Edit Drawer ─────────────────────────────────────────── */
const EditDrawer = ({ policy, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    leave_type: policy.leave_type || "sick",
    yearly_limit: Number(policy.yearly_limit ?? 0),
    is_enabled: Boolean(policy.is_enabled),
    earned_days_required: Number(policy.earned_days_required ?? 20),
    earned_leave_award: Number(policy.earned_leave_award ?? 1),
  });
  const [submitting, setSubmitting] = useState(false);

  const isEarned = formData.leave_type === "earned";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      leave_type: formData.leave_type,
      yearly_limit: isEarned ? null : Number(formData.yearly_limit),
      is_enabled: Boolean(formData.is_enabled),
      earned_days_required: isEarned ? Number(formData.earned_days_required) : null,
      earned_leave_award: isEarned ? Number(formData.earned_leave_award) : null,
    };
    try {
      setSubmitting(true);
      await api.put(`/admin/leave-policy/${policy.id}`, payload);
      toast.success("Leave policy updated");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update leave policy");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Leave Policy</h2>
            <p className="text-sm text-gray-500 capitalize mt-0.5">
              {policy.leave_type} leave
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex-1 px-6 py-6 space-y-5">

            {/* Leave Type (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Leave Type</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md border text-sm capitalize text-gray-600 cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {formData.leave_type}
                <span className="ml-auto text-xs text-gray-400">Cannot be changed</span>
              </div>
            </div>

            {/* Yearly Limit — hidden for earned */}
            {!isEarned && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Yearly Limit (days)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.yearly_limit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, yearly_limit: e.target.value }))
                  }
                  required
                />
              </div>
            )}

            {/* Enabled Toggle */}
            <div className="flex items-center justify-between rounded-lg border px-4 py-3 bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-700">Policy Status</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formData.is_enabled
                    ? "Employees can apply for this leave"
                    : "This leave type is disabled"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-semibold"
                  style={{ color: formData.is_enabled ? "#16a34a" : "#9ca3af" }}
                >
                  {formData.is_enabled ? "Enabled" : "Disabled"}
                </span>
                <Toggle
                  checked={formData.is_enabled}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, is_enabled: val }))
                  }
                />
              </div>
            </div>

            {/* Earned Leave Rules (conditional) */}
            {isEarned && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-blue-700">Earned Leave Rules</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Working Days Required</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.earned_days_required}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, earned_days_required: e.target.value }))
                    }
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">Days employee must work to earn leave</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Leave Days Awarded</Label>
                  <Input
                    type="number"
                    min={0.5}
                    step="0.5"
                    value={formData.earned_leave_award}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, earned_leave_award: e.target.value }))
                    }
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">Leave days given after required days are worked</p>
                </div>

                {/* Rule Preview */}
                <div className="rounded-md bg-white border border-blue-200 px-3 py-2 text-sm text-blue-800">
                  <span className="font-medium">Rule: </span>
                  Every <span className="font-semibold">{formData.earned_days_required || "?"} working days</span>
                  {" → "}
                  <span className="font-semibold">{formData.earned_leave_award || "?"} leave day(s)</span> awarded
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : "Update Policy"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────────── */
const LeavePolicyPage = () => {
  const [policies, setPolicies] = useState([]);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leave_type: "sick",
    yearly_limit: 0,
    is_enabled: true,
    earned_days_required: 20,
    earned_leave_award: 1,
  });

  const isEarned = formData.leave_type === "earned";

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/leave-policy");
      setPolicies(res?.data?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch leave policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      leave_type: formData.leave_type,
      yearly_limit: isEarned ? null : Number(formData.yearly_limit),
      is_enabled: Boolean(formData.is_enabled),
      earned_days_required: isEarned ? Number(formData.earned_days_required) : null,
      earned_leave_award: isEarned ? Number(formData.earned_leave_award) : null,
    };
    try {
      setSubmitting(true);
      await api.post("/admin/leave-policy", payload);
      toast.success("Leave policy created");
      setFormData({
        leave_type: "sick",
        yearly_limit: 0,
        is_enabled: true,
        earned_days_required: 20,
        earned_leave_award: 1,
      });
      fetchPolicies();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save leave policy");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Leave Policy</h1>
          <p className="text-gray-600">Configure yearly leave limits and earned leave rules</p>
        </div>

        {/* ADD FORM */}
        <Card>
          <CardHeader>
            <CardTitle>Add Leave Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Leave Type</Label>
                <Select
                  value={formData.leave_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, leave_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Yearly Limit — hidden when earned */}
              {!isEarned && (
                <div>
                  <Label>Yearly Limit</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.yearly_limit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, yearly_limit: e.target.value }))
                    }
                    required
                  />
                </div>
              )}

              {/* Enabled Toggle — Add Form */}
              <div className="md:col-span-2 flex items-center justify-between border rounded-lg px-4 py-3 bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-700">Policy Status</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formData.is_enabled
                      ? "Employees can apply for this leave"
                      : "This leave type is disabled"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: formData.is_enabled ? "#16a34a" : "#9ca3af" }}
                  >
                    {formData.is_enabled ? "Enabled" : "Disabled"}
                  </span>
                  <Toggle
                    checked={formData.is_enabled}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, is_enabled: val }))
                    }
                  />
                </div>
              </div>

              {isEarned && (
                <>
                  <div>
                    <Label>Earned Days Required</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.earned_days_required}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, earned_days_required: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Earned Leave Award</Label>
                    <Input
                      type="number"
                      min={0.5}
                      step="0.5"
                      value={formData.earned_leave_award}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, earned_leave_award: e.target.value }))
                      }
                    />
                  </div>
                </>
              )}

              {/* <div className="md:col-span-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Policy"}
                </Button>
              </div> */}
              <div className="md:col-span-2">
  <Button
    type="submit"
    disabled={submitting}
    className="bg-blue-600 hover:bg-blue-700 text-white"
  >
    {submitting ? "Saving..." : "Save Policy"}
  </Button>
</div>
            </form>
          </CardContent>
        </Card>

        {/* TABLE */}
        <div className="border rounded-lg overflow-hidden bg-white">
          {/* TABLE */}
{policies.length > 0 && (
  <div className="border rounded-lg overflow-hidden bg-white">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Leave Type</TableHead>
          <TableHead>Yearly Limit</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Earned Rule</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {policies.map((policy) => (
          <TableRow key={policy.id}>
            <TableCell className="capitalize">{policy.leave_type}</TableCell>
            <TableCell>
              {policy.leave_type === "earned" ? "-" : policy.yearly_limit}
            </TableCell>
            <TableCell>
              <Badge
                className={
                  policy.is_enabled
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-700"
                }
              >
                {policy.is_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </TableCell>
            <TableCell>
              {policy.leave_type === "earned"
                ? `${policy.earned_days_required} days → ${policy.earned_leave_award} leave`
                : "-"}
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingPolicy(policy)}
              >
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)}
        </div>
      </div>

      {/* Edit Drawer */}
      {editingPolicy && (
        <EditDrawer
          policy={editingPolicy}
          onClose={() => setEditingPolicy(null)}
          onSaved={fetchPolicies}
        />
      )}
    </Layout>
  );
};

export default LeavePolicyPage;