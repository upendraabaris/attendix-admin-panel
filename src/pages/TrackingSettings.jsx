import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Settings, Activity, Clock, Coffee, Save, RefreshCcw, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import api from "../hooks/useApi";

const TrackingSettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [settings, setSettings] = useState({
        tracking_enabled: false,
        idle_warning_minutes: 15,
        auto_clockout_minutes: 30,
        break_enabled: false,
        max_break_minutes: 60,
        updated_at: null,
        updated_by_name: ""
    });

    // Fetch Settings
    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get("/tracking-settings");
            if (res.data.success) {
                setSettings(res.data.data);
            }
        } catch (error) {
            if (error.response?.status !== 404) {
                toast.error("Failed to fetch tracking settings");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // Handle Save
    const handleSave = async () => {
        // Validations
        if (settings.idle_warning_minutes <= 0) {
            return toast.error("Idle warning time must be greater than 0");
        }
        if (settings.auto_clockout_minutes <= settings.idle_warning_minutes) {
            return toast.error("Auto clock out time must be greater than idle warning time");
        }
        if (settings.max_break_minutes <= 0) {
            return toast.error("Maximum break time must be greater than 0");
        }

        try {
            setProcessing(true);
            const res = await api.put("/tracking-settings", settings);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchSettings(); // Refresh for updated timestamps
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update settings");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <RefreshCcw className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
                    <p className="animate-pulse">Fetching tracking configurations...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Settings className="w-7 h-7 text-indigo-600" />
                            Attendance Tracking Settings
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            Configure Chrome extension behavior for activity tracking and idle monitoring.
                        </p>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={processing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 flex items-center gap-2 px-6"
                    >
                        {processing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {processing ? "Saving..." : "Save Changes"}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Activity Tracking Card */}
                    <Card className="border-gray-200 shadow-sm overflow-hidden h-full">
                        <CardHeader className="bg-slate-50/50 border-bottom">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Activity className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Activity Monitoring</CardTitle>
                                    <CardDescription>System idle and auto clock-out rules</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold text-gray-800">Enable Activity Tracking</Label>
                                    <p className="text-xs text-gray-500">Monitor employee mouse/keyboard activity</p>
                                </div>
                                <Switch
                                    checked={settings.tracking_enabled}
                                    onCheckedChange={(val) => setSettings({ ...settings, tracking_enabled: val })}
                                />
                            </div>

                            <div className={`space-y-4 transition-opacity duration-300 ${!settings.tracking_enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <Label className="text-sm font-medium">Idle Warning Time (Minutes)</Label>
                                    </div>
                                    <Input
                                        type="number"
                                        value={settings.idle_warning_minutes}
                                        onChange={(e) => setSettings({ ...settings, idle_warning_minutes: parseInt(e.target.value) || 0 })}
                                        placeholder="e.g. 15"
                                        className="h-10"
                                    />
                                    <p className="text-[11px] text-gray-400">Time after which employee gets a "Still working?" notification.</p>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-4 h-4 text-red-400" />
                                        <Label className="text-sm font-medium">Auto Clock Out Time (Minutes)</Label>
                                    </div>
                                    <Input
                                        type="number"
                                        value={settings.auto_clockout_minutes}
                                        onChange={(e) => setSettings({ ...settings, auto_clockout_minutes: parseInt(e.target.value) || 0 })}
                                        placeholder="e.g. 30"
                                        className="h-10 border-red-100 focus-visible:ring-red-200"
                                    />
                                    <p className="text-[11px] text-gray-400">Total inactive time before system forces a clock-out.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Break Management Card */}
                    <Card className="border-gray-200 shadow-sm overflow-hidden h-full">
                        <CardHeader className="bg-slate-50/50 border-bottom">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Coffee className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Break Management</CardTitle>
                                    <CardDescription>Control employee break durations</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-amber-50/30 rounded-xl border border-amber-100/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold text-gray-800">Enable Break Mode</Label>
                                    <p className="text-xs text-gray-500">Allow employees to take manual breaks</p>
                                </div>
                                <Switch
                                    checked={settings.break_enabled}
                                    onCheckedChange={(val) => setSettings({ ...settings, break_enabled: val })}
                                />
                            </div>

                            <div className={`space-y-4 transition-opacity duration-300 ${!settings.break_enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <Label className="text-sm font-medium">Maximum Break Time (Minutes)</Label>
                                    </div>
                                    <Input
                                        type="number"
                                        value={settings.max_break_minutes}
                                        onChange={(e) => setSettings({ ...settings, max_break_minutes: parseInt(e.target.value) || 0 })}
                                        placeholder="e.g. 60"
                                        className="h-10"
                                    />
                                    <p className="text-[11px] text-gray-400">Maximum allowed cumulative break time per shift.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Info */}
                {settings.updated_at && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Last Updated: {new Date(settings.updated_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="w-px h-3 bg-gray-200 hidden sm:block" />
                            <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                <span>Updated By: {settings.updated_by_name || 'Admin'}</span>
                            </div>
                        </div>
                        <div className="px-2 py-0.5 bg-gray-50 rounded text-[10px] font-medium border border-gray-100">
                            Settings version: {new Date(settings.updated_at).getTime()}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TrackingSettingsPage;
