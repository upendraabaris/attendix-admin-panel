import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
import api from "../hooks/useApi"; // ✅ Make sure this path is correct

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
  });

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
        });
      } catch (err) {
        console.error("Error fetching employee:", err);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Updating employee:", formData);
    navigate("/employees");
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this employee? This action cannot be undone."
      )
    ) {
      console.log("Deleting employee:", id);
      navigate("/employees");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/employees")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Employees
            </Button>
          </div>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Employee
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Employee</CardTitle>
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
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="hr-specialist">
                        HR Specialist
                      </SelectItem>
                      <SelectItem value="sales-rep">
                        Sales Representative
                      </SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Street address, city, state, zip code"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/employees")}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Employee</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditEmployee;
