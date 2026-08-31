import React, { useState } from 'react';
import {
  X,
  Wrench,
  ShieldAlert,
  ClipboardList,
  Route,
  MessageSquare,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export default function RequestModal({
  request,
  currentUser,
  isTechnician,
  setRequests,
  workOrders,
  setWorkOrders,
  setSelectedWorkOrderId,
  setCurrentTab,
  technicians,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [newCommentText, setNewCommentText] = useState('');

  const updateRequest = (updater) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== request.id) return req;
        return updater(req);
      })
    );
  };

  const handleApproval = (nextStatus) => {
    updateRequest((req) => {
      const updatedSteps = req.approvalSteps.map((step) => {
        if (step.step === 'Approval') {
          return {
            ...step,
            status: nextStatus === 'Approved' ? 'Completed' : 'Current',
            actor: currentUser.name,
            date: new Date().toLocaleDateString()
          };
        }

        if (step.step === 'Work Assignment' && nextStatus === 'Approved') {
          return {
            ...step,
            status: 'Current'
          };
        }

        return step;
      });

      return {
        ...req,
        status: nextStatus,
        approvalSteps: updatedSteps,
        comments: [
          ...req.comments,
          {
            id: `com-${Date.now()}`,
            author: currentUser.name,
            text:
              nextStatus === 'Approved'
                ? 'Request approved for work assignment.'
                : 'Request rejected and closed.',
            date: new Date().toISOString().replace('T', ' ').slice(0, 16)
          }
        ]
      };
    });
  };

  const handleEscalate = () => {
    updateRequest((req) => {
      const updatedSteps = req.approvalSteps.map((step) => {
        if (step.status === 'Current') {
          return {
            ...step,
            status: 'Completed',
            date: new Date().toLocaleDateString()
          };
        }

        return step;
      });

      return {
        ...req,
        priority: 'Critical',
        status: 'Escalated',
        approvalSteps: updatedSteps,
        comments: [
          ...req.comments,
          {
            id: `com-esc-${Date.now()}`,
            author: currentUser.name,
            text: 'Request escalated. Priority raised to Critical.',
            date: new Date().toISOString().replace('T', ' ').slice(0, 16)
          }
        ]
      };
    });
  };

  const handleConvertToWorkOrder = () => {
    const newWO = {
      id: `WO-2026-${String(workOrders.length + 10).padStart(3, '0')}`,
      title: `[Fault Response] ${request.title}`,
      equipment: 'Facility Assets / Unverified',
      location: request.location,
      technicianId: technicians[0].id,
      priority: request.priority,
      status: 'Open',
      description: request.description,
      category: 'Structural',
      createdAt: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      creatorName: request.reporter,
      attachments: [],
      comments: [
        {
          id: `com-${Date.now()}`,
          author: 'System Dispatch',
          text: `Work order created from request ${request.id}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16)
        }
      ],
      history: [
        {
          id: `h-${Date.now()}`,
          action: `Created from request ${request.id}`,
          user: currentUser.name,
          date: new Date().toLocaleString()
        }
      ]
    };

    setWorkOrders([newWO, ...workOrders]);

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== request.id) return req;

        return {
          ...req,
          status: 'Assigned',
          assignedTechnicianId: technicians[0].id,
          approvalSteps: req.approvalSteps.map((step) => {
            if (step.step === 'Work Assignment') {
              return {
                ...step,
                status: 'Completed',
                actor: technicians[0].name,
                date: new Date().toLocaleDateString()
              };
            }

            return step;
          }),
          comments: [
            ...req.comments,
            {
              id: `com-${Date.now()}`,
              author: currentUser.name,
              text: `Converted to work order ${newWO.id}`,
              date: new Date().toISOString().replace('T', ' ').slice(0, 16)
            }
          ]
        };
      })
    );

    setSelectedWorkOrderId(newWO.id);
    setCurrentTab('work-orders');
    onClose();
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;

    updateRequest((req) => ({
      ...req,
      comments: [
        ...req.comments,
        {
          id: `com-${Date.now()}`,
          author: currentUser.name,
          text: newCommentText,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16)
        }
      ]
    }));

    setNewCommentText('');
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      Low: 'bg-slate-100 text-slate-700',
      Medium: 'bg-blue-50 text-blue-700',
      High: 'bg-amber-50 text-amber-700',
      Critical: 'bg-red-50 text-red-700'
    };

    return styles[priority] || styles.Medium;
  };

  const getStatusStyle = (status) => {
    const styles = {
      Pending: 'bg-amber-50 text-amber-700',
      Approved: 'bg-indigo-50 text-indigo-700',
      Assigned: 'bg-blue-50 text-blue-700',
      Escalated: 'bg-red-50 text-red-700',
      Rejected: 'bg-slate-100 text-slate-500'
    };

    return styles[status] || styles.Pending;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'workflow', label: 'Workflow', icon: Route },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History }
  ];

  const canApprove =
    !isTechnician &&
    request.status === 'Pending';

  const canConvert =
    !isTechnician &&
    (request.status === 'Approved' || request.status === 'Escalated');

  const canEscalate =
    !isTechnician &&
    !['Escalated', 'Assigned', 'Rejected'].includes(request.status);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4">

      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {request.id}
              </span>

              <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusStyle(request.status)}`}>
                {request.status}
              </span>

              <span className={`text-xs px-2 py-1 rounded-full font-bold ${getPriorityStyle(request.priority)}`}>
                {request.priority}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-3">
              {request.title}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {request.department} • {request.location}
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

              {!isTechnician && (
                <div className="flex flex-wrap gap-2">
                  {canApprove && (
                    <>
                      <button
                        onClick={() => handleApproval('Approved')}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>

                      <button
                        onClick={() => handleApproval('Rejected')}
                        className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}

                  {canEscalate && (
                    <button
                      onClick={handleEscalate}
                      className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Escalate
                    </button>
                  )}

                  {canConvert && (
                    <button
                      onClick={handleConvertToWorkOrder}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                    >
                      <Wrench className="h-4 w-4" />
                      Convert to Work Order
                    </button>
                  )}
                </div>
              )}

              {isTechnician && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl text-sm flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5" />
                  Technicians cannot approve or convert requests.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Reporter
                  </span>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {request.reporter}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Department
                  </span>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {request.department}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Location
                  </span>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {request.location}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Date Reported
                  </span>

                  <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">
                    {request.createdAt}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Priority
                  </span>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {request.priority}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Status
                  </span>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {request.status}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <span className="text-xs text-slate-400 font-bold uppercase">
                  Description
                </span>

                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {request.description}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-3">
              {request.approvalSteps.map((step, index) => {
                const complete = step.status === 'Completed';
                const current = step.status === 'Current';

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center ${
                          complete
                            ? 'bg-emerald-600 text-white'
                            : current
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {index + 1}
                      </span>

                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {step.step}
                        </p>

                        <p className="text-xs text-slate-500">
                          {step.actor || 'Pending user action'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-600">
                        {step.status}
                      </p>

                      <p className="text-xs text-slate-400">
                        {step.date || 'Not completed'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">

              <div className="space-y-3">
                {request.comments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    No comments yet.
                  </p>
                ) : (
                  request.comments.map((comment) => (
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
                  Send
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {request.comments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  No history available yet.
                </p>
              ) : (
                request.comments.slice().reverse().map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {comment.text}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {comment.author} • {comment.date}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}