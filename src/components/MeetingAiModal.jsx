import React, { useState, useEffect } from "react";
import { Sparkles, X, FileText, CheckCircle2, Save, Trash2, Edit2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import api from "../hooks/useApi";
import { Button } from "./ui/button";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const MeetingAiModal = ({ isOpen, onClose, workspaceId, workspaceEmployees = [], onSuccess }) => {
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [tasksPreview, setTasksPreview] = useState(null); // Array of extracted tasks
  const [isSaving, setIsSaving] = useState(false);

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setTranscript("");
      setTasksPreview(null);
      setIsProcessing(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (file) {
      const isTxt = file.type === "text/plain" || file.name.toLowerCase().endsWith('.txt');
      const isRtf = file.type === "application/rtf" || file.name.toLowerCase().endsWith('.rtf');
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf');

      if (!isTxt && !isPdf && !isRtf) {
        return toast.error("Please upload a valid .txt, .pdf or .rtf file.");
      }

      if (isTxt || isRtf) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setTranscript(event.target.result);
          toast.success("Text file loaded successfully.");
        };
        reader.onerror = () => toast.error("Failed to read text file.");
        reader.readAsText(file);
      } else if (isPdf) {
        try {
          toast.info("Extracting text from PDF...");
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(" ");
            fullText += pageText + "\n\n";
          }
          setTranscript(fullText.trim());
          toast.success("PDF content extracted successfully.");
        } catch (error) {
          console.error("PDF Extraction Error:", error);
          toast.error("Failed to extract text from PDF.");
        }
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e);
  };

  const handleProcessText = async () => {
    if (!transcript.trim()) {
      return toast.error("Please paste meeting transcript first.");
    }
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post("/ai/extract-tasks", 
        { transcript }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const rawTasks = res.data?.data || [];
      // Map AI names to real employee IDs where possible
      const mappedTasks = rawTasks.map(t => {
        let matchedEmpId = "";
        if (t.assignee_name && t.assignee_name.toLowerCase() !== "unassigned") {
            const match = workspaceEmployees.find(emp => 
                emp.name.toLowerCase().includes(t.assignee_name.toLowerCase()) || 
                t.assignee_name.toLowerCase().includes(emp.name.toLowerCase())
            );
            if (match) matchedEmpId = String(match.id);
        }
        return { ...t, employee_id: matchedEmpId };
      });

      setTasksPreview(mappedTasks);
      toast.success("Tasks extracted successfully! Please review.");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to analyze transcript.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveTasks = async () => {
    // Validate
    const invalidTasks = tasksPreview.filter(t => !t.title || !t.employee_id);
    if (invalidTasks.length > 0) {
      return toast.error("Please select an assignee for all tasks before saving.");
    }

    setIsSaving(true);
    let successCount = 0;
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Loop through and call existing APIs
      for (const t of tasksPreview) {
        if (t.task_type === 'master') {
          await api.post("/master-task/create", {
            workspace_id: workspaceId,
            title: t.title,
            description: t.kpi || "Generated via AI Meeting",
            start_date: new Date().toISOString().split('T')[0],
            end_date: t.due_date || null,
            assignees: [Number(t.employee_id)]
          }, { headers });
        } else {
          // daily or weekly
          await api.post("/task/assignTask", {
             employee_id: String(t.employee_id),
             title: t.title,
             description: t.kpi || "",
             due_date: t.due_date || new Date().toISOString().split('T')[0],
             workspace_id: workspaceId,
             recurrence_type: "none"
          }, { headers });
        }
        successCount++;
      }

      toast.success(`Successfully assigned ${successCount} task(s)!`);
      onClose();
      onSuccess(); // refresh boards
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while assigning tasks.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTask = (index, field, value) => {
    const updated = [...tasksPreview];
    updated[index][field] = value;
    setTasksPreview(updated);
  };

  const handleRemoveTask = (index) => {
    const updated = tasksPreview.filter((_, i) => i !== index);
    setTasksPreview(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Meeting Insights
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-white rounded-full p-1 shadow-sm transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
          {!tasksPreview ? (
            <div className="flex flex-col gap-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800 flex justify-between items-center gap-3">
                <div className="flex gap-3 items-start">
                  <FileText className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
                  <p>Paste your Google Meet / Zoom transcript below, or upload a <b>.txt / .pdf / .rtf</b> file. Our AI will automatically identify Action Items, Assignees, Deadlines, and KPIs.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="shrink-0 bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hidden sm:flex"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="w-4 h-4 mr-1.5" />
                  Upload File
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".pdf,.txt,.rtf" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </div>
              <div 
                className={`relative w-full rounded-xl border-2 transition-all ${isDragOver ? 'border-purple-400 bg-purple-50/50 scale-[1.01]' : 'border-gray-200 bg-white'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isDragOver && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-purple-500/10 rounded-xl rounded-xl backdrop-blur-sm pointer-events-none">
                    <p className="font-bold text-purple-600 flex items-center gap-2 text-lg">
                      <UploadCloud className="w-6 h-6 animate-bounce" /> Drop file here
                    </p>
                  </div>
                )}
                <textarea
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  placeholder="Paste text here or drag & drop a .txt, .pdf, or .rtf file... E.g., Rahul will handle the database changes by next Friday."
                  className="w-full h-64 p-4 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none resize-none text-sm leading-relaxed bg-transparent"
                ></textarea>
              </div>
              <Button
                onClick={handleProcessText}
                disabled={isProcessing || !transcript.trim()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md w-full sm:w-auto self-end"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing Speech...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Process with AI</span>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">Extracted Action Items</h4>
                  <p className="text-sm text-gray-500">Please review and correct any names or dates before assigning.</p>
                </div>
                <button onClick={() => setTasksPreview(null)} className="text-xs text-purple-600 hover:underline font-semibold">
                  &larr; Back to Text
                </button>
              </div>

              {tasksPreview.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white text-gray-500">
                  No actionable tasks found in this transcript.
                </div>
              ) : (
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold w-[30%]">Task Title</th>
                        <th className="px-4 py-3 font-semibold w-[20%]">Assignee</th>
                        <th className="px-4 py-3 font-semibold w-[15%]">Type</th>
                        <th className="px-4 py-3 font-semibold w-[15%]">Deadline</th>
                        <th className="px-4 py-3 font-semibold w-[15%]">KPI/Info</th>
                        <th className="px-4 py-3 font-semibold w-[5%]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tasksPreview.map((task, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              value={task.title} 
                              onChange={e => handleUpdateTask(idx, 'title', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-purple-300 outline-none px-1 py-0.5"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={task.employee_id}
                              onChange={e => handleUpdateTask(idx, 'employee_id', e.target.value)}
                              className={`w-full bg-gray-50 border rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-purple-400 ${!task.employee_id ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-200'}`}
                            >
                              <option value="">Select Employee...</option>
                              {workspaceEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                              ))}
                            </select>
                            {!task.employee_id && task.assignee_name && (
                              <div className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                                AI heard: <b>{task.assignee_name}</b>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                             <select 
                              value={task.task_type}
                              onChange={e => handleUpdateTask(idx, 'task_type', e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-purple-400"
                            >
                              <option value="daily">Daily Log</option>
                              <option value="weekly">Weekly Log</option>
                              <option value="master">Master Task</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="date" 
                              value={task.due_date || ""} 
                              onChange={e => handleUpdateTask(idx, 'due_date', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-purple-300 outline-none px-1 py-0.5 text-xs text-gray-600"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              value={task.kpi || ""} 
                              placeholder="KPI..."
                              onChange={e => handleUpdateTask(idx, 'kpi', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-purple-300 outline-none px-1 py-0.5 text-xs text-gray-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                             <button onClick={() => handleRemoveTask(idx)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 hover:bg-red-100 rounded-md transition" title="Remove">
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer (only visible when previewing) */}
        {tasksPreview && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button 
              onClick={handleSaveTasks} 
              disabled={isSaving || tasksPreview.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-6"
            >
              {isSaving ? "Assigning Tasks..." : "Confirm & Assign Tasks"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingAiModal;
