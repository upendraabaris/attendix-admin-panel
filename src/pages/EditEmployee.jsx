import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ArrowLeft, Trash2 } from "lucide-react";
import api from "../hooks/useApi";

// 12-hour AM/PM UI helpers for Expected Clock-In Time. The DB/API value stays
// a 24-hour "HH:mm" string (or "" for not-set) — conversion happens only here.
const HOUR_12_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0")
);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
);

const getTwelveHourParts = (timeValue) => {
  if (!timeValue) return { hour12: "09", minute: "00", meridiem: "AM" };
  const [hourRaw = "09", minute = "00"] = String(timeValue).split(":");
  const parsedHour = Number.parseInt(hourRaw, 10);
  if (Number.isNaN(parsedHour)) return { hour12: "09", minute: "00", meridiem: "AM" };
  const meridiem = parsedHour >= 12 ? "PM" : "AM";
  const normalizedHour = parsedHour % 12 || 12;
  return {
    hour12: String(normalizedHour).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
    meridiem,
  };
};

const build24HourTime = (hour12, minute, meridiem) => {
  const parsedHour = Number.parseInt(hour12, 10);
  if (Number.isNaN(parsedHour)) return "";
  let hour24 = parsedHour % 12;
  if (meridiem === "PM") hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const EditEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    phone: "",
    address: "",
    startDate: "",
    status: "active",
    manager_id: "",
    expected_clock_in_time: "",
  });

  const [allEmployees, setAllEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await api.get(`/employee/getEmployeeById/${id}`);
        const employee = res.data;

        setFormData({
          name: employee.name || "",
          email: employee.email || "",
          role: employee.role || "",
          department: employee.department || "",
          phone: employee.phone || "",
          address: employee.address || "",
          startDate: employee.created_at?.split("T")[0] || "",
          status: employee.status || "active",
          manager_id: employee.manager_id ? String(employee.manager_id) : "",
          expected_clock_in_time: employee.expected_clock_in_time
            ? employee.expected_clock_in_time.slice(0, 5)
            : "",
        });
      } catch (err) {
        console.error("Error fetching employee:", err);
      }
    };

    const fetchAllEmployees = async () => {
    try {
    const res = await api.get("/employee/getEmployees");
    const employees = res.data?.data || [];
    setAllEmployees(
      employees.filter(
        (emp) => String(emp.id) !== String(id) && emp.status === "active"
      )
    );
    } catch (err) {
    console.error("Error fetching employees list:", err);
    }
  };

    fetchEmployee();
    fetchAllEmployees();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/employee/updateEmployee/${id}`, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        phone: formData.phone,
        address: formData.address,
        status: formData.status,
        manager_id: formData.manager_id ? Number(formData.manager_id) : null,
        expected_clock_in_time: formData.expected_clock_in_time || null,
      });
      toast.success("Team Member updated successfully");
      navigate("/employees");
    } catch (error) {
      console.error("Failed to update team member:", error);
      toast.error ("Failed to update team member. Please try again.");
    }
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this team member? This action cannot be undone."
      )
    ) {
      console.log("Deleting team member:", id);
      navigate("/employees");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExpectedClockInPartChange = (part, value) => {
    if (part === "hour12" && value === "none") {
      handleInputChange("expected_clock_in_time", "");
      return;
    }

    const current = getTwelveHourParts(formData.expected_clock_in_time);
    const next = { ...current, [part]: value };
    handleInputChange(
      "expected_clock_in_time",
      build24HourTime(next.hour12, next.minute, next.meridiem)
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/employees")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team Members
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="hr-specialist">HR Specialist</SelectItem>
                      <SelectItem value="Ecommerce Executive">Ecommerce Executive</SelectItem>
                      <SelectItem value="Content Creator">Content Creator</SelectItem>
                      <SelectItem value="Catalog Manager">Catalog Manager</SelectItem>
                      <SelectItem value="Amazon PPC Manager">Amazon PPC Manager</SelectItem>
                      <SelectItem value="Senior Account Manager">Senior Account Manager</SelectItem>
                      <SelectItem value="Social Media Manager">Social Media Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="Phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager">Reports To (Manager)</Label>
                  <Select
                    value={formData.manager_id || "none"}
                    onValueChange={(value) =>
                      handleInputChange("manager_id", value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Manager</SelectItem>
                      {allEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_clock_in_time">Expected Clock-In Time</Label>
                  {(() => {
                    const isSet = Boolean(formData.expected_clock_in_time);
                    const { hour12, minute, meridiem } = getTwelveHourParts(
                      formData.expected_clock_in_time
                    );
                    return (
                      <div className="flex gap-2">
                        <Select
                          value={isSet ? hour12 : "none"}
                          onValueChange={(value) =>
                            handleExpectedClockInPartChange("hour12", value)
                          }
                        >
                          <SelectTrigger id="expected_clock_in_time">
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not set</SelectItem>
                            {HOUR_12_OPTIONS.map((h) => (
                              <SelectItem key={h} value={h}>
                                {Number(h)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={minute}
                          disabled={!isSet}
                          onValueChange={(value) =>
                            handleExpectedClockInPartChange("minute", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Minute" />
                          </SelectTrigger>
                          <SelectContent>
                            {MINUTE_OPTIONS.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={meridiem}
                          disabled={!isSet}
                          onValueChange={(value) =>
                            handleExpectedClockInPartChange("meridiem", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="AM/PM" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/employees")}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="outline">
                  Update Team Member
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditEmployee;