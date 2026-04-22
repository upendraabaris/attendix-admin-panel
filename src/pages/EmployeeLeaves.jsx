import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../hooks/useApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import {
  CalendarRange,
  CheckCircle,
  XCircle,
  Hourglass,
  ClipboardList,
  ArrowRight,
  SendHorizonal,
} from "lucide-react";

const LEAVE_TYPES = ["sick", "vacation", "personal", "other", "earned", "compensation", "casual","paternity"];
const HIDDEN_BALANCE_TYPES = ["vacation"];
// const SICK_LEAVE_PROOF_THRESHOLD_DAYS = 2;

// const getLeaveTypeHelpText = (leaveType) => {
//   if (leaveType === "sick") {
//     return "Sick Leave (SL) — Medical proof required if more than 2 consecutive days.";
//   }

//   return "";
// };

const getLeaveTypeHelpText = (leaveType, proofDays) => {
  if (leaveType === "sick") {
    return `Sick Leave (SL) — Medical proof required if more than ${proofDays} consecutive day${proofDays > 1 ? "s" : ""}.`;
  }
  return "";
};

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "—";

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

function EmployeeLeaves() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveList, setLeaveList] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [formData, setFormData] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
    medicalProof: null,
  });

 const [policies, setPolicies] = useState([]);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await api.get("/admin/leave-policy");
        setPolicies(res?.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch policies");
      }
    };

    fetchPolicies();
  }, []);

  const requestedDays =
    formData.startDate && formData.endDate
      ? Math.max(
        Math.floor(
          (new Date(formData.endDate) - new Date(formData.startDate)) /
          (1000 * 60 * 60 * 24),
        ) + 1,
        0,
      )
      : 0;
  const sickPolicy = policies.find(p => p.leave_type === "sick");
  const proofDays = sickPolicy?.document_days_required || 0;
  // const isMedicalProofRequired =
  //   formData.type === "sick" && requestedDays > SICK_LEAVE_PROOF_THRESHOLD_DAYS;
  const isMedicalProofRequired =
    formData.type === "sick" && requestedDays > proofDays;

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const employeeId = localStorage.getItem("employee_id");
      const requests = [
        api.get("/leave/my"),
        api.get("/leave/my-balances"),
      ];

      if (employeeId) {
        requests.push(api.get(`/comp-off/balance/${employeeId}`));
      }

      const [leaveRes, balanceRes, compOffRes] = await Promise.all(requests);
      setLeaveList(leaveRes?.data?.data || []);
      const baseBalances = (balanceRes?.data?.data || []).filter(
        (balance) => !HIDDEN_BALANCE_TYPES.includes(balance.leave_type),
      );
      const compOffBalance = compOffRes?.data?.data;

      const mergedBalances = [...baseBalances];

      if (compOffBalance) {
        mergedBalances.push({
          id: `comp-${compOffBalance.employee_id || employeeId || "self"}`,
          leave_type: "compensation",
          balance: Number(compOffBalance.available_balance || 0),
          used_days: Number(compOffBalance.used_count || 0),
        });
      }

      setLeaveBalances(mergedBalances);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      toast.error("Unable to fetch leave requests and balances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.startDate || !formData.endDate) {
      toast.error("Type, start date and end date are required");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End date cannot be before start date");
      return;
    }
    if (isMedicalProofRequired && !formData.medicalProof) {
      // toast.error("Medical proof is required for sick leave longer than 2 consecutive days");
      toast.error(`Medical proof is required for sick leave longer than ${proofDays} consecutive day${proofDays > 1 ? "s" : ""}`);
      return;
    }
    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append("type", formData.type);
      payload.append("startDate", formData.startDate);
      payload.append("endDate", formData.endDate);
      payload.append("reason", formData.reason || "");
      if (formData.medicalProof) {
        payload.append("medicalProof", formData.medicalProof);
      }

      await api.post("/leave", payload);
      toast.success("Leave request submitted");
      setFormData({ type: "", startDate: "", endDate: "", reason: "", medicalProof: null });
      fetchMyLeaves();
    } catch (error) {
      console.error("Error submitting leave:", error);
      toast.error(
        error?.response?.data?.message || "Failed to submit leave request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];


  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarRange className="w-7 h-7 text-indigo-600" />
            Leave Request
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Apply for leave and track your past requests.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {leaveBalances.length === 0 ? (
            <Card className="border-gray-200 shadow-sm sm:col-span-2 xl:col-span-4">
              <CardContent className="p-5 text-sm text-gray-500">
                No leave balances available yet.
              </CardContent>
            </Card>
          ) : (
            leaveBalances.map((item) => (
              <Card key={`${item.leave_type}-${item.id || "balance"}`} className="border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    {String(item.leave_type || "other")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {Number(item.balance || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Available balance
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Used: {Number(item.used_days || 0)}
                  </p>
                  {Number(item.pending_days || 0) > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Pending: {Number(item.pending_days || 0)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Apply Leave Form */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              Apply for Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs text-gray-500 font-medium">
                  Leave Type
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="cursor-pointer"
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* {getLeaveTypeHelpText(formData.type) && (
                  <p className="text-xs text-amber-700 mt-1">
                    {getLeaveTypeHelpText(formData.type)}
                  </p> */}
                {getLeaveTypeHelpText(formData.type, proofDays) && (
                  <p className="text-xs text-amber-700 mt-1">
                    {getLeaveTypeHelpText(formData.type, proofDays)}
                  </p>
                )}

                {formData.type === "sick" && (
                  <p className="text-xs text-gray-500 mt-1">
                    {/* Medical proof becomes mandatory if the leave is more than 2 consecutive days. */}
                    Medical proof becomes mandatory if the leave is more than {proofDays} consecutive day{proofDays > 1 ? "s" : ""}.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500 font-medium">
                  Start Date
                </Label>
                {/* <Input
                  type="date"
                  min={today}
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="h-9 text-sm"
                  required
                /> */}
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500 font-medium">
                  End Date
                </Label>
                {/* <Input
                  type="date"
                  min={formData.startDate || today}
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="h-9 text-sm"
                  required
                /> */}
                <Input
                  type="date"
                  min={formData.startDate || undefined}
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs text-gray-500 font-medium">
                  Reason <span className="text-gray-400">(optional)</span>
                </Label>
                <Textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Briefly describe your reason for leave..."
                  className="text-sm resize-none"
                />
              </div>

              {formData.type === "sick" && (
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs text-gray-500 font-medium">
                    Medical Proof
                    {isMedicalProofRequired ? (
                      <span className="text-red-500"> *</span>
                    ) : (
                      <span className="text-gray-400"> (required above 2 consecutive days)</span>
                    )}
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        medicalProof: e.target.files?.[0] || null,
                      }))
                    }
                    className="h-10 text-sm"
                    required={isMedicalProofRequired}
                  />
                  {formData.medicalProof && (
                    <p className="text-xs text-gray-500">
                      Selected: {formData.medicalProof.name}
                    </p>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-5 text-sm font-medium"
                >
                  <SendHorizonal className="w-3.5 h-3.5 mr-2" />
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* My Leave Requests */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            My Leave Requests
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading your requests...</p>
            </div>
          ) : leaveList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
              <ClipboardList className="w-9 h-9 mb-2 opacity-30" />
              <p className="text-sm font-medium">No leave requests yet</p>
              <p className="text-xs mt-1">
                Submit a request using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveList.map((leave) => {
                const cfg =
                  STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                return (
                  <div
                    key={leave.leave_id || leave.id}
                    className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} shadow-sm p-4`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">
                            {String(leave.type || "")
                              .charAt(0)
                              .toUpperCase() +
                              String(leave.type || "").slice(1)}{" "}
                            Leave
                          </p>
                          <Badge
                            className={`inline-flex items-center gap-1 border text-xs font-medium ${cfg.badge}`}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-600">
                          <CalendarRange className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDate(leave.start_date)}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span>{formatDate(leave.end_date)}</span>
                        </div>
                        {leave.reason && (
                          <p className="text-xs text-gray-500 mt-1.5">
                            {leave.reason}
                          </p>
                        )}
                        {leave.medical_proof_url && (
                          <a
                            href={leave.medical_proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            View Medical Proof
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default EmployeeLeaves;
