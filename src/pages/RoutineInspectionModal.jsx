import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  ClipboardList,
  ListChecks,
  History,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Wrench
} from 'lucide-react';

export default function RoutineInspectionModal({
  inspection,
  currentUser,
  setRoutineInspections,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const updateInspection = (updater) => {
    setRoutineInspections((prev) =>
      prev.map((rt) => {
        if (rt.id !== inspection.id) return rt;
        return updater(rt);
      })
    );
  };

  const handleToggleCheck = (checkId) => {
    updateInspection((rt) => {
      const updatedChecklist = rt.checklist.map((item) => {
        if (item.id === checkId) {
          return { ...item, checked: !item.checked };
        }

        return item;
      });

      const allChecked = updatedChecklist.every((item) => item.checked);

      return {
        ...rt,
        checklist: updatedChecklist,
        status: allChecked ? 'Pass' : 'Pending'
      };
    });
  };

  const handleUpdateStatus = (status) => {
    updateInspection((rt) => ({
      ...rt,
      status
    }));
  };

  const getStatusStyle = (status) => {
    const styles = {
      Pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Fail: 'bg-red-50 text-red-700 border-red-200',
      Pending: 'bg-amber-50 text-amber-700 border-amber-200'
    };

    return styles[status] || styles.Pending;
  };

  const completedChecks = inspection.checklist.filter((item) => item.checked).length;
  const totalChecks = inspection.checklist.length;
  const complianceScore =
    totalChecks === 0 ? 0 : Math.round((completedChecks / totalChecks) * 100);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'checklist', label: 'Checklist', icon: ListChecks },
    { id: 'history', label: 'History', icon: History },
    { id: 'attachments', label: 'Attachments', icon: Paperclip }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {inspection.id}
              </span>

              <span className={`text-xs px-2 py-1 rounded-full font-bold border ${getStatusStyle(inspection.status)}`}>
                {inspection.status}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-3">
              {inspection.name}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {inspection.frequency} inspection • Next check {inspection.nextCheck}
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
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdateStatus('Pass')}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Audit
                </button>

                <button
                  onClick={() => handleUpdateStatus('Fail')}
                  className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Mark Failed
                </button>

                <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold">
                  <Wrench className="h-4 w-4" />
                  Create Corrective Action
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Frequency
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {inspection.frequency}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Compliance Score
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {complianceScore}%
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Last Check
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">
                    {inspection.lastChecked}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Next Check
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">
                    {inspection.nextCheck}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Checklist Items
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {completedChecks} of {totalChecks} completed
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Inspector
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {currentUser?.name || 'System User'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-3">
              {inspection.checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/60 transition"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleCheck(item.id)}
                    className="mt-1 rounded text-blue-600 cursor-pointer"
                  />

                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        item.checked
                          ? 'text-slate-400 line-through'
                          : 'text-slate-800'
                      }`}
                    >
                      {item.text}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Compliance checkpoint
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-sm font-semibold text-slate-800">
                  Inspection record opened
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Viewed by {currentUser?.name || 'System User'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-sm font-semibold text-slate-800">
                  Last inspection completed
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Date: {inspection.lastChecked}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-sm font-semibold text-slate-800">
                  Next inspection scheduled
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Date: {inspection.nextCheck}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <Paperclip className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                No attachments uploaded
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Audit photos, reports, and compliance documents will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}