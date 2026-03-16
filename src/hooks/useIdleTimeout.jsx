import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in ms

const LAST_ACTIVE_KEY = "lastActiveTime";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

const clearAuthStorage = () => {
  [
    "token",
    "user",
    "isAuthenticated",
    "orgID",
    "role",
    "employee_id",
    "employee_name",
    LAST_ACTIVE_KEY,
  ].forEach((key) => localStorage.removeItem(key));
};

const useIdleTimeout = (timeout = IDLE_TIMEOUT) => {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const logout = useCallback(() => {
    clearAuthStorage();
    toast.warning("Your session has expired. Please log in again.");
    navigate("/login", { replace: true });
  }, [navigate]);

  const resetTimer = useCallback(() => {
    // Throttle localStorage writes to once every 10 seconds to avoid excessive I/O
    const now = Date.now();
    if (now - lastUpdateRef.current > 10_000) {
      localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      lastUpdateRef.current = now;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, timeout);
  }, [logout, timeout]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Handle "came back after idle" case: check stored timestamp on mount
    const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
    if (lastActive && Date.now() - parseInt(lastActive, 10) > timeout) {
      logout();
      return;
    }

    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true }),
    );
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [logout, resetTimer, timeout]);
};

export default useIdleTimeout;
