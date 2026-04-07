import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ClipboardList } from "lucide-react";

const CompOffPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-indigo-600" />
            Compensation Leave
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Review comp off balance and employee compensation leave history.
          </p>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Page Added</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            This page is now available from the side menu. We can connect comp off APIs here next.
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CompOffPage;
