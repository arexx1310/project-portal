import React, { useState } from "react";
import { X, Send, AlertCircle, Plus, Trash2, Link as LinkIcon } from "lucide-react";
import facultyNotificationService from "../../../services/Faculty/notificationService";

const CreateNotificationModal = ({ isOpen, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    message: "",
    scope: "department",
    audience: "all",
    links: [], // Initialized as empty array
  });

  if (!isOpen) return null;

  // --- Link Handlers ---
  const addLink = () => {
    setFormData({
      ...formData,
      links: [...formData.links, { label: "", url: "" }],
    });
  };

  const removeLink = (index) => {
    const newLinks = formData.links.filter((_, i) => i !== index);
    setFormData({ ...formData, links: newLinks });
  };

  const handleLinkChange = (index, field, value) => {
    const newLinks = [...formData.links];
    newLinks[index][field] = value;
    setFormData({ ...formData, links: newLinks });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation for links if they exist
    const hasEmptyLinks = formData.links.some(link => !link.label.trim() || !link.url.trim());
    if (hasEmptyLinks) {
      setError("Please fill in both label and URL for all links or remove them.");
      setLoading(false);
      return;
    }

    try {
      await facultyNotificationService.sendNotification(formData);
      onRefresh();
      onClose();
      setFormData({ message: "", scope: "department", audience: "all", links: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0">
          <h3 className="text-lg font-semibold text-gray-800">Create Notification</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Message Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px] outline-none"
              placeholder="Enter academic update..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          {/* Scope & Audience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
              <select
                className="w-full p-2 border rounded-lg bg-white outline-none"
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              >
                <option value="department">Department</option>
                <option value="system">System-wide</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
              <select
                disabled={formData.scope === "system"}
                className="w-full p-2 border rounded-lg disabled:bg-gray-100 bg-white outline-none"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              >
                <option value="all">All</option>
                <option value="faculty">Faculty Only</option>
              </select>
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <LinkIcon size={16} /> Attach Links
              </label>
              <button
                type="button"
                onClick={addLink}
                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus size={14} /> Add Link
              </button>
            </div>

            {formData.links.map((link, index) => (
              <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex-1 space-y-2">
                  <input
                    placeholder="Label (e.g. View Document)"
                    className="w-full p-1.5 text-sm border rounded outline-none focus:ring-1 focus:ring-blue-400"
                    value={link.label}
                    onChange={(e) => handleLinkChange(index, "label", e.target.value)}
                  />
                  <input
                    placeholder="URL (https://...)"
                    className="w-full p-1.5 text-sm border rounded outline-none focus:ring-1 focus:ring-blue-400"
                    value={link.url}
                    onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Footer Button */}
          <div className="pt-2 sticky bottom-0 bg-white">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : <><Send size={18} /> Send Notification</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNotificationModal;