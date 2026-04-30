import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import api from "../hooks/useApi";

const RULE_BASED_TYPES = ["earned", "casual"];
const EARNED_LEAVE_YEARLY_LIMIT = 12;

const getSickDocumentRuleText = (documentDaysRequired) => {
  const proofDays = Number(documentDaysRequired ?? 0);

  if (!proofDays || proofDays <= 0) {
    return "No document required";
  }

  return `Medical proof required if more than ${proofDays} consecutive day${proofDays > 1 ? "s" : ""}`;
};

const EmployeeLeavePolicy = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/leave-policy");
        setPolicies(res?.data?.data || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to fetch leave policies");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  const visiblePolicies = policies.filter(
    (policy) => policy.leave_type,
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-7 h-7 text-indigo-600" />
            Leave Policy
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Your available leave types and yearly rules are listed here.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading leave policies...</p>
          </div>
        ) : visiblePolicies.length === 0 ? (
          <div className="rounded-lg border bg-white py-12 text-center text-sm text-gray-500">
            No leave policies have been configured yet.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Yearly Limit</TableHead>
                  {/* <TableHead>Status</TableHead> */}
                  <TableHead>Rule</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiblePolicies
                  .filter((policy) => policy.is_enabled) // sirf enabled policies show hongi
                  .map((policy) => {
                    const isRuleBased = RULE_BASED_TYPES.includes(policy.leave_type);

                    return (
                      <TableRow key={policy.id}>
                        <TableCell className="capitalize font-medium text-gray-900">
                          {policy.leave_type}
                        </TableCell>

                        <TableCell>
                          {isRuleBased ? "-" : policy.yearly_limit}
                        </TableCell>

                        {/* <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            Enabled
                          </Badge>
                        </TableCell> */}

                        <TableCell>
                          {
                            policy.leave_type === "sick"
                              ? getSickDocumentRuleText(policy.document_days_required)
                              : policy.leave_type === "compensation"
                                ? `Expires in ${policy.expire_limit || "?"} day(s)`
                                : isRuleBased
                                  ? `${policy.earned_days_required} days -> ${policy.earned_leave_award} leave${policy.leave_type === "casual" && policy.max_consecutive_days
                                    ? ` | Max ${policy.max_consecutive_days} consecutive days`
                                    : ""
                                  }`
                                  : "-"
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeLeavePolicy;
