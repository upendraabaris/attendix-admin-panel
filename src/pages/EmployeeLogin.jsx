import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import api from "../hooks/useApi"; // Your custom API hook

const EmployeeLogin = () => {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Send OTP → 2: Verify → 3: Choose Org
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [organizations, setOrganizations] = useState([]); // ✅ for org list
  const [selectedOrg, setSelectedOrg] = useState(null); // ✅ chosen org

  const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN;

  // 🔹 Step 1 — Send OTP
  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const url = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&customerId=C-C5E4CE89F937427&flowType=SMS&mobileNumber=${phone}`;

      const res = await axios.post(
        url,
        {},
        {
          headers: {
            authToken: AUTH_TOKEN,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 200 && res.data.data?.verificationId) {
        setVerificationId(res.data.data.verificationId);
        setStep(2);
        setMessage("✅ OTP sent successfully!");
      } else {
        setMessage("❌ Failed to send OTP.");
      }
    } catch (err) {
      console.error("OTP Error:", err.response?.data || err);
      setMessage("❌ Failed to send OTP. Check number or API key.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Step 2 — Verify OTP + Fetch Organizations
  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const verifyUrl = `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${phone}&verificationId=${verificationId}&customerId=C-C5E4CE89F937427&code=${otp}`;

      const verifyRes = await axios.get(verifyUrl, {
        headers: {
          authToken: AUTH_TOKEN,
          "Content-Type": "application/json",
        },
      });

      if (
        verifyRes.status === 200 &&
        verifyRes.data?.data?.verificationStatus === "VERIFICATION_COMPLETED"
      ) {
        // ✅ OTP verified, now get organizations
        const orgRes = await api.post("auth/organizations-by-phone", {
          phone_number: phone,
        });

        if (orgRes.status === 200 && orgRes.data.data?.length > 0) {
          setOrganizations(orgRes.data.data);
          setStep(3); // ✅ Move to next step to choose org
          setMessage("✅ OTP verified! Please select your organization.");
        } else {
          setMessage("❌ No organization found for this number.");
        }
      } else {
        setMessage("❌ Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("OTP Verification Error:", err.response?.data || err);
      setMessage("❌ OTP verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Step 3 — Final Login with selected organization
  const handleLogin = async () => {
    if (!selectedOrg) {
      setMessage("⚠️ Please select an organization.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("auth/employee-login", {
        phone_number: phone,
        organization_id: selectedOrg.organization_id,
      });

      localStorage.setItem("employee_id", res.data.user.employee_id);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("employee_name", res.data.user.employee_name);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("orgID", String(selectedOrg.organization_id));

      setMessage("✅ Login successful!");
      setTimeout(() => navigate("/workspace"), 1000);
    } catch (err) {
      console.error("Login Error:", err.response?.data || err);
      setMessage("❌ Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4 text-blue-700">
          Employee Login (OTP)
        </h2>

        {/* STEP 1: Enter Mobile */}
        {step === 1 && (
          <form onSubmit={sendOtp}>
            <label className="block mb-2 text-gray-700 font-semibold">
              Mobile Number
            </label>
            <input
              type="tel"
              placeholder="Enter mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border p-2 rounded-lg mb-4"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={verifyOtp}>
            <label className="block mb-2 text-gray-700 font-semibold">
              Enter OTP
            </label>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border p-2 rounded-lg mb-4"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {/* STEP 3: Select Organization */}
        {step === 3 && (
          <div>
            <label className="block mb-2 text-gray-700 font-semibold">
              Select Organization
            </label>
            <ul className="border rounded-lg mb-4">
              {organizations.map((org) => (
                <li
                  key={org.organization_id}
                  onClick={() => setSelectedOrg(org)}
                  className={`p-2 cursor-pointer ${
                    selectedOrg?.organization_id === org.organization_id
                      ? "bg-blue-100 border-l-4 border-blue-600"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="font-semibold text-gray-800">
                    {org.organization_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Role: {org.role} | Emp ID: {org.employee_id}
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        )}

        {/* Message */}
        {message && (
          <p
            className={`text-center font-medium mt-4 ${
              message.includes("✅") ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        {/* Admin Link */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Prefer email/password?{" "}
          <Link
            to="/employee-login/web"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Employee Web Login
          </Link>
        </p>

        <p className="text-center text-sm text-gray-600 mt-2">
          Are you an admin?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Admin Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default EmployeeLogin;
