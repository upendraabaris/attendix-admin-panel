// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import useIdleTimeout from "./hooks/useIdleTimeout";

const ProtectedRoute = ({ children }) => {
  useIdleTimeout();

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
