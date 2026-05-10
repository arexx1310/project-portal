import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ListChecks, CalendarDays, Loader2, X, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from "react-hot-toast";
import WorkItemCard from "../../components/common/WeeklyProgress/WorkItemCard";

import facultyProjectService from '../../services/Faculty/projectServices';
import ConfirmModal from "../../components/common/ConfirmModal";

const ITEMS_PER_PAGE = 4;

/* ─────────────────────────────────────────────────────
   CREATE TASK FORM MODAL
───────────────────────────────────────────────────── */
const CreateTaskForm = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    title:       "",
    description: "",
    dueDate:     "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, () => {
      // Reset callback on success
      setFormData({ title: "", description: "", dueDate: "" });
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-blue-600 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus /> Create New Task
          </h2>
          <button onClick={onClose} className="text-blue-100 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Task Title</label>
            <input
              required
              type="text"
              placeholder="e.g. Design System Architecture"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea
              required
              rows={4}
              placeholder="Detailed requirements for the students..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
              <CalendarDays size={16} /> Due Date
            </label>
            <input
              required
              type="date"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition flex items-center justify-center gap-2 disabled:bg-blue-300"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
              Assign Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   PAGINATION CONTROLS
───────────────────────────────────────────────────── */
const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, hasPrevPage, hasNextPage, total } = pagination;

  const startItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem   = Math.min(page * ITEMS_PER_PAGE, total);

  return (
    <div className="flex items-center justify-between mt-8 px-1">
      {/* Item count info */}
      <p className="text-sm text-gray-500 font-medium">
        Showing <span className="text-gray-700 font-semibold">{startItem}–{endItem}</span> of{" "}
        <span className="text-gray-700 font-semibold">{total}</span>
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-2">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                p === page
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────── */
const FacultyWorkManager = ({ projectId }) => {
  const [items,        setItems]        = useState([]);
  const [pagination,   setPagination]   = useState(null);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await facultyProjectService.getWorkItems(projectId, page, ITEMS_PER_PAGE);
      if (response.success) {
        setItems(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to load progress list.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [fetchData]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchData(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateTask = async (taskData, resetForm) => {
    setIsSubmitting(true);
    try {
      const res = await facultyProjectService.createTask(projectId, taskData);
      if (res.success) {
        toast.success("Task assigned successfully!");
        resetForm();
        setShowAddModal(false);
        // Refresh page 1 so new task appears with correct pagination metadata
        setCurrentPage(1);
        fetchData(1);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    try {
      const res = await facultyProjectService.deleteTask(projectId, taskToDelete);
      if (res.success) {
        toast.success("Task deleted");
        // If the deleted item was the only one on this page, go back one page
        const isLastItemOnPage = items.length === 1 && currentPage > 1;
        const targetPage = isLastItemOnPage ? currentPage - 1 : currentPage;
        setCurrentPage(targetPage);
        fetchData(targetPage);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to delete task");
    } finally {
      setTaskToDelete(null);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 font-medium"
        >
          <Plus size={20} />
          <span className="inline">New Task</span>
        </button>
      </div>

      {/* List Section */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-3" size={32} />
            <p className="text-sm sm:text-base">Loading project tasks...</p>
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {items.map((item) => (
                <WorkItemCard
                  key={item._id}
                  item={item}
                  isFaculty={true}
                  projectId={projectId}
                  onDelete={() => setTaskToDelete(item._id)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Form Modal */}
      <CreateTaskForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateTask}
        isSubmitting={isSubmitting}
      />

      {taskToDelete && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setTaskToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Task?"
          message="Are you sure you want to delete this task? This action cannot be undone."
          theme="red"
        >
          Delete
        </ConfirmModal>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────── */
const EmptyState = () => (
  <div className="text-center py-12 sm:py-20 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200 px-6">
    <div className="bg-slate-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
      <CalendarDays size={32} className="text-slate-300" />
    </div>
    <h3 className="text-base sm:text-lg font-bold text-slate-700">No tasks created yet</h3>
    <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">
      Start by assigning a new task to keep the project on track.
    </p>
  </div>
);

export default FacultyWorkManager;