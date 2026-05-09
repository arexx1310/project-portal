import React, { useState, useEffect } from 'react';
import { Calendar, Link as LinkIcon, Edit, MessageSquare, Trash2, CheckCircle, Clock } from 'lucide-react';

import projectServices from "../../../services/Student/projectServices";
import facultyProjectService from "../../../services/Faculty/projectServices";



const FeedbackForm = ({ projectId, itemId, onClose, onSuccess }) => {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await facultyProjectService.addFeedback(projectId, itemId, { comment });
      if (res.success) {
        onSuccess(res.data); 
        onClose();
      }
    } catch (err) {
      console.error("Feedback failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-blue-600 p-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <MessageSquare size={18} /> Add Faculty Feedback
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <textarea 
            required
            className="w-full p-4 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none h-32 bg-slate-50 transition-all" 
            placeholder="Provide guidance or critique..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:bg-blue-300">
              {loading ? "Saving..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UpdateTaskForm = ({ projectId, itemId, data, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: data.title || "",
    description: data.description || "",
    dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await facultyProjectService.editTask(projectId, itemId, formData);
      if (res.success) {
        // res.data.data contains { title, description, dueDate }
        onSuccess(res.data); 
        onClose();
      }
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-amber-500 p-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Edit size={18} /> Edit Task Details
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
            <input
              required
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
            <textarea
              required
              rows="4"
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
            <input
              required
              type="date"
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition disabled:bg-amber-300">
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SubmissionForm = ({ projectId, itemId, data, taskTitle, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    text: "",
    links: [{ label: "", url: "" }]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data?.submission) {
      setFormData({
        text: data.submission.text || "",
        links: data.submission.links?.length > 0 ? data.submission.links : [{ label: "", url: "" }]
      });
    }
  }, [data]);

  const handleLinkChange = (index, field, value) => {
    const updatedLinks = [...formData.links];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setFormData({ ...formData, links: updatedLinks });
  };

  const handleAddLink = () => {
    setFormData({ ...formData, links: [...formData.links, { label: "", url: "" }] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        text: formData.text,
        links: formData.links.filter(link => link.label && link.url)
      };

      const res = data?.submission 
        ? await projectServices.editTaskSubmission(projectId, itemId, payload)
        : await projectServices.submitTask(projectId, itemId, payload);

      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header: Adjusted padding for mobile */}
        <div className="bg-blue-600 p-4 md:p-6">
          <p className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-widest">Submit Work For:</p>
          <h2 className="text-lg md:text-xl font-bold text-white truncate leading-tight">
            {taskTitle}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5 md:space-y-6">
          {/* Submission Text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Submission Details</label>
            <textarea
              required
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-32 md:h-40 bg-gray-50 transition-all text-sm md:text-base"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Describe the progress you've made..."
            />
          </div>

          {/* Links Section: Responsive Grid */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Relevant Links</label>
            <div className="space-y-4 md:space-y-3">
              {formData.links.map((link, index) => (
                <div 
                  key={index} 
                  className="flex flex-col md:flex-row gap-2 md:gap-3 p-3 md:p-0 bg-gray-50 md:bg-transparent rounded-xl md:rounded-none border md:border-none border-gray-100 animate-in slide-in-from-left-2"
                >
                  <input
                    placeholder="Label (e.g. GitHub)"
                    className="w-full md:flex-1 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={link.label}
                    onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                  />
                  <input
                    placeholder="URL (https://...)"
                    className="w-full md:flex-[2] p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={link.url}
                    onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                  />
                </div>
              ))}
            </div>
            
            <button 
              type="button" 
              onClick={handleAddLink} 
              className="w-full md:w-auto text-sm text-blue-600 font-bold hover:text-blue-800 transition py-2 flex items-center justify-center md:justify-start gap-1"
            >
              <span className="text-lg">+</span> Add another link
            </button>
          </div>

          {/* Action Buttons: Stacked on mobile, side-by-side on desktop */}
          <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full py-3 md:py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition text-sm md:text-base"
            >
              Go Back
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 md:py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-blue-300 transition-all text-sm md:text-base"
            >
              {loading ? "Processing..." : (data?.submission ? "Update Submission" : "Confirm Submission")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const WeekUpdateForm = ({ projectId, itemId, data, onClose, onSuccess, weekNumber}) => {
    const [formData, setFormData] = useState({
      updateText: data.updateText,
      links: data.links
    });

    const [loading, setLoading] = useState(false);

    const handleLinkChange = (index, field, value) => {
      const updatedLinks = [...formData.links];
      updatedLinks[index] = { ...updatedLinks[index], [field]: value };
      setFormData({ ...formData, links: updatedLinks });
    };

    const handleAddLink = () => {
      setFormData({ ...formData, links: [...formData.links, { label: "", url: "" }] });
    };
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          const payload = {
              updateText: formData.updateText,
              links: formData.links.filter(link => link.label && link.url)
          }

          const res = await projectServices.editWeeklyUpdate(projectId,itemId,payload);

          if (res.success) {
            onSuccess(res.data);
            onClose();
          }
      } catch (err) {
          console.error("Action failed:", err);
      } finally {
        setLoading(false);
      }
    }

    return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
      {/* Header: Adjusted padding for mobile */}
      <div className="bg-blue-600 p-4 md:p-6">
        <p className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-widest">Update Weekly Progress For</p>
        <h2 className="text-lg md:text-xl font-bold text-white truncate leading-tight">
            Week Number: {weekNumber}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5 md:space-y-6">
        {/* Submission Text */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Updating Details</label>
          <textarea
            required
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-32 md:h-40 bg-gray-50 transition-all text-sm md:text-base"
            value={formData.updateText}
            onChange={(e) => setFormData({ ...formData, updateText: e.target.value })}
            placeholder="Describe the progress you've made..."
          />
        </div>

        {/* Links Section: Responsive Grid */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Relevant Links</label>
          <div className="space-y-4 md:space-y-3">
            {formData.links.map((link, index) => (
              <div 
                key={index} 
                className="flex flex-col md:flex-row gap-2 md:gap-3 p-3 md:p-0 bg-gray-50 md:bg-transparent rounded-xl md:rounded-none border md:border-none border-gray-100 animate-in slide-in-from-left-2"
              >
                <input
                  placeholder="Label (e.g. GitHub)"
                  className="w-full md:flex-1 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={link.label}
                  onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                />
                <input
                  placeholder="URL (https://...)"
                  className="w-full md:flex-[2] p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={link.url}
                  onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                />
              </div>
            ))}
          </div>
          
          <button 
            type="button" 
            onClick={handleAddLink} 
            className="w-full md:w-auto text-sm text-blue-600 font-bold hover:text-blue-800 transition py-2 flex items-center justify-center md:justify-start gap-1"
          >
            <span className="text-lg">+</span> Add another link
          </button>
        </div>

        {/* Action Buttons: Stacked on mobile, side-by-side on desktop */}
        <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 pt-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-full py-3 md:py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition text-sm md:text-base"
          >
            Go Back
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 md:py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-blue-300 transition-all text-sm md:text-base"
          >
            {loading ? "Processing..." : "Updating Work Progress"}
          </button>
        </div>
      </form>
    </div>
    </div>
  );
} 


const WorkItemCard = ({ item, isFaculty, projectId , onDelete}) => {
  const [data, setData] = useState(item);
 
  const [isWeekUpdateFormOpen, setIsWeekUpdateFormOpen] = useState(false);
  const [isSubmissionFormOpen, setIsSubmissionFormOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false); // New
  const [showFeedbackForm, setShowFeedbackForm] = useState(false); // New
  
  const isWeeklyUpdate = data.type === "WeeklyUpdate";
  const isReviewed = data.status === "Reviewed";
  const canStudentEdit = !isFaculty && !isReviewed;

  // Status Color Mapping
  const statusColors = {
    Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Submitted: "bg-blue-100 text-blue-700 border-blue-200",
    Reviewed: "bg-purple-100 text-purple-700 border-purple-200",
    Completed: "bg-green-100 text-green-700 border-green-200",
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const res = await facultyProjectService.updateWorkItemStatus(projectId, data._id, { status: newStatus });
      if (res.success) setData({ ...data, status: res.data });
    } catch (err) { console.error(err); }
  };

  // Logic for adding new feedback to the list
  const handleFeedbackSuccess = (newFeedback) => {
    setData(prev => ({
      ...prev,
      feedbacks: [...prev.feedbacks, newFeedback]
    }));
  };

  // Logic for updating task details
  const handleEditTaskSuccess = (updatedFields) => {
    setData(prev => ({
      ...prev,
      title: updatedFields.title,
      description: updatedFields.description,
      dueDate: updatedFields.dueDate
    }));
  };

  const handleSubmissionSuccess = (updatedData) => {
      // updatedData is { submission, status }
      setData((prev) => ({
        ...prev,
        submission: updatedData.submission,
        status: updatedData.status
      }));
  };

  

  const handleEditUpdateSuccess = (updatedData) => {
      setData((prev) => ({
        ...prev,
        updateText: updatedData.updateText,
        links: updatedData.links
      }));
  };


  return (
  <>
    <div className="relative overflow-hidden bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-3 sm:p-6 transition-all hover:shadow-2xl mb-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div className="w-full sm:w-auto">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${statusColors[data.status] || "bg-gray-100"}`}>
            {data.status.toUpperCase()}
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mt-2 break-words">
            {isWeeklyUpdate ? `Week ${data.weekNumber} Update` : data.title}
          </h3>
          <div className="flex flex-wrap gap-3 sm:gap-4 mt-1">
            <p className="text-[11px] sm:text-xs text-gray-500 flex items-center gap-1">
              <Clock size={12} /> {new Date(data.createdAt).toLocaleDateString("en-IN")}
            </p>
            {!isWeeklyUpdate && data.dueDate && (
              <p className="text-[11px] sm:text-xs text-red-500 flex items-center gap-1 font-medium">
                <Calendar size={12} /> Due: {new Date(data.dueDate).toLocaleDateString("en-IN")}
              </p>
            )}
          </div>
        </div>

        {/* Faculty Controls for Status */}
        {isFaculty && (
          <div className="w-full sm:w-auto">
            <select
              value={data.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className="w-full sm:w-auto text-sm border-none bg-white/50 rounded-lg focus:ring-2 focus:ring-blue-400 cursor-pointer p-2"
            >
              {["Pending", "Submitted", "Reviewed", "Completed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed break-words">
          {isWeeklyUpdate ? data.updateText : data.description}
        </p>

        {/* Task Submission View */}
        {!isWeeklyUpdate && data.submission && (
          <div className="mt-4 bg-blue-50/40 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-blue-100/50 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-blue-600">Task Submission</h4>
              <span className="text-[9px] sm:text-[10px] font-medium text-blue-400 bg-white/60 px-2 py-1 rounded-md border border-blue-50">
                {new Date(data.submission.submittedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">"{data.submission.text}"</p>
            {data.submission.links?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.submission.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-blue-600 hover:text-white text-blue-700 text-[11px] sm:text-xs font-semibold rounded-lg border border-blue-100 transition-all duration-200 shadow-sm"
                  >
                    <LinkIcon size={12} />
                    <span className="truncate max-w-[150px]">{link.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Weekly Update Links */}
        {isWeeklyUpdate && data.links?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[11px] sm:text-xs font-medium bg-white/70 backdrop-blur-sm text-gray-700 hover:bg-blue-600 hover:text-white transition-all duration-200 px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm"
              >
                <LinkIcon size={14} className="opacity-70" />
                <span className="truncate max-w-[150px]">{link.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Feedbacks Section */}
      {data.feedbacks?.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <MessageSquare size={16} /> Faculty Feedback
          </h4>
          <div className="space-y-3">
            {data.feedbacks.map((f, i) => (
              <div key={i} className="text-sm bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-gray-400 mb-1">
                  <span>{f.name || "FACULTY"}</span>
                  <span>{new Date(f.givenAt).toLocaleDateString("en-IN")}</span>
                </div>
                <p className="text-gray-600 text-[13px] sm:text-sm">{f.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {isFaculty ? (
          <>
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold text-sm"
            >
              <MessageSquare size={18} /> Add Feedback
            </button>
            <div className="flex gap-3 w-full sm:w-auto">
              {!isWeeklyUpdate && (
                <>
                  <button
                    onClick={() => setIsEditTaskOpen(true)}
                    className="flex-1 sm:flex-none p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 border border-amber-100 transition flex justify-center"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={onDelete}
                    className="flex-1 sm:flex-none p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-100 transition flex justify-center active:scale-95"
                    title="Delete Task"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          canStudentEdit && (
            <button
              onClick={() => (isWeeklyUpdate ? setIsWeekUpdateFormOpen(true) : setIsSubmissionFormOpen(true))}
              className={`w-full flex-1 ${isWeeklyUpdate ? "bg-blue-600" : "bg-gray-800"} text-white py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md`}
            >
              <Edit size={18} />
              <span className="font-semibold text-sm">
                {isWeeklyUpdate ? "Edit Update" : data.submission ? "Edit Submission" : "Add Submission"}
              </span>
            </button>
          )
        )}
      </div>
    </div>

    {/* Modals - (Assumed to be responsive internally) */}
    {showFeedbackForm && (
      <FeedbackForm
        projectId={projectId}
        itemId={data._id}
        onClose={() => setShowFeedbackForm(false)}
        onSuccess={handleFeedbackSuccess}
      />
    )}

    {isEditTaskOpen && (
      <UpdateTaskForm
        projectId={projectId}
        itemId={data._id}
        data={data}
        onClose={() => setIsEditTaskOpen(false)}
        onSuccess={handleEditTaskSuccess}
      />
    )}

    {isWeekUpdateFormOpen && ( 
        <WeekUpdateForm
          projectId={projectId}
          itemId={data._id}
          data={data}
          onClose={() => setIsWeekUpdateFormOpen(false)}
          onSuccess={handleEditUpdateSuccess}
          weekNumber={data.weekNumber}
        />
      )
    }

    {isSubmissionFormOpen && (
        <SubmissionForm
          projectId={projectId}
          itemId={data._id}
          data={data}
          taskTitle={isWeeklyUpdate ? `Week ${data.weekNumber} Update` : data.title} // Passing title
          onClose={() => setIsSubmissionFormOpen(false)}
          onSuccess={handleSubmissionSuccess}
        />
      )
    }


  </>
);
};

export default WorkItemCard;