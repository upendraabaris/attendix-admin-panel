import { useEffect, useState } from "react";
import { toast } from "sonner";

import Layout from "../components/Layout";
import api from "../hooks/useApi";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const LEAVE_TYPES = [
  "sick",
  "personal",
  "other",
  "earned",
  "casual",
  "compensation",
  "paternity",
  "vacation"
];

const DEFAULT_FORM_DATA = {
  leave_type: "sick",
  yearly_limit: 0,
  is_enabled: true,
  earned_days_required: 1,
  earned_leave_award: 1,
  document_days_required: null,
  max_consecutive_days: 2,
  expire_limit: 30,
};

const RULE_BASED_TYPES = ["earned", "casual"];

const isRuleBasedLeave = (leaveType) => RULE_BASED_TYPES.includes(leaveType);

const getSickDocumentRuleText = (documentDaysRequired) => {
  const proofDays = Number(documentDaysRequired ?? 0);

  if (!proofDays || proofDays <= 0) {
    return "No document required";
  }

  return `Medical proof required if more than ${proofDays} consecutive day${proofDays > 1 ? "s" : ""}`;
};

const parseOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildPolicyPayload = (formData) => {
  const isRuleBased = isRuleBasedLeave(formData.leave_type);

  return {
    leave_type: formData.leave_type,
    yearly_limit: isRuleBased ? null : Number(formData.yearly_limit),
    is_enabled: Boolean(formData.is_enabled),
    earned_days_required: isRuleBased ? Number(formData.earned_days_required) : null,
    earned_leave_award: isRuleBased ? Number(formData.earned_leave_award) : null,
    document_days_required:
      formData.leave_type === "sick" ? parseOptionalNumber(formData.document_days_required) : null,
    max_consecutive_days:
      formData.leave_type === "casual" ? parseOptionalNumber(formData.max_consecutive_days) : null,
    expire_limit:
      formData.leave_type === "compensation" ? parseOptionalNumber(formData.expire_limit) : null,
  };
};

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

const EditDrawer = ({ policy, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    leave_type: policy.leave_type || DEFAULT_FORM_DATA.leave_type,
    yearly_limit: Number(policy.yearly_limit ?? DEFAULT_FORM_DATA.yearly_limit),
    is_enabled: Boolean(policy.is_enabled),
    earned_days_required: Number(
      policy.earned_days_required ?? DEFAULT_FORM_DATA.earned_days_required,
    ),
    earned_leave_award: Number(
      policy.earned_leave_award ?? DEFAULT_FORM_DATA.earned_leave_award,
    ),
    document_days_required: Number(
      policy.document_days_required ?? DEFAULT_FORM_DATA.document_days_required,
    ),
    max_consecutive_days: Number(
      policy.max_consecutive_days ?? DEFAULT_FORM_DATA.max_consecutive_days,
    ),
    expire_limit: Number(policy.expire_limit ?? DEFAULT_FORM_DATA.expire_limit),
  });
  const [submitting, setSubmitting] = useState(false);

  const isRuleBased = isRuleBasedLeave(formData.leave_type);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await api.put(`/admin/leave-policy/${policy.id}`, buildPolicyPayload(formData));
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
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Leave Policy</h2>
            <p className="mt-0.5 text-sm capitalize text-gray-500">{policy.leave_type} leave</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-5 px-6 py-6">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Leave Type</Label>
              <div className="flex cursor-not-allowed items-center gap-2 rounded-md border bg-gray-100 px-3 py-2 text-sm capitalize text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                {formData.leave_type}
                <span className="ml-auto text-xs text-gray-400">Cannot be changed</span>
              </div>
            </div>

            {!isRuleBased && (
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

            {formData.leave_type === "sick" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Document Days Required</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.document_days_required ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      document_days_required: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            {formData.leave_type === "compensation" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Expire Limit (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.expire_limit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expire_limit: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Policy Status</p>
                <p className="mt-0.5 text-xs text-gray-500">
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
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, is_enabled: value }))
                  }
                />
              </div>
            </div>

            {formData.leave_type === "sick" ? (
              <div className="space-y-2 rounded-lg border border-rose-100 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-700">Sick Leave (SL)</p>
                <p className="text-sm text-rose-900">{getSickDocumentRuleText(formData.document_days_required)}.</p>
              </div>
            ) : isRuleBased ? (
              <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-blue-700">Leave Rules</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Working Days Required</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.earned_days_required}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        earned_days_required: e.target.value,
                      }))
                    }
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">Days employee must work to earn leave</p>
                </div>

                {formData.leave_type === "casual" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Max Consecutive Days</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.max_consecutive_days}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          max_consecutive_days: e.target.value,
                        }))
                      }
                      className="bg-white"
                    />
                    <p className="text-xs text-gray-500">
                      Maximum casual leave days allowed in one request
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Leave Days Awarded</Label>
                  <Input
                    type="number"
                    min={0.5}
                    step="0.5"
                    value={formData.earned_leave_award}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        earned_leave_award: e.target.value,
                      }))
                    }
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">
                    Leave days given after required days are worked
                  </p>
                </div>

                <div className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-800">
                  <span className="font-medium">Rule: </span>
                  Every{" "}
                  <span className="font-semibold">
                    {formData.earned_days_required || "?"} working days
                  </span>{" "}
                  -{" "}
                  <span className="font-semibold">
                    {formData.earned_leave_award || "?"} leave day(s)
                  </span>{" "}
                  awarded
                  {formData.leave_type === "casual" && (
                    <>
                      {" "} | Max{" "}
                      <span className="font-semibold">
                        {formData.max_consecutive_days || "?"} consecutive day(s)
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : formData.leave_type === "compensation" ? (
              <div className="space-y-2 rounded-lg border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-700">Compensation Leave</p>
                <p className="text-sm text-amber-900">
                  Compensation leave expires after {formData.expire_limit || "?"} day(s).
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex gap-3 border-t bg-gray-50 px-6 py-4">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Update Policy"
              )}
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
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </>
  );
};

