import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Send,
  Paperclip,
  History,
  MessageSquare,
  ClipboardList
} from 'lucide-react';

export default function WorkOrderModal({
  workOrder,
  currentUser,
  technicians,
  isTechnician,
  setWorkOrders,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [newCommentText, setNewCommentText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const updateWorkOrder = (updater) => {
    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id !== workOrder.id) return wo;
        return updater(wo);
      })
    );
  };

  const handleUpdateStatus = (status) => {
    updateWorkOrder((wo) => ({
      ...wo,
      status,
      history: [
        ...wo.history,
        {
          id: `h-${Date.now()}`,
          action: `Status changed from ${wo.status} to ${status}`,
          user: currentUser.name,
          date: new Date().toLocaleString()
        }
      ]
    }));
  };

  const handleAssignTechnician = (techId) => {
    const techName = technicians.find((t) => t.id === techId)?.name || 'Unassigned';

    updateWorkOrder((wo) => ({
      ...wo,
      technicianId: techId,
      history: [
        ...wo.history,
        {
          id: `h-${Date.now()}`,
          action: `Assigned to ${techName}`,
          user: currentUser.name,
          date: new Date().toLocaleString()
        }
      ]
    }));
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;

    const comment = {
      id: `com-${Date.now()}`,
      author: currentUser.name,
      text: newCommentText,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    updateWorkOrder((wo) => ({
      ...wo,
      comments: [...wo.comments, comment],
      history: [
        ...wo.history,
        {
          id: `h-${Date.now()}`,
          action: `Comment added by ${currentUser.name}`,
          user: currentUser.name,
          date: new Date().toLocaleString()
        }
      ]
    }));

    setNewCommentText('');
  };

  const addAttachedFile = (name, size) => {
    const attachment = {
      id: `att-${Date.now()}`,
      name,
      size,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    updateWorkOrder((wo) => ({
      ...wo,
      attachments: [...wo.attachments, attachment],
      history: [
        ...wo.history,
        {
          id: `h-${Date.now()}`,
          action: `File attached: ${name}`,
          user: currentUser.name,
          date: new Date().toLocaleString()
        }
      ]
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const size = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    addAttachedFile(file.name, size);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    }

    if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const size = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    addAttachedFile(file.name, size);
  };

  const getStatusStyle = (status) => {
    const styles = {
      Open: 'bg-emerald-600 text-white border-emerald-600',
      'In Progress': 'bg-amber-500 text-white border-amber-500',
      'On Hold': 'bg-slate-600 text-white border-slate-600',
      Completed: 'bg-indigo-600 text-white border-indigo-600'
    };

    return styles[status] || styles.Open;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'attachments', label: 'Attachments', icon: Paperclip },
    { id: 'history', label: 'History', icon: History },
    { id: 'comments', label: 'Comments', icon: MessageSquare }
  ];

  const assignedTech = technicians.find((t) => t.id === workOrder.technicianId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4">

      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {workOrder.id}
              </span>

              <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusStyle(workOrder.status)}`}>
                {workOrder.status}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-3">
              {workOrder.title}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {workOrder.category} • {workOrder.equipment}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
                  active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">

          {activeTab === 'overview' && (
            <div className="space-y-5">

              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Update Status
                </span>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {['Open', 'In Progress', 'On Hold', 'Completed'].map((status) => {
                    const active = workOrder.status === status;

                    return (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(status)}
                        className={`py-2 rounded-lg border text-xs font-bold transition ${
                          active
                            ? getStatusStyle(status)
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isTechnician && (
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-slate-400">
                    Assigned Technician
                  </label>

                  <select
                    value={workOrder.technicianId}
                    onChange={(e) => handleAssignTechnician(e.target.value)}
                    className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:outline-none"
                  >
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Equipment
                  </span>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {workOrder.equipment}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Location
                  </span>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {workOrder.location}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Due Date
                  </span>

                  <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">
                    {workOrder.dueDate}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Created By
                  </span>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {workOrder.creatorName}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Priority
                  </span>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {workOrder.priority}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Technician
                  </span>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {assignedTech?.name || 'Unassigned'}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <span className="text-xs text-slate-400 font-bold uppercase">
                  Description
                </span>

                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {workOrder.description}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />

                <p className="text-sm font-bold text-slate-700">
                  Click or drag files here to upload
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  PDF, PNG, JPG up to 10MB
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="space-y-2">
                {workOrder.attachments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    No attachments uploaded yet.
                  </p>
                ) : (
                  workOrder.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-slate-400" />

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {file.name}
                          </p>

                          <p className="text-xs text-slate-400">
                            Uploaded {file.uploadedAt}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs text-slate-500 font-mono">
                        {file.size}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {workOrder.history.slice().reverse().map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <div className="flex justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {log.action}
                    </p>

                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {log.date}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    By {log.user}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">

              <div className="space-y-3">
                {workOrder.comments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    No comments yet.
                  </p>
                ) : (
                  workOrder.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <div className="flex justify-between gap-4">
                        <p className="text-sm font-bold text-slate-800">
                          {comment.author}
                        </p>

                        <span className="text-xs text-slate-400">
                          {comment.date}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 mt-2">
                        {comment.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  placeholder="Write a comment..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />

                <button
                  onClick={handleAddComment}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 flex items-center gap-2 text-sm font-bold"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}