import { io } from "socket.io-client";
import BASE_URL from "../config/apiConfig";

export const SOCKET_URL = BASE_URL.replace(/\/api\/?$/, "");

export const SOCKET_PATH = (() => {
  try {
    const parsedUrl = new URL(BASE_URL);
    const pathname = parsedUrl.pathname.replace(/\/$/, "");
    const apiBasePath = pathname.endsWith("/api") ? pathname : `${pathname}/api`;
    return `${apiBasePath}/socket.io`;
  } catch (_error) {
    return "/api/socket.io";
  }
})();

const attachSocketDebugLogs = (socket, label) => {
  socket.on("connect", () => {
    console.log(`[socket:${label}] connected`, {
      id: socket.id,
      url: SOCKET_URL,
      path: SOCKET_PATH,
      transport: socket.io.engine?.transport?.name,
    });
  });

  socket.on("disconnect", (reason) => {
    console.log(`[socket:${label}] disconnected`, { reason });
  });

  socket.on("connect_error", (error) => {
    console.error(`[socket:${label}] connect_error`, {
      message: error?.message,
      description: error?.description,
      context: error?.context,
      url: SOCKET_URL,
      path: SOCKET_PATH,
    });
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    console.log(`[socket:${label}] reconnect_attempt`, { attempt });
  });

  socket.io.on("reconnect", (attempt) => {
    console.log(`[socket:${label}] reconnected`, {
      attempt,
      transport: socket.io.engine?.transport?.name,
    });
  });
};

export const createAppSocket = (token, label) => {
  const socket = io(SOCKET_URL, {
    path: SOCKET_PATH,
    auth: token ? { token } : undefined,
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  attachSocketDebugLogs(socket, label);
  return socket;
};
