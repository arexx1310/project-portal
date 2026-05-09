import React, { useState, useEffect } from 'react';
import { Plus, ListChecks, CalendarDays, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

import Loader from '../../components/ui/Loader';
import projectServices from "../../services/Student/projectServices";
import WorkItemCard from "../../components/common/WeeklyProgress/WorkItemCard";

const ITEMS_PER_PAGE = 4;

/* ─────────────────────────────────────────────────────
   WEEKLY UPDATE FORM MODAL
───────────────────────────────────────────────────── */
const WeeklyUpdateForm = ({ projectId, onClose, onSuccess }) => {
  const [weekNumber, setWeekNumber] = useState(1);
  const [updateText, setUpdateText] = useState("");
  const [links, setLinks]           = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const addLink = () => setLinks([...links, { label: "", url: "" }]);

  const handleLinkChange = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { weekNumber, updateText, links: links.filter((l) => l.url) };
      const res = await projectServices.submitWeeklyUpdate(projectId, payload);
      if (res.success) onSuccess(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl border border-white">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit Progress Update</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Week Number</label>
            <input
              type="number"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Update Description</label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl h-40 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="What did you achieve this week?"
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-gray-600">Resource Links</label>
              <button type="button" onClick={addLink} className="text-blue-600 text-xs font-bold hover:underline">
                + Add Link
              </button>
            </div>
            {links.map((link, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  placeholder="Label (e.g. Drive)"
                  className="w-1/3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  value={link.label}
                  onChange={(e) => handleLinkChange(i, "label", e.target.value)}
                />
                <input
                  placeholder="URL"
                  className="w-2/3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  value={link.url}
                  onChange={(e) => handleLinkChange(i, "url", e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 font-bold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Update"}
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
const StudentWorkManager = ({ projectId }) => {
  const [activeTab,    setActiveTab]    = useState("updates"); // 'updates' | 'tasks'
  const [items,        setItems]        = useState([]);
  const [pagination,   setPagination]   = useState(null);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch data based on active tab + current page
  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      let response;
      if (activeTab === "updates") {
        response = await projectServices.getWeeklyUpdates(projectId, page, ITEMS_PER_PAGE);
      } else {
        response = await projectServices.getProjectTasks(projectId, page, ITEMS_PER_PAGE);
      }
      if (response.success) {
        setItems(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 whenever the tab or projectId changes
  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [activeTab, projectId]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchData(page);
    // Scroll to top of list smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // When a new update is submitted it goes to the top (page 1)
  const handleUpdateAdded = (newItem) => {
    setShowAddModal(false);
    // Refresh page 1 so the new item appears with correct pagination metadata
    setCurrentPage(1);
    fetchData(1);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          {activeTab === "updates" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 font-medium"
            >
              <Plus size={20} />
              Submit Weekly Update
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white/40 shadow-sm self-end">
          <button
            onClick={() => setActiveTab("updates")}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-semibold ${
              activeTab === "updates"
                ? "bg-white text-blue-600 shadow-md"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CalendarDays size={18} />
            Weekly Updates
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-semibold ${
              activeTab === "tasks"
                ? "bg-white text-blue-600 shadow-md"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ListChecks size={18} />
            Weekly Tasks
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader/>
            <p className="font-medium">Fetching your work items...</p>
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6">
              {items.map((item) => (
                <WorkItemCard
                  key={item._id}
                  item={item}
                  isFaculty={false}
                  projectId={projectId}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </>
        ) : (
          <div className="text-center py-20 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium text-lg">
              No {activeTab === "updates" ? "weekly updates" : "assigned tasks"} found.
            </p>
          </div>
        )}
      </div>

      {/* Add Weekly Update Modal */}
      {showAddModal && (
        <WeeklyUpdateForm
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleUpdateAdded}
        />
      )}
    </div>
  );
};

export default StudentWorkManager;