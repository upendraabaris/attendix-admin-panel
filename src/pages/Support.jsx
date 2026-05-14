import { useEffect, useMemo, useState } from "react";
import {
  LifeBuoy,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Send,
} from "lucide-react";
import Layout from "../components/Layout";
import api from "../hooks/useApi";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const STATUS_OPTIONS = ["all", "open", "in_progress", "resolved", "closed"];

const STATUS_STYLES = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-slate-200 text-slate-700 border-slate-300",
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const prettifyStatus = (value) =>
  String(value || "open")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const Support = () => {
  const role = String(localStorage.getItem("role") || "").toLowerCase();
  const isAdmin = role.includes("admin");
  const isSupport = role.includes("support");
  const canManageAllTickets = isAdmin || isSupport;

  const [tickets, setTickets] = useState([]);
  const [commentsByTicket, setCommentsByTicket] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState({});
  const [statusUpdating, setStatusUpdating] = useState({});
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    attachment: null,
  });
  const [commentDrafts, setCommentDrafts] = useState({});

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const query = statusFilter && statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await api.get(`/support${query}`);
      const nextTickets = res?.data?.data || [];
      setTickets(nextTickets);

      if (nextTickets.length && !activeTicketId) {
        setActiveTicketId(nextTickets[0].id);
      }

      if (!nextTickets.some((ticket) => ticket.id === activeTicketId)) {
        setActiveTicketId(nextTickets[0]?.id || null);
      }
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      toast.error("Unable to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (ticketId) => {
    if (!ticketId) {
      return;
    }

    try {
      const res = await api.get(`/support/${ticketId}/comments`);
      setCommentsByTicket((prev) => ({
        ...prev,
        [ticketId]: res?.data?.data || [],
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Unable to load ticket comments");
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    if (activeTicketId && !commentsByTicket[activeTicketId]) {
      fetchComments(activeTicketId);
    }
  }, [activeTicketId, commentsByTicket]);

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        ticket.title?.toLowerCase().includes(normalizedSearch) ||
        ticket.description?.toLowerCase().includes(normalizedSearch) ||
        ticket.employee_name?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [tickets, searchTerm]);

  const activeTicket =
    filteredTickets.find((ticket) => ticket.id === activeTicketId) ||
    filteredTickets[0] ||
    null;

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append("title", formData.title.trim());
      payload.append("description", formData.description.trim());
      if (formData.attachment) {
        payload.append("attachment", formData.attachment);
      }

      const res = await api.post("/support", payload);
      const createdTicket = res?.data?.data;

      toast.success("Support issue submitted");
      setFormData({
        title: "",
        description: "",
        attachment: null,
      });

      await fetchTickets();
      if (createdTicket?.id) {
        setActiveTicketId(createdTicket.id);
      }
    } catch (error) {
      console.error("Error creating support ticket:", error);
      toast.error(error?.response?.data?.message || "Failed to submit support issue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (ticketId) => {
    const comment = String(commentDrafts[ticketId] || "").trim();

    if (!comment) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setCommentSubmitting((prev) => ({ ...prev, [ticketId]: true }));
      await api.post(`/support/${ticketId}/comments`, { comment });
      setCommentDrafts((prev) => ({ ...prev, [ticketId]: "" }));
      await fetchComments(ticketId);
      await fetchTickets();
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error?.response?.data?.message || "Failed to add comment");
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleStatusUpdate = async (ticketId, nextStatus) => {
    try {
      setStatusUpdating((prev) => ({ ...prev, [ticketId]: true }));
      await api.put(`/support/${ticketId}/status`, { status: nextStatus });
      await fetchTickets();
      toast.success("Ticket status updated");
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 text-indigo-600" />
            Support
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isAdmin
              ? "Create issues, review all employee issues, and respond from one place."
              : isSupport
              ? "Review and respond to support issues from all organizations."
              : "Raise an issue with screenshot support and track replies from admin or support."}
          </p>
        </div>

        {!isSupport && (
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Raise Support Issue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTicket} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs text-gray-500 font-medium">Issue Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Example: Attendance not marking from mobile"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs text-gray-500 font-medium">Description</Label>
                  <Textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the issue, steps, and expected result..."
                    className="text-sm resize-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs text-gray-500 font-medium">Screenshot</Label>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        attachment: e.target.files?.[0] || null,
                      }))
                    }
                    className="h-10 text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Optional. Upload JPG, PNG, or WEBP up to 5 MB.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-5 text-sm font-medium"
                  >
                    {submitting ? "Submitting..." : "Submit Issue"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
          <div className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row xl:flex-col gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <Input
                      placeholder={isAdmin ? "Search by title or employee..." : "Search your issues..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === "all" ? "All Status" : prettifyStatus(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm">Loading support issues...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <LifeBuoy className="w-9 h-9 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No support issues found</p>
                  <p className="text-xs mt-1">Create a new issue from the form above.</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setActiveTicketId(ticket.id)}
                    className={`w-full text-left bg-white rounded-xl border shadow-sm p-4 transition-all ${
                      activeTicket?.id === ticket.id
                        ? "border-indigo-300 ring-2 ring-indigo-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{ticket.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                      <Badge
                        className={`border text-xs font-medium ${STATUS_STYLES[ticket.status] || STATUS_STYLES.open}`}
                      >
                        {prettifyStatus(ticket.status)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                      <span>{canManageAllTickets ? `${ticket.employee_name}${ticket.organization_name ? ` • ${ticket.organization_name}` : ""}` : "My Ticket"}</span>
                      <span>{formatDate(ticket.created_at)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <Card className="border-gray-200 shadow-sm min-h-[420px]">
            <CardContent className="p-5">
              {!activeTicket ? (
                <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Select a support issue</p>
                  <p className="text-xs mt-1">Its full details and comments will appear here.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{activeTicket.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Raised by {activeTicket.employee_name}
                        {activeTicket.organization_name ? ` • ${activeTicket.organization_name}` : ""}
                        {" "}on {formatDate(activeTicket.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`border text-xs font-medium ${STATUS_STYLES[activeTicket.status] || STATUS_STYLES.open}`}
                      >
                        {prettifyStatus(activeTicket.status)}
                      </Badge>
                      {canManageAllTickets && (
                        <Select
                          value={activeTicket.status}
                          onValueChange={(value) => handleStatusUpdate(activeTicket.id, value)}
                          disabled={statusUpdating[activeTicket.id]}
                        >
                          <SelectTrigger className="w-[150px] h-9 text-sm">
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.filter((status) => status !== "all").map((status) => (
                              <SelectItem key={status} value={status}>
                                {prettifyStatus(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{activeTicket.description}</p>
                    {activeTicket.attachment_url && (
                      <a
                        href={activeTicket.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-indigo-700 hover:text-indigo-800"
                      >
                        <Paperclip className="w-4 h-4" />
                        View Screenshot
                      </a>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Conversation</h3>
                    <div className="space-y-3">
                      {(commentsByTicket[activeTicket.id] || []).length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                          No comments yet. You can start the conversation below.
                        </div>
                      ) : (
                        (commentsByTicket[activeTicket.id] || []).map((comment) => (
                          <div key={comment.id} className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-gray-800">
                                {comment.commented_by_name || comment.commented_by_role}
                              </p>
                              <Badge variant="outline" className="text-[11px] capitalize">
                                {String(comment.commented_by_role || "").replaceAll("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{comment.comment}</p>
                            <p className="text-xs text-gray-400 mt-2">{formatDate(comment.created_at)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                    <Label className="text-xs text-gray-500 font-medium">Add Comment</Label>
                    <Textarea
                      rows={3}
                      value={commentDrafts[activeTicket.id] || ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({
                          ...prev,
                          [activeTicket.id]: e.target.value,
                        }))
                      }
                      placeholder="Write your response..."
                      className="text-sm resize-none"
                    />
                    <Button
                      type="button"
                      onClick={() => handleAddComment(activeTicket.id)}
                      disabled={commentSubmitting[activeTicket.id]}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 text-sm font-medium"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {commentSubmitting[activeTicket.id] ? "Sending..." : "Send Comment"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Support;
