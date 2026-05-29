// import { useEffect, useRef, useState } from "react";
// import { io } from "socket.io-client";
// import { toast } from "sonner";
// import {
//   Download,
//   MessageSquare,
//   Paperclip,
//   Search,
//   Send,
//   ShieldCheck,
//   User,
// } from "lucide-react";

// import Layout from "../components/Layout";
// import api from "../hooks/useApi";
// import BASE_URL from "../config/apiConfig";

// const SOCKET_URL = BASE_URL.replace(/\/api\/?$/, "");

// const getTimeLabel = (value) => {
//   if (!value) {
//     return "";
//   }

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) {
//     return "";
//   }

//   return date.toLocaleTimeString("en-IN", {
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   });
// };

// const getDateLabel = (value) => {
//   if (!value) {
//     return "";
//   }

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) {
//     return "";
//   }

//   return date.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//   });
// };

// const getSortValue = (conversation) =>
//   new Date(
//     conversation?.last_message_created_at ||
//       conversation?.last_message_at ||
//       conversation?.updated_at ||
//       conversation?.created_at ||
//       0
//   ).getTime();

// const sortConversations = (items = []) =>
//   [...items].sort((a, b) => getSortValue(b) - getSortValue(a));

// const upsertConversation = (items, nextConversation) => {
//   const filtered = items.filter((item) => Number(item.id) !== Number(nextConversation.id));
//   return sortConversations([nextConversation, ...filtered]);
// };

// const upsertMessage = (items, nextMessage) => {
//   const exists = items.some((item) => Number(item.id) === Number(nextMessage.id));
//   if (exists) {
//     return items;
//   }

//   return [...items, nextMessage];
// };

// const Chat = () => {
//   const role = String(localStorage.getItem("role") || "").toLowerCase();
//   const employeeId = Number(localStorage.getItem("employee_id") || 0);
//   const isSupportRole = role.includes("support");

//   const [contacts, setContacts] = useState([]);
//   const [conversations, setConversations] = useState([]);
//   const [selectedConversation, setSelectedConversation] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [search, setSearch] = useState("");
//   const [draft, setDraft] = useState("");
//   const [attachment, setAttachment] = useState(null);
//   const [loadingSidebar, setLoadingSidebar] = useState(true);
//   const [loadingMessages, setLoadingMessages] = useState(false);
//   const [sendingMessage, setSendingMessage] = useState(false);

//   const socketRef = useRef(null);
//   const selectedConversationIdRef = useRef(null);
//   const fileInputRef = useRef(null);
//   const bottomRef = useRef(null);

//   useEffect(() => {
//     selectedConversationIdRef.current = selectedConversation?.id || null;
//   }, [selectedConversation]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const loadSidebarData = async () => {
//     setLoadingSidebar(true);

//     try {
//       const [contactsRes, conversationsRes] = await Promise.all([
//         api.get("/chat/contacts"),
//         api.get("/chat/conversations"),
//       ]);

//       const nextContacts = contactsRes.data?.data || [];
//       const nextConversations = sortConversations(conversationsRes.data?.data || []);

//       setContacts(nextContacts);
//       setConversations(nextConversations);

//       if (!selectedConversationIdRef.current && nextConversations.length > 0) {
//         await openConversation(nextConversations[0]);
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to load chats");
//     } finally {
//       setLoadingSidebar(false);
//     }
//   };

//   const openConversation = async (conversation) => {
//     if (!conversation?.id) {
//       return;
//     }

//     setSelectedConversation(conversation);
//     setLoadingMessages(true);

//     try {
//       const res = await api.get(`/chat/conversations/${conversation.id}/messages`);
//       setMessages(res.data?.data || []);
//       socketRef.current?.emit("chat:join", { conversationId: conversation.id });
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to load messages");
//     } finally {
//       setLoadingMessages(false);
//     }
//   };

//   useEffect(() => {
//     if (isSupportRole) {
//       setLoadingSidebar(false);
//       return undefined;
//     }

//     loadSidebarData();

//     const token = localStorage.getItem("token");
//     const socket = io(SOCKET_URL, {
//       auth: { token },
//       transports: ["websocket", "polling"],
//     });

//     socketRef.current = socket;

//     socket.on("chat:conversation:updated", (conversation) => {
//       setConversations((current) => upsertConversation(current, conversation));

//       if (Number(selectedConversationIdRef.current) === Number(conversation?.id)) {
//         setSelectedConversation((current) =>
//           current && Number(current.id) === Number(conversation.id)
//             ? { ...current, ...conversation }
//             : current
//         );
//       }
//     });

//     socket.on("chat:message:new", ({ conversation, message }) => {
//       if (conversation) {
//         setConversations((current) => upsertConversation(current, conversation));
//       }

//       if (Number(selectedConversationIdRef.current) === Number(message?.conversation_id)) {
//         setMessages((current) => upsertMessage(current, message));
//       }
//     });

//     return () => {
//       socket.disconnect();
//       socketRef.current = null;
//     };
//   }, []);

//   const filteredContacts = contacts.filter((contact) => {
//     const term = search.trim().toLowerCase();
//     if (!term) {
//       return true;
//     }

//     return (
//       String(contact.name || "").toLowerCase().includes(term) ||
//       String(contact.role || "").toLowerCase().includes(term)
//     );
//   });

//   const filteredConversations = conversations.filter((conversation) => {
//     const term = search.trim().toLowerCase();
//     if (!term) {
//       return true;
//     }

//     return (
//       String(conversation.other_employee_name || "").toLowerCase().includes(term) ||
//       String(conversation.last_message_text || "").toLowerCase().includes(term)
//     );
//   });

//   const startConversation = async (contact) => {
//     try {
//       const existingConversation = conversations.find(
//         (item) => Number(item.other_employee_id) === Number(contact.employee_id)
//       );

//       if (existingConversation) {
//         await openConversation(existingConversation);
//         return;
//       }

//       const res = await api.post("/chat/conversations", {
//         participant_employee_id: contact.employee_id,
//       });

//       const conversation = res.data?.data;
//       if (!conversation) {
//         return;
//       }

//       setConversations((current) => upsertConversation(current, conversation));
//       await openConversation(conversation);
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to start chat");
//     }
//   };

//   const handleSendMessage = async (event) => {
//     event.preventDefault();

//     if (!selectedConversation?.id || (!draft.trim() && !attachment)) {
//       return;
//     }

//     const formData = new FormData();
//     if (draft.trim()) {
//       formData.append("message", draft.trim());
//     }
//     if (attachment) {
//       formData.append("attachment", attachment);
//     }

//     setSendingMessage(true);

//     try {
//       await api.post(
//         `/chat/conversations/${selectedConversation.id}/messages`,
//         formData
//       );
//       setDraft("");
//       setAttachment(null);
//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to send message");
//     } finally {
//       setSendingMessage(false);
//     }
//   };

//   if (isSupportRole) {
//     return (
//       <Layout>
//         <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
//           <h1 className="text-2xl font-semibold text-slate-900">Chat</h1>
//           <p className="mt-3 max-w-2xl text-sm text-slate-500">
//             Chat is currently available for employees and organization admins only.
//           </p>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div className="grid gap-6 lg:grid-cols-[360px,minmax(0,1fr)]">
//         <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
//           <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_65%,#ffffff_100%)] px-5 py-5">
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
//                   Team Chat
//                 </p>
//                 <h1 className="mt-2 text-2xl font-semibold text-slate-900">
//                   Messages
//                 </h1>
//                 <p className="mt-1 text-sm text-slate-500">
//                   Employees and admins can talk here and share documents instantly.
//                 </p>
//               </div>
//               <div className="rounded-2xl border border-sky-100 bg-white/80 px-3 py-2 text-right shadow-sm">
//                 <p className="text-xs text-slate-400">Active profile</p>
//                 <p className="text-sm font-semibold capitalize text-slate-700">{role}</p>
//               </div>
//             </div>

//             <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
//               <Search className="h-4 w-4 text-slate-400" />
//               <input
//                 value={search}
//                 onChange={(event) => setSearch(event.target.value)}
//                 placeholder="Search people or chats"
//                 className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
//               />
//             </div>
//           </div>

//           <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-4 py-4">
//             <div>
//               <div className="mb-3 flex items-center justify-between px-1">
//                 <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
//                   Recent Chats
//                 </h2>
//                 <span className="text-xs text-slate-400">{filteredConversations.length}</span>
//               </div>

//               {loadingSidebar ? (
//                 <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-400">
//                   Loading conversations...
//                 </p>
//               ) : filteredConversations.length === 0 ? (
//                 <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-400">
//                   No chats yet. Start with someone below.
//                 </p>
//               ) : (
//                 <div className="space-y-2">
//                   {filteredConversations.map((conversation) => {
//                     const isSelected =
//                       Number(selectedConversation?.id) === Number(conversation.id);

//                     return (
//                       <button
//                         key={conversation.id}
//                         onClick={() => openConversation(conversation)}
//                         className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
//                           isSelected
//                             ? "border-sky-300 bg-sky-50 shadow-sm"
//                             : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
//                         }`}
//                       >
//                         <div className="flex items-start justify-between gap-3">
//                           <div className="min-w-0">
//                             <div className="flex items-center gap-2">
//                               <p className="truncate text-sm font-semibold text-slate-800">
//                                 {conversation.other_employee_name || "Direct chat"}
//                               </p>
//                               {String(conversation.other_employee_role || "").includes("admin") ? (
//                                 <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
//                                   Admin
//                                 </span>
//                               ) : null}
//                             </div>
//                             <p className="mt-1 truncate text-xs text-slate-500">
//                               {conversation.last_message_text ||
//                                 conversation.last_message_attachment_name ||
//                                 "No messages yet"}
//                             </p>
//                           </div>
//                           <span className="shrink-0 text-[11px] text-slate-400">
//                             {getTimeLabel(
//                               conversation.last_message_created_at || conversation.updated_at
//                             ) || getDateLabel(conversation.created_at)}
//                           </span>
//                         </div>
//                       </button>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>

//             <div className="mt-6">
//               <div className="mb-3 flex items-center justify-between px-1">
//                 <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
//                   Start New
//                 </h2>
//                 <span className="text-xs text-slate-400">{filteredContacts.length}</span>
//               </div>

//               <div className="space-y-2">
//                 {filteredContacts.map((contact) => (
//                   <button
//                     key={contact.employee_id}
//                     onClick={() => startConversation(contact)}
//                     className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white"
//                   >
//                     <div className="min-w-0">
//                       <div className="flex items-center gap-2">
//                         <p className="truncate text-sm font-medium text-slate-800">
//                           {contact.name}
//                         </p>
//                         {String(contact.role || "").includes("admin") ? (
//                           <ShieldCheck className="h-4 w-4 text-amber-500" />
//                         ) : (
//                           <User className="h-4 w-4 text-slate-400" />
//                         )}
//                       </div>
//                       <p className="mt-1 text-xs capitalize text-slate-500">
//                         {contact.role}
//                       </p>
//                     </div>
//                     <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
//                       Message
//                     </span>
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </section>

//         <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
//           {selectedConversation ? (
//             <>
//               <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5">
//                 <div className="flex items-center justify-between gap-4">
//                   <div>
//                     <h2 className="text-xl font-semibold text-slate-900">
//                       {selectedConversation.other_employee_name || "Direct chat"}
//                     </h2>
//                     <p className="mt-1 text-sm capitalize text-slate-500">
//                       {selectedConversation.other_employee_role || "employee"}
//                     </p>
//                   </div>
//                   <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
//                     <p className="text-xs text-slate-400">Shared space</p>
//                     <p className="text-sm font-semibold text-slate-700">Private direct chat</p>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex h-[calc(100vh-16rem)] flex-col">
//                 <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.08),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-6">
//                   {loadingMessages ? (
//                     <p className="text-sm text-slate-400">Loading messages...</p>
//                   ) : messages.length === 0 ? (
//                     <div className="flex h-full items-center justify-center">
//                       <div className="max-w-sm rounded-3xl border border-dashed border-slate-200 bg-white/80 px-6 py-8 text-center shadow-sm">
//                         <MessageSquare className="mx-auto h-10 w-10 text-sky-500" />
//                         <p className="mt-4 text-lg font-semibold text-slate-800">
//                           Start the conversation
//                         </p>
//                         <p className="mt-2 text-sm text-slate-500">
//                           Send a message or attach a document to begin this thread.
//                         </p>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="space-y-4">
//                       {messages.map((message) => {
//                         const isMine =
//                           Number(message.sender_employee_id) === Number(employeeId);

//                         return (
//                           <div
//                             key={message.id}
//                             className={`flex ${isMine ? "justify-end" : "justify-start"}`}
//                           >
//                             <div
//                               className={`max-w-[75%] rounded-[24px] px-4 py-3 shadow-sm ${
//                                 isMine
//                                   ? "bg-sky-600 text-white"
//                                   : "border border-slate-200 bg-white text-slate-800"
//                               }`}
//                             >
//                               <div className="mb-1 flex items-center justify-between gap-4">
//                                 <p
//                                   className={`text-xs font-semibold ${
//                                     isMine ? "text-sky-100" : "text-slate-500"
//                                   }`}
//                                 >
//                                   {message.sender_name}
//                                 </p>
//                                 <span
//                                   className={`text-[11px] ${
//                                     isMine ? "text-sky-100/90" : "text-slate-400"
//                                   }`}
//                                 >
//                                   {getTimeLabel(message.created_at)}
//                                 </span>
//                               </div>

//                               {message.message ? (
//                                 <p className="whitespace-pre-wrap text-sm leading-6">
//                                   {message.message}
//                                 </p>
//                               ) : null}

//                               {message.attachment_url ? (
//                                 <a
//                                   href={message.attachment_url}
//                                   target="_blank"
//                                   rel="noreferrer"
//                                   className={`mt-3 flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm ${
//                                     isMine
//                                       ? "bg-sky-500/50 text-white"
//                                       : "bg-slate-50 text-slate-700"
//                                   }`}
//                                 >
//                                   <div className="min-w-0">
//                                     <p className="truncate font-medium">
//                                       {message.attachment_name || "Shared document"}
//                                     </p>
//                                     <p
//                                       className={`text-xs ${
//                                         isMine ? "text-sky-100" : "text-slate-400"
//                                       }`}
//                                     >
//                                       {message.attachment_mime_type || "Attachment"}
//                                     </p>
//                                   </div>
//                                   <Download className="h-4 w-4 shrink-0" />
//                                 </a>
//                               ) : null}
//                             </div>
//                           </div>
//                         );
//                       })}
//                       <div ref={bottomRef} />
//                     </div>
//                   )}
//                 </div>

//                 <form
//                   onSubmit={handleSendMessage}
//                   className="border-t border-slate-100 bg-white px-5 py-4"
//                 >
//                   {attachment ? (
//                     <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
//                       <div className="min-w-0">
//                         <p className="truncate text-sm font-medium text-slate-700">
//                           {attachment.name}
//                         </p>
//                         <p className="text-xs text-slate-400">
//                           {(attachment.size / 1024 / 1024).toFixed(2)} MB
//                         </p>
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => {
//                           setAttachment(null);
//                           if (fileInputRef.current) {
//                             fileInputRef.current.value = "";
//                           }
//                         }}
//                         className="text-xs font-medium text-rose-500"
//                       >
//                         Remove
//                       </button>
//                     </div>
//                   ) : null}

//                   <div className="flex items-end gap-3">
//                     <button
//                       type="button"
//                       onClick={() => fileInputRef.current?.click()}
//                       className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-300 hover:bg-white"
//                     >
//                       <Paperclip className="h-4 w-4" />
//                     </button>

//                     <input
//                       ref={fileInputRef}
//                       type="file"
//                       className="hidden"
//                       onChange={(event) => setAttachment(event.target.files?.[0] || null)}
//                     />

//                     <div className="flex-1 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner">
//                       <textarea
//                         value={draft}
//                         onChange={(event) => setDraft(event.target.value)}
//                         rows={3}
//                         placeholder="Type your message here..."
//                         className="w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
//                       />
//                     </div>

//                     <button
//                       type="submit"
//                       disabled={sendingMessage || (!draft.trim() && !attachment)}
//                       className="inline-flex h-12 items-center gap-2 rounded-2xl bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
//                     >
//                       <Send className="h-4 w-4" />
//                       {sendingMessage ? "Sending" : "Send"}
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </>
//           ) : (
//             <div className="flex h-[calc(100vh-16rem)] items-center justify-center bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_45%,#f8fafc_100%)] p-8">
//               <div className="max-w-md rounded-[32px] border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
//                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-sky-600">
//                   <MessageSquare className="h-8 w-8" />
//                 </div>
//                 <h2 className="mt-5 text-2xl font-semibold text-slate-900">
//                   Choose a conversation
//                 </h2>
//                 <p className="mt-3 text-sm leading-6 text-slate-500">
//                   Pick an existing chat or start a new one with an employee or admin from your organization.
//                 </p>
//               </div>
//             </div>
//           )}
//         </section>
//       </div>
//     </Layout>
//   );
// };

// export default Chat;

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import {
  Download,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  User,
  X,
  ChevronRight,
  Clock,
} from "lucide-react";

import Layout from "../components/Layout";
import api from "../hooks/useApi";
import BASE_URL from "../config/apiConfig";

const SOCKET_URL = BASE_URL.replace(/\/api\/?$/, "");
const CHAT_UNREAD_STORAGE_KEY = "chat_unread_counts";
const CHAT_ACTIVE_CONVERSATION_KEY = "chat_active_conversation_id";
const CHAT_UNREAD_EVENT = "chat-unread-updated";

const getTimeLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
};

const getDateLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const diff = today.setHours(0,0,0,0) - date.setHours(0,0,0,0);
  if (diff === 0) return "Today";
  if (diff === 86400000) return "Yesterday";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const getSortValue = (c) =>
  new Date(c?.last_message_created_at || c?.last_message_at || c?.updated_at || c?.created_at || 0).getTime();

const sortConversations = (items = []) => [...items].sort((a, b) => getSortValue(b) - getSortValue(a));

const upsertConversation = (items, next) => {
  const filtered = items.filter((i) => Number(i.id) !== Number(next.id));
  return sortConversations([next, ...filtered]);
};

const upsertMessage = (items, next) => {
  if (items.some((i) => Number(i.id) === Number(next.id))) return items;
  return [...items, next];
};

const readUnreadMap = () => {
  try {
    const rawValue = localStorage.getItem(CHAT_UNREAD_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : {};
  } catch (_error) {
    return {};
  }
};

const writeUnreadMap = (nextUnreadMap) => {
  localStorage.setItem(CHAT_UNREAD_STORAGE_KEY, JSON.stringify(nextUnreadMap));
  window.dispatchEvent(new CustomEvent(CHAT_UNREAD_EVENT));
};

const getInitials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

const avatarColors = [
  ["#dbeafe", "#2563eb"], ["#dcfce7", "#16a34a"], ["#fef9c3", "#ca8a04"],
  ["#fce7f3", "#db2777"], ["#ede9fe", "#7c3aed"], ["#ffedd5", "#ea580c"],
];
const getAvatarColor = (name = "") => avatarColors[name.charCodeAt(0) % avatarColors.length] || avatarColors[0];

const Avatar = ({ name, size = 40, isAdmin }) => {
  const [bg, fg] = getAvatarColor(name);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: bg, color: fg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
        border: isAdmin ? "2px solid #f59e0b" : "2px solid transparent",
        position: "relative",
      }}
    >
      {getInitials(name)}
      {isAdmin && (
        <span style={{
          position: "absolute", bottom: -3, right: -3,
          background: "#f59e0b", borderRadius: "50%",
          width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ShieldCheck size={9} color="#fff" />
        </span>
      )}
    </div>
  );
};

export default function Chat() {
  const role = String(localStorage.getItem("role") || "").toLowerCase();
  const employeeId = Number(localStorage.getItem("employee_id") || 0);
  const isSupportRole = role.includes("support");

  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "contacts"
  const [unreadMap, setUnreadMap] = useState(() => readUnreadMap());

  const socketRef = useRef(null);
  const selectedConversationIdRef = useRef(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { selectedConversationIdRef.current = selectedConversation?.id || null; }, [selectedConversation]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const syncUnreadMap = () => {
      setUnreadMap(readUnreadMap());
    };

    syncUnreadMap();
    window.addEventListener(CHAT_UNREAD_EVENT, syncUnreadMap);
    window.addEventListener("storage", syncUnreadMap);

    return () => {
      window.removeEventListener(CHAT_UNREAD_EVENT, syncUnreadMap);
      window.removeEventListener("storage", syncUnreadMap);
    };
  }, []);

  useEffect(() => {
    const conversationId = selectedConversation?.id
      ? String(selectedConversation.id)
      : "";

    if (conversationId) {
      localStorage.setItem(CHAT_ACTIVE_CONVERSATION_KEY, conversationId);
    } else {
      localStorage.removeItem(CHAT_ACTIVE_CONVERSATION_KEY);
    }

    return () => {
      localStorage.removeItem(CHAT_ACTIVE_CONVERSATION_KEY);
    };
  }, [selectedConversation?.id]);

  const markConversationAsRead = (conversationId) => {
    if (!conversationId) return;

    const nextUnreadMap = { ...readUnreadMap() };
    if (!nextUnreadMap[conversationId]) return;

    delete nextUnreadMap[conversationId];
    writeUnreadMap(nextUnreadMap);
  };

  const loadSidebarData = async () => {
    setLoadingSidebar(true);
    try {
      const [contactsRes, conversationsRes] = await Promise.all([
        api.get("/chat/contacts"),
        api.get("/chat/conversations"),
      ]);
      const nextContacts = contactsRes.data?.data || [];
      const nextConversations = sortConversations(conversationsRes.data?.data || []);
      setContacts(nextContacts);
      setConversations(nextConversations);
      if (!selectedConversationIdRef.current && nextConversations.length > 0) {
        await openConversation(nextConversations[0]);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load chats");
    } finally {
      setLoadingSidebar(false);
    }
  };

  const openConversation = async (conversation) => {
    if (!conversation?.id) return;
    markConversationAsRead(conversation.id);
    setSelectedConversation(conversation);
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/conversations/${conversation.id}/messages`);
      setMessages(res.data?.data || []);
      socketRef.current?.emit("chat:join", { conversationId: conversation.id });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isSupportRole) { setLoadingSidebar(false); return; }
    loadSidebarData();
    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("chat:conversation:updated", (conv) => {
      setConversations((cur) => upsertConversation(cur, conv));
      if (Number(selectedConversationIdRef.current) === Number(conv?.id)) {
        setSelectedConversation((cur) => cur && Number(cur.id) === Number(conv.id) ? { ...cur, ...conv } : cur);
      }
    });

    socket.on("chat:message:new", ({ conversation, message }) => {
      if (conversation) setConversations((cur) => upsertConversation(cur, conversation));
      if (Number(selectedConversationIdRef.current) === Number(message?.conversation_id)) {
        setMessages((cur) => upsertMessage(cur, message));
      }
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  const filteredContacts = contacts.filter((c) => {
    const term = search.trim().toLowerCase();
    return !term || String(c.name || "").toLowerCase().includes(term) || String(c.role || "").toLowerCase().includes(term);
  });

  const filteredConversations = conversations.filter((c) => {
    const term = search.trim().toLowerCase();
    return !term ||
      String(c.other_employee_name || "").toLowerCase().includes(term) ||
      String(c.last_message_text || "").toLowerCase().includes(term);
  });

  const startConversation = async (contact) => {
    try {
      const existing = conversations.find((i) => Number(i.other_employee_id) === Number(contact.employee_id));
      if (existing) { await openConversation(existing); setActiveTab("chats"); return; }
      const res = await api.post("/chat/conversations", { participant_employee_id: contact.employee_id });
      const conv = res.data?.data;
      if (!conv) return;
      setConversations((cur) => upsertConversation(cur, conv));
      await openConversation(conv);
      setActiveTab("chats");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start chat");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedConversation?.id || (!draft.trim() && !attachment)) return;
    const formData = new FormData();
    if (draft.trim()) formData.append("message", draft.trim());
    if (attachment) formData.append("attachment", attachment);
    setSendingMessage(true);
    try {
      await api.post(`/chat/conversations/${selectedConversation.id}/messages`, formData);
      setDraft("");
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
  };

  if (isSupportRole) {
    return (
      <Layout>
        <div style={styles.card}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>Chat</h1>
          <p style={{ marginTop: 10, color: "#64748b", fontSize: 14 }}>
            Chat is available for employees and organization admins only.
          </p>
        </div>
      </Layout>
    );
  }

  const isAdmin = (r) => String(r || "").toLowerCase().includes("admin");

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .chat-root { font-family: 'Outfit', sans-serif; display: flex; height: calc(100vh - 80px); gap: 0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 40px rgba(0,0,0,0.10); border: 1px solid #e2e8f0; background: #fff; }
        .sidebar { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; background: #f8fafc; border-right: 1px solid #e2e8f0; }
        .sidebar-header { padding: 20px 18px 14px; background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: #fff; }
        .sidebar-title { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
        .sidebar-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .search-bar { margin: 12px 16px 0; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 12px; padding: 9px 14px; }
        .search-bar input { background: transparent; border: none; outline: none; color: #fff; font-size: 13.5px; width: 100%; font-family: 'Outfit', sans-serif; }
        .search-bar input::placeholder { color: #94a3b8; }
        .tab-bar { display: flex; margin: 14px 16px 0; background: #e2e8f0; border-radius: 10px; padding: 3px; }
        .tab-btn { flex: 1; padding: 7px 0; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.18s; background: transparent; color: #64748b; font-family: 'Outfit', sans-serif; }
        .tab-btn.active { background: #fff; color: #0f172a; box-shadow: 0 1px 6px rgba(0,0,0,0.10); }
        .sidebar-list { flex: 1; overflow-y: auto; padding: 10px 10px 16px; }
        .sidebar-list::-webkit-scrollbar { width: 4px; }
        .sidebar-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .conv-item { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 14px; cursor: pointer; transition: background 0.15s; margin-bottom: 3px; border: 1.5px solid transparent; }
        .conv-item:hover { background: #eff6ff; border-color: #bfdbfe; }
        .conv-item.active { background: #eff6ff; border-color: #93c5fd; box-shadow: 0 2px 10px rgba(59,130,246,0.10); }
        .conv-info { flex: 1; min-width: 0; }
        .conv-name { font-size: 14px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-preview { font-size: 12px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
        .conv-time { font-size: 11px; color: #94a3b8; white-space: nowrap; margin-left: auto; padding-left: 6px; }
        .contact-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; cursor: pointer; transition: background 0.15s; margin-bottom: 3px; border: 1.5px solid transparent; }
        .contact-item:hover { background: #f1f5f9; border-color: #e2e8f0; }
        .contact-name { font-size: 14px; font-weight: 600; color: #1e293b; }
        .contact-role { font-size: 12px; color: #94a3b8; text-transform: capitalize; margin-top: 2px; }
        .msg-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .chat-header { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 14px; background: #fff; }
        .chat-header-info { flex: 1; min-width: 0; }
        .chat-header-name { font-size: 17px; font-weight: 700; color: #0f172a; }
        .chat-header-role { font-size: 12.5px; color: #64748b; text-transform: capitalize; margin-top: 1px; }
        .messages-wrap { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; }
        .messages-wrap::-webkit-scrollbar { width: 4px; }
        .messages-wrap::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .msg-row { display: flex; align-items: flex-end; gap: 8px; }
        .msg-row.mine { flex-direction: row-reverse; }
        .msg-bubble { max-width: 68%; padding: 10px 14px; border-radius: 18px; font-size: 14px; line-height: 1.55; }
        .msg-bubble.mine { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border-bottom-right-radius: 5px; }
        .msg-bubble.theirs { background: #fff; color: #1e293b; border: 1px solid #e2e8f0; border-bottom-left-radius: 5px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .msg-sender { font-size: 11px; font-weight: 600; margin-bottom: 3px; }
        .msg-time { font-size: 10.5px; margin-top: 5px; text-align: right; }
        .msg-bubble.mine .msg-time { color: rgba(255,255,255,0.65); }
        .msg-bubble.theirs .msg-time { color: #94a3b8; }
        .attach-chip { display: flex; align-items: center; gap: 10px; border-radius: 12px; padding: 8px 12px; margin-top: 8px; text-decoration: none; }
        .attach-chip.mine { background: rgba(255,255,255,0.18); color: #fff; }
        .attach-chip.theirs { background: #f1f5f9; color: #334155; }
        .compose-bar { border-top: 1px solid #f1f5f9; background: #fff; padding: 14px 18px; }
        .attachment-preview { display: flex; align-items: center; justify-content: space-between; background: #f1f5f9; border-radius: 12px; padding: 8px 14px; margin-bottom: 10px; }
        .attachment-preview-name { font-size: 13px; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .attachment-preview-size { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .compose-row { display: flex; align-items: flex-end; gap: 10px; }
        .icon-btn { width: 44px; height: 44px; border-radius: 13px; border: 1.5px solid #e2e8f0; background: #f8fafc; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.15s; color: #64748b; }
        .icon-btn:hover { background: #eff6ff; border-color: #93c5fd; color: #2563eb; }
        .textarea-wrap { flex: 1; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 10px 14px; transition: border-color 0.15s; }
        .textarea-wrap:focus-within { border-color: #93c5fd; background: #fff; }
        .textarea-wrap textarea { width: 100%; background: transparent; border: none; outline: none; resize: none; font-size: 14px; color: #1e293b; line-height: 1.5; font-family: 'Outfit', sans-serif; max-height: 120px; }
        .textarea-wrap textarea::placeholder { color: #94a3b8; }
        .send-btn { height: 44px; padding: 0 20px; border-radius: 13px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: none; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: all 0.15s; flex-shrink: 0; font-family: 'Outfit', sans-serif; }
        .send-btn:hover { background: linear-gradient(135deg, #1d4ed8, #1e40af); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,0.35); }
        .send-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
        .empty-state { flex: 1; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
        .empty-card { text-align: center; padding: 48px 36px; background: #fff; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .empty-icon { width: 72px; height: 72px; border-radius: 20px; background: #eff6ff; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
        .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; padding: 8px 4px 6px; }
        .date-divider { text-align: center; font-size: 11.5px; color: #94a3b8; font-weight: 600; margin: 8px 0; }
        .badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
        .badge-admin { background: #fef3c7; color: #92400e; }
        .online-dot { width: 10px; height: 10px; background: #22c55e; border-radius: 50%; border: 2px solid #fff; position: absolute; bottom: 1px; right: 1px; }
      `}</style>

      <div className="chat-root">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="sidebar-title">Messages</div>
                <div className="sidebar-sub">Team Chat · {role}</div>
              </div>
              <MessageSquare size={22} color="#60a5fa" />
            </div>
            <div className="search-bar">
              <Search size={15} color="#94a3b8" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people or chats…"
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  <X size={14} color="#94a3b8" />
                </button>
              )}
            </div>
          </div>

          <div className="tab-bar">
            <button className={`tab-btn ${activeTab === "chats" ? "active" : ""}`} onClick={() => setActiveTab("chats")}>
              Chats {filteredConversations.length > 0 && `(${filteredConversations.length})`}
            </button>
            <button className={`tab-btn ${activeTab === "contacts" ? "active" : ""}`} onClick={() => setActiveTab("contacts")}>
              Contacts {filteredContacts.length > 0 && `(${filteredContacts.length})`}
            </button>
          </div>

          <div className="sidebar-list">
            {activeTab === "chats" ? (
              loadingSidebar ? (
                <div style={{ padding: "24px 8px", color: "#94a3b8", fontSize: 13, textAlign: "center" }}>Loading chats…</div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ padding: "24px 8px", color: "#94a3b8", fontSize: 13, textAlign: "center", lineHeight: 1.6 }}>
                  No chats yet.<br />Go to Contacts to start one.
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const selected = Number(selectedConversation?.id) === Number(conv.id);
                  const admin = isAdmin(conv.other_employee_role);
                  const timeStr = getTimeLabel(conv.last_message_created_at || conv.updated_at) || getDateLabel(conv.created_at);
                  const unreadCount = Number(unreadMap?.[conv.id] || 0);
                  return (
                    <div
                      key={conv.id}
                      className={`conv-item ${selected ? "active" : ""}`}
                      style={
                        unreadCount > 0 && !selected
                          ? { background: "#f0fdf4", borderColor: "#86efac" }
                          : undefined
                      }
                      onClick={() => openConversation(conv)}
                    >
                      <Avatar name={conv.other_employee_name || "?"} size={42} isAdmin={admin} />
                      <div className="conv-info">
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="conv-name">{conv.other_employee_name || "Direct chat"}</span>
                          {admin && <span className="badge badge-admin">Admin</span>}
                          {unreadCount > 0 && !selected ? (
                            <span
                              style={{
                                marginLeft: 4,
                                minWidth: 18,
                                height: 18,
                                borderRadius: 999,
                                background: "#16a34a",
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 6px",
                              }}
                            >
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <div
                          className="conv-preview"
                          style={
                            unreadCount > 0 && !selected
                              ? { color: "#166534", fontWeight: 600 }
                              : undefined
                          }
                        >
                          {conv.last_message_text || conv.last_message_attachment_name || "No messages yet"}
                        </div>
                      </div>
                      <div
                        className="conv-time"
                        style={
                          unreadCount > 0 && !selected
                            ? { color: "#166534", fontWeight: 700 }
                            : undefined
                        }
                      >
                        {timeStr}
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              filteredContacts.length === 0 ? (
                <div style={{ padding: "24px 8px", color: "#94a3b8", fontSize: 13, textAlign: "center" }}>No contacts found.</div>
              ) : (
                filteredContacts.map((contact) => {
                  const admin = isAdmin(contact.role);
                  return (
                    <div key={contact.employee_id} className="contact-item" onClick={() => startConversation(contact)}>
                      <Avatar name={contact.name || "?"} size={42} isAdmin={admin} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="contact-name">{contact.name}</span>
                          {admin && <span className="badge badge-admin">Admin</span>}
                        </div>
                        <div className="contact-role">{contact.role}</div>
                      </div>
                      <ChevronRight size={15} color="#cbd5e1" />
                    </div>
                  );
                })
              )
            )}
          </div>
        </aside>

        {/* ── CHAT PANEL ── */}
        <main className="msg-area">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="chat-header">
                <Avatar name={selectedConversation.other_employee_name || "?"} size={46} isAdmin={isAdmin(selectedConversation.other_employee_role)} />
                <div className="chat-header-info">
                  <div className="chat-header-name">{selectedConversation.other_employee_name || "Direct chat"}</div>
                  <div className="chat-header-role">{selectedConversation.other_employee_role || "employee"}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f1f5f9", borderRadius: 10, padding: "6px 12px" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                  <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>Private Chat</span>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-wrap">
                {loadingMessages ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 40 }}>Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="empty-state" style={{ flex: 1 }}>
                    <div style={{ textAlign: "center" }}>
                      <div className="empty-icon">
                        <MessageSquare size={30} color="#2563eb" />
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Start the conversation</div>
                      <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6, maxWidth: 260 }}>
                        Send a message or attach a document to begin.
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const mine = Number(msg.sender_employee_id) === Number(employeeId);
                      const prevMsg = messages[idx - 1];
                      const showDate =
                        !prevMsg ||
                        new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="date-divider">
                              <span style={{ background: "#e2e8f0", padding: "3px 12px", borderRadius: 20 }}>
                                {getDateLabel(msg.created_at)}
                              </span>
                            </div>
                          )}
                          <div className={`msg-row ${mine ? "mine" : ""}`}>
                            {!mine && <Avatar name={msg.sender_name || "?"} size={30} />}
                            <div className={`msg-bubble ${mine ? "mine" : "theirs"}`}>
                              {!mine && (
                                <div className="msg-sender" style={{ color: mine ? "rgba(255,255,255,0.75)" : "#6366f1" }}>
                                  {msg.sender_name}
                                </div>
                              )}
                              {msg.message && <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.message}</p>}
                              {msg.attachment_url && (
                                <a
                                  href={msg.attachment_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`attach-chip ${mine ? "mine" : "theirs"}`}
                                >
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {msg.attachment_name || "Shared document"}
                                    </div>
                                    <div style={{ fontSize: 11, opacity: 0.7 }}>{msg.attachment_mime_type || "Attachment"}</div>
                                  </div>
                                  <Download size={14} style={{ flexShrink: 0 }} />
                                </a>
                              )}
                              <div className="msg-time">{getTimeLabel(msg.created_at)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Compose */}
              <div className="compose-bar">
                {attachment && (
                  <div className="attachment-preview">
                    <div style={{ minWidth: 0 }}>
                      <div className="attachment-preview-name">{attachment.name}</div>
                      <div className="attachment-preview-size">{(attachment.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <button
                      onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontWeight: 700, fontSize: 13, marginLeft: 10 }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div className="compose-row">
                  <button type="button" className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Attach file">
                    <Paperclip size={17} />
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" style={{ display: "none" }}
                    onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                  <div className="textarea-wrap">
                    <textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                    />
                  </div>
                  <button
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={sendingMessage || (!draft.trim() && !attachment)}
                  >
                    <Send size={15} />
                    {sendingMessage ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-card">
                <div className="empty-icon">
                  <MessageSquare size={32} color="#2563eb" />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Team Messages</div>
                <div style={{ fontSize: 13.5, color: "#64748b", marginTop: 10, maxWidth: 300, lineHeight: 1.65 }}>
                  Select a conversation from the left or go to <strong>Contacts</strong> to start a new chat with a colleague.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}

const styles = {
  card: {
    borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff",
    padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
};
