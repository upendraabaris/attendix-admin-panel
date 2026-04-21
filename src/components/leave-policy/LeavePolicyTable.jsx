import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const LeavePolicyTable = ({ policies = [], onEdit }) => {
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Leave Type</TableHead>
            <TableHead>Yearly Limit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Earned Rule</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.filter((policy) => policy.leave_type !== "vacation").map((policy) => (
            <TableRow key={`${policy.leave_type}-${policy.id || "new"}`}>
              <TableCell className="font-medium capitalize">{policy.leave_type}</TableCell>
              <TableCell>{policy.leave_type === "earned" ? 12 : policy.yearly_limit}</TableCell>
              <TableCell>
                <Badge className={policy.is_enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                  {policy.is_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </TableCell>
              <TableCell>
                {policy.leave_type === "earned"
                  ? "1 day/month; carry forward up to 24 days"
                  : policy.leave_type === "sick"
                  ? "Medical proof required if more than 2 consecutive days"
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onEdit(policy)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!policies.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500">
                No leave policies configured yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeavePolicyTable;
