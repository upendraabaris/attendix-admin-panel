import { useEffect, useMemo, useState } from "react";
import { CalendarDays, KeyRound, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import api from "../hooks/useApi";

const POLICY_OPTIONS = [
  {
    value: "all_saturday_and_sunday_off",
    label: "All Saturday and Sunday Off",
    description: "Every Saturday and Sunday will be treated as weekly off.",
  },
  {
    value: "alternate_saturday_and_every_sunday_off",
    label: "Alternate Saturday and Every Sunday Off",
    description: "Alternate Saturdays and every Sunday will be treated as weekly off.",
  },
  {
    value: "second_and_fourth_saturday_and_every_sunday_off",
    label: "Second and Fourth Saturday and Every Sunday Off",
    description: "Only 2nd and 4th Saturdays plus every Sunday will be weekly off.",
  },
];

const EMPTY_HOLIDAY_FORM = {
  holiday_name: "",
  holiday_date: "",
  description: "",
};

// const formatHolidayDate = (value) => {
//   if (!value) return "—";
//   const normalized = String(value).slice(0, 10);
//   const [year, month, day] = normalized.split("-").map(Number);
//   return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };
const formatHolidayDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCreatedAt = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const WorkWeekPolicyPage = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [policyId, setPolicyId] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(POLICY_OPTIONS[0].value);
  const [policyStartDate, setPolicyStartDate] = useState("");
  const [policySaving, setPolicySaving] = useState(false);
  const [autoAbsentEnabled, setAutoAbsentEnabled] = useState(false);
  const [autoAbsentSaving, setAutoAbsentSaving] = useState(false);
  const [autoAbsentLastProcessedDate, setAutoAbsentLastProcessedDate] = useState(null);

  const [holidays, setHolidays] = useState([]);
  const [holidayForm, setHolidayForm] = useState(EMPTY_HOLIDAY_FORM);
  const [editingHolidayId, setEditingHolidayId] = useState(null);
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState(null);

  const loadData = async () => {
    try {
      setPageLoading(true);
      const [policyRes, holidaysRes, autoAbsentRes] = await Promise.all([
        api.get("/work-week-policy"),
        api.get("/holidays"),
        api.get("/auto-absent/settings"),
      ]);

      const policy = policyRes?.data?.data || null;
      const holidayRows = holidaysRes?.data?.data || [];
      const autoAbsent = autoAbsentRes?.data?.data || null;

      setPolicyId(policy?.id ?? null);
      setSelectedPolicy(policy?.policy_name || POLICY_OPTIONS[0].value);
      setPolicyStartDate(policy?.policy_start_date ? String(policy.policy_start_date).slice(0, 10) : "");
      setHolidays(holidayRows);
      setAutoAbsentEnabled(Boolean(autoAbsent?.is_enabled));
      setAutoAbsentLastProcessedDate(autoAbsent?.last_processed_date || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load work week policy and holidays");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedPolicyMeta = useMemo(
    () => POLICY_OPTIONS.find((item) => item.value === selectedPolicy) || POLICY_OPTIONS[0],
    [selectedPolicy]
  );

  const resetHolidayForm = () => {
    setHolidayForm(EMPTY_HOLIDAY_FORM);
    setEditingHolidayId(null);
  };

  const handlePolicySave = async () => {
    try {
      setPolicySaving(true);
      const payload = {
        policy_name: selectedPolicy,
        policy_start_date:
          selectedPolicy === "alternate_saturday_and_every_sunday_off"
            ? policyStartDate || null
            : null,
      };

      if (policyId) {
        const res = await api.put(`/work-week-policy/${policyId}`, payload);
        setPolicyId(res?.data?.data?.id ?? policyId);
      } else {
        const res = await api.post("/work-week-policy", payload);
        setPolicyId(res?.data?.data?.id ?? null);
      }

      toast.success("Work week policy saved successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save work week policy");
    } finally {
      setPolicySaving(false);
    }
  };

  const handleAutoAbsentToggle = async (checked) => {
    const previousValue = autoAbsentEnabled;
    try {
      setAutoAbsentEnabled(checked);
      setAutoAbsentSaving(true);
      const res = await api.put("/auto-absent/settings", { is_enabled: checked });
      const setting = res?.data?.data || null;
      setAutoAbsentEnabled(Boolean(setting?.is_enabled));
      setAutoAbsentLastProcessedDate(setting?.last_processed_date || null);
      toast.success(checked ? "Auto absent enabled" : "Auto absent disabled");
    } catch (error) {
      setAutoAbsentEnabled(previousValue);
      toast.error(error?.response?.data?.message || "Failed to update auto absent setting");
    } finally {
      setAutoAbsentSaving(false);
    }
  };

  const handleHolidayFieldChange = (field, value) => {
    setHolidayForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();

    if (!holidayForm.holiday_name.trim() || !holidayForm.holiday_date) {
      toast.error("Holiday name and holiday date are required");
      return;
    }

    try {
      setHolidaySaving(true);
      const payload = {
        holiday_name: holidayForm.holiday_name.trim(),
        holiday_date: holidayForm.holiday_date,
        description: holidayForm.description.trim(),
      };

      if (editingHolidayId) {
        await api.put(`/holidays/${editingHolidayId}`, payload);
        toast.success("Holiday updated successfully");
      } else {
        await api.post("/holidays", payload);
        toast.success("Holiday added successfully");
      }

      resetHolidayForm();
      const holidaysRes = await api.get("/holidays");
      setHolidays(holidaysRes?.data?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save holiday");
    } finally {
      setHolidaySaving(false);
    }
  };

  const startHolidayEdit = (holiday) => {
    setEditingHolidayId(holiday.id);
    setHolidayForm({
      holiday_name: holiday.holiday_name || "",
      holiday_date: holiday.holiday_date ? String(holiday.holiday_date).slice(0, 10) : "",
      description: holiday.description || "",
    });
  };

  const handleHolidayDelete = async (holidayId) => {
    const confirmed = window.confirm("Are you sure you want to delete this holiday?");
    if (!confirmed) return;

    try {
      setDeletingHolidayId(holidayId);
      await api.delete(`/holidays/${holidayId}`);
      setHolidays((prev) => prev.filter((item) => item.id !== holidayId));
      if (editingHolidayId === holidayId) {
        resetHolidayForm();
      }
      toast.success("Holiday deleted successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete holiday");
    } finally {
      setDeletingHolidayId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-7 h-7 text-indigo-600" />
            Work Week Policy & Holidays
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Configure weekly off rules and manage holidays for compensation leave logic.
          </p>
        </div>

        {pageLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading policy and holidays...</p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.05fr,1.35fr]">
            <div className="space-y-6">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <KeyRound className="w-5 h-5 text-indigo-600" />
                    Work Week Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={selectedPolicy} onValueChange={setSelectedPolicy} className="space-y-3">
                    {POLICY_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${selectedPolicy === option.value
                          ? "border-indigo-300 bg-indigo-50/60"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                      >
                        <RadioGroupItem value={option.value} className="mt-1" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>

                  {selectedPolicy === "alternate_saturday_and_every_sunday_off" ? (
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500 font-medium">
                        Alternate Saturday Start Date
                      </Label>
                      <Input
                        type="date"
                        value={policyStartDate}
                        onChange={(e) => setPolicyStartDate(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Select the first Saturday that should be treated as off. Every 14 days after that will also be off.
                      </p>
                    </div>
                  ) : null}

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-1">
                      Selected Policy
                    </p>
                    <p className="text-sm font-semibold text-slate-800">{selectedPolicyMeta.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{selectedPolicyMeta.description}</p>
                    {selectedPolicy === "alternate_saturday_and_every_sunday_off" && policyStartDate ? (
                      <p className="text-xs text-slate-500 mt-2">
                        Start date: {formatHolidayDate(policyStartDate)}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    onClick={handlePolicySave}
                    disabled={policySaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Save className="w-4 h-4" />
                    {policySaving ? "Saving..." : "Save Policy"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <CalendarDays className="w-5 h-5 text-indigo-600" />
                    Auto Absent Leave
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Mark missed clock-ins as absent
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        At midnight, employees with no clock-in for the completed day get an Other leave request with Absent as the reason. Weekly offs and holidays are skipped.
                      </p>
                    </div>
                
                      <Switch
                        checked={autoAbsentEnabled}
                        onCheckedChange={handleAutoAbsentToggle}
                        disabled={autoAbsentSaving}
                      />
                    
                    {/* <div className="flex-shrink-0 flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={autoAbsentEnabled}
                        onChange={(e) => handleAutoAbsentToggle(e.target.checked)}
                        disabled={autoAbsentSaving}
                        className="w-6 h-6 cursor-pointer accent-indigo-600"
                      />
                    </div> */}

                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-1">
                      Current Status
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {autoAbsentEnabled ? "Enabled" : "Disabled"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Last processed: {autoAbsentLastProcessedDate ? formatHolidayDate(autoAbsentLastProcessedDate) : "Not processed yet"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <CalendarDays className="w-5 h-5 text-indigo-600" />
                    {editingHolidayId ? "Edit Holiday" : "Add Holiday"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleHolidaySubmit} className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500 font-medium">Holiday Name</Label>
                      <Input
                        value={holidayForm.holiday_name}
                        onChange={(e) => handleHolidayFieldChange("holiday_name", e.target.value)}
                        placeholder="Enter holiday name"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500 font-medium">Holiday Date</Label>
                      <Input
                        type="date"
                        value={holidayForm.holiday_date}
                        onChange={(e) => handleHolidayFieldChange("holiday_date", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs text-gray-500 font-medium">Description</Label>
                      <Textarea
                        value={holidayForm.description}
                        onChange={(e) => handleHolidayFieldChange("description", e.target.value)}
                        placeholder="Optional holiday description"
                        className="min-h-[96px]"
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        disabled={holidaySaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {editingHolidayId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {holidaySaving
                          ? editingHolidayId
                            ? "Updating..."
                            : "Adding..."
                          : editingHolidayId
                            ? "Update Holiday"
                            : "Add Holiday"}
                      </Button>

                      {editingHolidayId ? (
                        <Button type="button" variant="outline" onClick={resetHolidayForm}>
                          Cancel Edit
                        </Button>
                      ) : null}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3 text-gray-900">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-indigo-600" />
                      Holiday List
                    </span>
                    <span className="text-xs font-medium text-gray-500">{holidays.length} total</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {holidays.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">
                      No holidays added yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {holidays.map((holiday) => (
                            <TableRow key={holiday.id}>
                              <TableCell className="font-medium text-gray-900">
                                {holiday.holiday_name}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm text-gray-600">
                                {formatHolidayDate(holiday.holiday_date)}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500 min-w-[240px]">
                                {holiday.description || "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm text-gray-500">
                                {formatCreatedAt(holiday.created_at)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startHolidayEdit(holiday)}
                                    className="h-8 px-3"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleHolidayDelete(holiday.id)}
                                    disabled={deletingHolidayId === holiday.id}
                                    className="h-8 px-3 border-red-200 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {deletingHolidayId === holiday.id ? "Deleting..." : "Delete"}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WorkWeekPolicyPage;
