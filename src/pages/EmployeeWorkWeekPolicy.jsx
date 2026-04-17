import { useEffect, useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const EmployeeWorkWeekPolicy = () => {
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        setLoading(true);
        const policyRes = await api.get("/work-week-policy");
        setPolicy(policyRes?.data?.data || null);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load work week policy");
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, []);

  const selectedPolicy = useMemo(
    () => POLICY_OPTIONS.find((item) => item.value === policy?.policy_name) || null,
    [policy]
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-7 h-7 text-indigo-600" />
            Work Week Policy
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Your organization's weekly off rules are listed here.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading work week policy...</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                  Current Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPolicy ? (
                  <>
                    <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                      <p className="text-sm font-semibold text-gray-900">{selectedPolicy.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{selectedPolicy.description}</p>
                    </div>

                    {policy?.policy_name === "alternate_saturday_and_every_sunday_off" ? (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-xs uppercase font-semibold text-slate-500 mb-1">
                          Alternate Saturday Start Date
                        </p>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatDate(policy?.policy_start_date)}
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No work week policy has been configured yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeWorkWeekPolicy;
