import { useState } from "react";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import api from "../hooks/useApi"; // ✅ axios wrapper
import { toast } from "sonner";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match!");
      return;
    }

    try {
      // ✅ API call
      const res = await api.post(
        "/auth/change-password",
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ JWT token
          },
        }
      );

      toast.success(res.data.message || "Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(
        error.response?.data?.error || "Something went wrong. Please try again."
      );
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white shadow p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {/* <Button type="submit" className="w-full">
            Update Password
          </Button> */}
          {/* <Button
            type="submit"
            className="w-full cursor-pointer transition-all duration-200 
                       bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
          >
            Update Password
          </Button> */}
          <Button
            type="submit"
            className="w-full cursor-pointer transition-all duration-200 
             bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white"
          >
            Update Password
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default ChangePassword;
