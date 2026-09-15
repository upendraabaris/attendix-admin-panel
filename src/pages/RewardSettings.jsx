import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import {
    Trophy,
    CalendarDays,
    CalendarCheck,
    Clock,
    Save,
    RefreshCcw,
    Plus,
    Pencil,
    Trash2,
    X,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import api from "../hooks/useApi";

// Admin configuration for the organization-level Reward Points system.
// No reward value is hardcoded or seeded — a new organization starts disabled
// with zero slabs. See REWARD_POINTS_MODULE.md sections 6.4 and 7.1.
const RewardSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [slabSaving, setSlabSaving] = useState(false);

    const [settings, setSettings] = useState({
        is_enabled: false,
        start_date: "",
        leave_early_enabled: false,
        leave_early_days_before: "",
        leave_early_points: "",
        punctuality_enabled: false,
    });

    const [slabs, setSlabs] = useState([]);
    const [slabForm, setSlabForm] = useState({ max_minutes_late: "", points: "" });
    const [editingSlabId, setEditingSlabId] = useState(null);

    const applyResponse = (data) => {
        setSettings({
            is_enabled: Boolean(data?.is_enabled),
            start_date: data?.start_date ? String(data.start_date).slice(0, 10) : "",
            leave_early_enabled: Boolean(data?.leave_early_enabled),
            leave_early_days_before:
                data?.leave_early_days_before === null || data?.leave_early_days_before === undefined
                    ? ""
                    : String(data.leave_early_days_before),
            leave_early_points:
                data?.leave_early_points === null || data?.leave_early_points === undefined
                    ? ""
                    : String(data.leave_early_points),
            punctuality_enabled: Boolean(data?.punctuality_enabled),
        });
        setSlabs(Array.isArray(data?.slabs) ? data.slabs : []);
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get("/rewards/settings");
            applyResponse(res?.data?.data);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch reward settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        // Mirrors the backend validation so the admin gets feedback before a request.
        if (settings.is_enabled && !settings.start_date) {
            return toast.error("Reward System Start Date is required when the system is enabled");
        }

        if (settings.leave_early_enabled) {
            const days = Number(settings.leave_early_days_before);
            const points = Number(settings.leave_early_points);
            if (!Number.isInteger(days) || days < 0) {
                return toast.error("Days Before Leave must be a non-negative whole number");
            }
            if (!Number.isInteger(points) || points < 0) {
                return toast.error("Reward Points must be a non-negative whole number");
            }
        }

        try {
            setSaving(true);
            const res = await api.put("/rewards/settings", {
                is_enabled: settings.is_enabled,
                start_date: settings.start_date || null,
                leave_early_enabled: settings.leave_early_enabled,
                leave_early_days_before: settings.leave_early_enabled
                    ? Number(settings.leave_early_days_before)
                    : null,
                leave_early_points: settings.leave_early_enabled
                    ? Number(settings.leave_early_points)
                    : null,
                punctuality_enabled: settings.punctuality_enabled,
            });
            applyResponse(res?.data?.data);
            toast.success(res?.data?.message || "Reward settings saved");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to save reward settings");
        } finally {
            setSaving(false);
        }
    };

    const resetSlabForm = () => {
        setSlabForm({ max_minutes_late: "", points: "" });
        setEditingSlabId(null);
    };

    const handleSlabSubmit = async (e) => {
        e.preventDefault();

        const minutes = Number(slabForm.max_minutes_late);
        const points = Number(slabForm.points);
        if (!Number.isInteger(minutes) || minutes < 0) {
            return toast.error("Max Minutes Late must be a non-negative whole number");
        }
        if (!Number.isInteger(points) || points < 0) {
            return toast.error("Reward Points must be a non-negative whole number");
        }

        try {
            setSlabSaving(true);
            const payload = { max_minutes_late: minutes, points };
            if (editingSlabId) {
                await api.put(`/rewards/slabs/${editingSlabId}`, payload);
                toast.success("Slab updated");
            } else {
                await api.post("/rewards/slabs", payload);
                toast.success("Slab added");
            }
            resetSlabForm();
            fetchSettings();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to save slab");
        } finally {
            setSlabSaving(false);
        }
    };

    const handleSlabEdit = (slab) => {
        setEditingSlabId(slab.id);
        setSlabForm({
            max_minutes_late: String(slab.max_minutes_late),
            points: String(slab.points),
        });
    };

    const handleSlabDelete = async (slab) => {
        if (!window.confirm(`Delete the slab for ${slab.max_minutes_late} minute(s) late?`)) {
            return;
        }
        try {
            await api.delete(`/rewards/slabs/${slab.id}`);
            toast.success("Slab deleted");
            if (editingSlabId === slab.id) resetSlabForm();
            fetchSettings();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to delete slab");
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <RefreshCcw className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
                    <p className="animate-pulse">Fetching reward configuration...</p>
                </div>
            </Layout>
        );
    }

    const systemOff = !settings.is_enabled;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Trophy className="w-7 h-7 text-indigo-600" />
                            Reward Settings
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            Configure organization reward points for early leave applications and punctuality.
                        </p>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 flex items-center gap-2 px-6"
                    >
                        {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>

                {/* System master switch + start date */}
                <Card className="border-gray-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Trophy className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Reward Points System</CardTitle>
                                <CardDescription>
                                    Master switch for this organization. Disabling hides all rankings but never deletes
                                    existing points.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold text-gray-800">
                                    Enable Reward Points System
                                </Label>
                                <p className="text-xs text-gray-500">
                                    When disabled, no new points are generated and no ranking is visible.
                                </p>
                            </div>
                            <Switch
                                checked={settings.is_enabled}
                                onCheckedChange={(val) => setSettings({ ...settings, is_enabled: val })}
                            />
                        </div>

                        <div
                            className={`space-y-2 transition-opacity duration-300 ${systemOff ? "opacity-40 pointer-events-none" : ""}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <CalendarDays className="w-4 h-4 text-gray-400" />
                                <Label className="text-sm font-medium">Reward System Start Date</Label>
                            </div>
                            <Input
                                type="date"
                                value={settings.start_date}
                                onChange={(e) => setSettings({ ...settings, start_date: e.target.value })}
                                className="h-10 max-w-xs"
                            />
                            <p className="text-[11px] text-gray-400">
                                Only reward activity on or after this date is eligible. Existing points are never
                                deleted when this changes, but ranking always respects the current start date.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Leave early reward */}
                <Card
                    className={`border-gray-200 shadow-sm overflow-hidden transition-opacity duration-300 ${systemOff ? "opacity-40 pointer-events-none" : ""}`}
                >
                    <CardHeader className="bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Leave Early Reward</CardTitle>
                                <CardDescription>
                                    Points awarded when an approved leave was applied for sufficiently early.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold text-gray-800">
                                    Enable Leave Early Reward
                                </Label>
                                <p className="text-xs text-gray-500">
                                    Points are granted only when the leave is approved, never at application time.
                                </p>
                            </div>
                            <Switch
                                checked={settings.leave_early_enabled}
                                onCheckedChange={(val) => setSettings({ ...settings, leave_early_enabled: val })}
                            />
                        </div>

                        <div
                            className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity duration-300 ${!settings.leave_early_enabled ? "opacity-40 pointer-events-none" : ""}`}
                        >
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <CalendarDays className="w-4 h-4 text-gray-400" />
                                    <Label className="text-sm font-medium">Days Before Leave</Label>
                                </div>
                                <Input
                                    type="number"
                                    min="0"
                                    value={settings.leave_early_days_before}
                                    onChange={(e) =>
                                        setSettings({ ...settings, leave_early_days_before: e.target.value })
                                    }
                                    placeholder="e.g. 3"
                                    className="h-10"
                                />
                                <p className="text-[11px] text-gray-400">
                                    Applying this many days before the leave start date, or earlier, qualifies.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <Trophy className="w-4 h-4 text-gray-400" />
                                    <Label className="text-sm font-medium">Reward Points</Label>
                                </div>
                                <Input
                                    type="number"
                                    min="0"
                                    value={settings.leave_early_points}
                                    onChange={(e) => setSettings({ ...settings, leave_early_points: e.target.value })}
                                    placeholder="e.g. 5"
                                    className="h-10"
                                />
                                <p className="text-[11px] text-gray-400">
                                    Points granted per qualifying approved leave request.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Punctuality reward */}
                <Card
                    className={`border-gray-200 shadow-sm overflow-hidden transition-opacity duration-300 ${systemOff ? "opacity-40 pointer-events-none" : ""}`}
                >
                    <CardHeader className="bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Punctuality Reward</CardTitle>
                                <CardDescription>
                                    Compares the first clock-in of the day against each employee&apos;s Expected
                                    Clock-In Time.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-amber-50/30 rounded-xl border border-amber-100/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold text-gray-800">
                                    Enable Punctuality Reward
                                </Label>
                                <p className="text-xs text-gray-500">
                                    Employees without an Expected Clock-In Time configured earn no punctuality points.
                                </p>
                            </div>
                            <Switch
                                checked={settings.punctuality_enabled}
                                onCheckedChange={(val) => setSettings({ ...settings, punctuality_enabled: val })}
                            />
                        </div>

                        <div
                            className={`space-y-4 transition-opacity duration-300 ${!settings.punctuality_enabled ? "opacity-40 pointer-events-none" : ""}`}
                        >
                            {settings.punctuality_enabled && slabs.length === 0 && (
                                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>
                                        No slabs configured — no punctuality points will be awarded until you add at
                                        least one.
                                    </span>
                                </div>
                            )}

                            {/* Slab add / edit form */}
                            <form
                                onSubmit={handleSlabSubmit}
                                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end p-4 bg-gray-50 rounded-xl border border-gray-100"
                            >
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Max Minutes Late
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={slabForm.max_minutes_late}
                                        onChange={(e) =>
                                            setSlabForm({ ...slabForm, max_minutes_late: e.target.value })
                                        }
                                        placeholder="e.g. 5"
                                        className="h-10 bg-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Reward Points
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={slabForm.points}
                                        onChange={(e) => setSlabForm({ ...slabForm, points: e.target.value })}
                                        placeholder="e.g. 5"
                                        className="h-10 bg-white"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={slabSaving}
                                        className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                                    >
                                        {editingSlabId ? (
                                            <>
                                                <Save className="w-4 h-4" /> Update
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" /> Add Slab
                                            </>
                                        )}
                                    </Button>
                                    {editingSlabId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetSlabForm}
                                            className="h-10 flex items-center gap-1.5"
                                        >
                                            <X className="w-4 h-4" /> Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>

                            {/* Slab list */}
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="py-3 pl-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Max Minutes Late
                                            </TableHead>
                                            <TableHead className="py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Reward Points
                                            </TableHead>
                                            <TableHead className="py-3 pr-5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {slabs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-6 text-center text-sm text-gray-500">
                                                    No punctuality slabs configured yet.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            slabs.map((slab, idx) => (
                                                <TableRow
                                                    key={slab.id}
                                                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                                                >
                                                    <TableCell className="py-3 pl-5 font-medium text-gray-900">
                                                        {slab.max_minutes_late === 0
                                                            ? "On time or early"
                                                            : `Within ${slab.max_minutes_late} min`}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-gray-700">
                                                        {slab.points}
                                                    </TableCell>
                                                    <TableCell className="py-3 pr-5 text-right">
                                                        <div className="inline-flex gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSlabEdit(slab)}
                                                                className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                                title="Edit slab"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSlabDelete(slab)}
                                                                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                title="Delete slab"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <p className="text-[11px] text-gray-400">
                                The matching slab is the smallest one that still covers the employee&apos;s lateness.
                                Clocking in early or exactly on time counts as 0 minutes late.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default RewardSettings;
