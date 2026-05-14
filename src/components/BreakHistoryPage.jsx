import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Coffee, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

const formatIST = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return {
        date: date.toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),

        time: date.toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        }),
    };
};

const BreakHistoryPage = () => {
    const { employeeId } = useParams();
    const [searchParams] = useSearchParams();
    const [breaks, setBreaks] = useState([]);
    const [loading, setLoading] = useState(true);

    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const empName = searchParams.get("name");

    const navigate = useNavigate();

    useEffect(() => {
        const fetchBreaks = async () => {
            try {
                const res = await api.get(`/break/history/${employeeId}?startDate=${startDate}&endDate=${endDate}`);
                setBreaks(res.data.data);
            } catch (error) {
                console.error("Error fetching breaks:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBreaks();
    }, [employeeId, startDate, endDate]);

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Coffee className="text-amber-500" /> Break History: {empName}
                    </h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Showing breaks from {startDate} to {endDate}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead>End Time</TableHead>
                                    <TableHead className="text-right">Duration (Mins)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {breaks.length > 0 ? (
                                    breaks.map((b) => (
                                        <TableRow key={b.id}>
                                            <TableCell>{b.break_date}</TableCell>
                                            <TableCell>{b.break_start_time}</TableCell>
                                            <TableCell>
                                                {b.is_active ? "Ongoing" : b.break_end_time ?? "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {b.duration_minutes || 0}m
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-slate-400">
                                            No breaks found in this range.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default BreakHistoryPage;
