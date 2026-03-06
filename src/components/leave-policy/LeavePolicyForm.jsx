import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const LEAVE_TYPES = ["sick", "vacation", "personal", "other", "earned"];

const LeavePolicyForm = ({
  initialData,
  onSubmit,
  onCancel,
  submitting = false,
  mode = "create",
}) => {
  const [formData, setFormData] = useState({
    leave_type: "sick",
    yearly_limit: 0,
    is_enabled: true,
    earned_days_required: 20,
    earned_leave_award: 1,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        leave_type: initialData.leave_type || "sick",
        yearly_limit: Number(initialData.yearly_limit ?? 0),
        is_enabled: Boolean(initialData.is_enabled),
        earned_days_required: Number(initialData.earned_days_required ?? 20),
        earned_leave_award: Number(initialData.earned_leave_award ?? 1),
      });
    }
  }, [initialData]);

  const isEarned = formData.leave_type === "earned";

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      leave_type: formData.leave_type,
      yearly_limit: Number(formData.yearly_limit),
      is_enabled: Boolean(formData.is_enabled),
      earned_days_required: isEarned ? Number(formData.earned_days_required) : null,
      earned_leave_award: isEarned ? Number(formData.earned_leave_award) : null,
    };
    onSubmit(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "edit" ? "Edit Policy" : "Add Policy"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Leave Type</Label>
            <Select
              value={formData.leave_type}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, leave_type: value }))}
              disabled={mode === "edit"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Yearly Limit</Label>
            <Input
              type="number"
              min={0}
              value={formData.yearly_limit}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, yearly_limit: e.target.value }))
              }
              required
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between border rounded-lg px-3 py-2">
            <Label>Enabled</Label>
            <Switch
              checked={formData.is_enabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_enabled: checked }))
              }
            />
          </div>

          {isEarned && (
            <>
              <div>
                <Label>Earned Days Required</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.earned_days_required}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      earned_days_required: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label>Earned Leave Award</Label>
                <Input
                  type="number"
                  min={0.5}
                  step="0.5"
                  value={formData.earned_leave_award}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      earned_leave_award: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </>
          )}

          <div className="md:col-span-2 flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : mode === "edit" ? "Update Policy" : "Save Policy"}
            </Button>
            {mode === "edit" && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeavePolicyForm;
