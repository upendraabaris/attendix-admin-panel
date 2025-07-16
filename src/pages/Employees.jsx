import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import api from "../hooks/useApi";

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // const employees = [
  //   {
  //     id: 1,
  //     name: "Sarah Johnson",
  //     email: "sarah.johnson@company.com",
  //     role: "Manager",
  //     department: "Marketing",
  //     status: "active",
  //     avatar: "👩‍💼",
  //     joinDate: "2023-01-15",
  //   },
  //   {
  //     id: 2,
  //     name: "Michael Chen",
  //     email: "michael.chen@company.com",
  //     role: "Developer",
  //     department: "Engineering",
  //     status: "active",
  //     avatar: "👨‍💻",
  //     joinDate: "2023-02-20",
  //   },
  //   {
  //     id: 3,
  //     name: "Emily Davis",
  //     email: "emily.davis@company.com",
  //     role: "HR Specialist",
  //     department: "HR",
  //     status: "on-leave",
  //     avatar: "👩‍🏫",
  //     joinDate: "2022-11-10",
  //   },
  //   {
  //     id: 4,
  //     name: "James Wilson",
  //     email: "james.wilson@company.com",
  //     role: "Sales Rep",
  //     department: "Sales",
  //     status: "active",
  //     avatar: "👨‍💼",
  //     joinDate: "2023-03-05",
  //   },
  // ];

  const fetchList = async () => {
    try {
      const res = await api.get(
        `/employee/getEmployees`
        //     {
        //     headers:{
        //         Authorization: `Bearer ${user.token}`
        //     }
        //   }
      );
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching client list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      employee.role.toLowerCase().includes(roleFilter.toLowerCase());

    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "on-leave":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Employee Management
            </h1>
            <p className="text-gray-600">Manage your team members</p>
          </div>
          <Button
            onClick={() => navigate("/employees/add")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees?.map((employee) => (
            <Card
              key={employee.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/employees/${employee.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{employee.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {employee.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {employee.role} • {employee.department}
                    </p>

                    <div className="flex items-center justify-between mt-4">
                      <Badge className={getStatusColor(employee.status)}>
                        {employee?.status?.replace("-", " ")}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employees/edit/${employee.id}`);
                        }}
                      >
                        Edit
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Joined: {new Date(employee.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">
                No employees found matching your criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Employees;