const LeavePolicyPage = () => {
  const [policies, setPolicies] = useState([]);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const isRuleBased = isRuleBasedLeave(formData.leave_type);
  const visiblePolicies = policies.filter(
    (policy) => policy.leave_type,
  );

  const fetchPolicies = async () => {
    try {
      const res = await api.get("/admin/leave-policy");
      setPolicies(res?.data?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch leave policies");
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await api.post("/admin/leave-policy", buildPolicyPayload(formData));
      toast.success("Leave policy created");
      setFormData(DEFAULT_FORM_DATA);
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
          <p className="text-gray-600">Configure yearly leave limits and leave rules</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Leave Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isRuleBased && (
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

              {formData.leave_type === "sick" && (
                <div>
                  <Label>Document Days Required</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.document_days_required ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        document_days_required: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {formData.leave_type === "casual" && (
                <div>
                  <Label>Max Consecutive Days</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.max_consecutive_days}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_consecutive_days: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {formData.leave_type === "compensation" && (
                <div>
                  <Label>Expire Limit (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.expire_limit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expire_limit: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className="md:col-span-2 flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Policy Status</p>
                  <p className="mt-0.5 text-xs text-gray-500">
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
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, is_enabled: value }))
                    }
                  />
                </div>
              </div>

              {formData.leave_type === "sick" ? (
                <div className="md:col-span-2 space-y-2 rounded-lg border border-rose-100 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-700">Sick Leave (SL)</p>
                  <p className="text-sm text-rose-900">{getSickDocumentRuleText(formData.document_days_required)}.</p>
                </div>
              ) : isRuleBased ? (
                <>
                  <div>
                    <Label>Working Days Required</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.earned_days_required}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          earned_days_required: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Leave Days Awarded</Label>
                    <Input
                      type="number"
                      min={0.5}
                      step="0.5"
                      value={formData.earned_leave_award}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          earned_leave_award: e.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              ) : formData.leave_type === "compensation" ? (
                <div className="md:col-span-2 space-y-2 rounded-lg border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-700">Compensation Leave</p>
                  <p className="text-sm text-amber-900">
                    Compensation leave expires after {formData.expire_limit || "?"} day(s).
                  </p>
                </div>
              ) : null}

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {submitting ? "Saving..." : "Save Policy"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {visiblePolicies.length > 0 && (
          <div className="overflow-hidden rounded-lg border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Yearly Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiblePolicies.map((policy) => {
                  const policyIsRuleBased = isRuleBasedLeave(policy.leave_type);

                  return (
                    <TableRow key={policy.id}>
                      <TableCell className="capitalize">{policy.leave_type}</TableCell>
                      <TableCell>{policyIsRuleBased ? "-" : policy.yearly_limit}</TableCell>
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
                        {policy.leave_type === "sick"
                          ? getSickDocumentRuleText(policy.document_days_required)
                          : policy.leave_type === "compensation"
                            ? `Expires in ${policy.expire_limit || "?"} day(s)`
                            : policyIsRuleBased
                              ? `${policy.earned_days_required} days -> ${policy.earned_leave_award} leave${policy.leave_type === "casual" && policy.max_consecutive_days ? ` | Max ${policy.max_consecutive_days} consecutive days` : ""}`
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

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
