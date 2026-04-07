import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { CalendarDays } from "lucide-react";

const HolidayManagementPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-indigo-600" />
            Holiday Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage organization holidays used in comp off calculations.
          </p>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Page Added</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            This page is now available from the side menu. We can add the holiday CRUD UI here next.
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default HolidayManagementPage;
