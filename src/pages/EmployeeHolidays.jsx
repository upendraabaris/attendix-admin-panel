import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";

import Layout from "../components/Layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import api from "../hooks/useApi";

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const EmployeeHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoading(true);
        const res = await api.get("/holidays");
        setHolidays(res?.data?.data || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to fetch holidays");
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-indigo-600" />
            Holiday
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Organization holidays are listed here.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading holidays...</p>
          </div>
        ) : holidays.length === 0 ? (
          <div className="rounded-lg border bg-white py-12 text-center text-sm text-gray-500">
            No holidays have been configured yet.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium text-gray-900">
                      {holiday.holiday_name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {formatDate(holiday.holiday_date)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 min-w-[240px]">
                      {holiday.description || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeHolidays;
