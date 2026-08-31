import React, { useState } from 'react';
import {
  X,
  Clock,
  ClipboardList,
  ListChecks,
  CalendarDays,
  History,
  CheckCircle2,
  Wrench
} from 'lucide-react';

export default function PreventiveMaintenanceModal({
  task,
  currentUser,
  setPreventiveTasks,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const updateTask = (updater) => {
    setPreventiveTasks((prev) =>
      prev.map((pm) => {
        if (pm.id !== task.id) return pm;
        return updater(pm);
      })
    );
  };

  const handleToggleCheck = (checkId) => {
    updateTask((pm) => {
      const updatedChecklist = pm.checklist.map((item) => {
        if (item.id === checkId) {
          return { ...item, checked: !item.checked };
        }

        return item;
      });

      return {
        ...pm,
        checklist: updatedChecklist
      };
    });
  };

  const handleCompletePM = () => {
    updateTask((pm) => ({
      ...pm,
      status: 'Completed',
      checklist: pm.checklist.map((item) => ({
        ...item,
        checked: true
      }))
    }));
  };

  const getStatusStyle = (status) => {
    const styles = {
      Pending: 'bg-amber-50 text-amber-700',
      Completed: 'bg-emerald-50 text-emerald-700',
      Overdue: 'bg-red-50 text-red-700'
    };

    return styles[status] || styles.Pending;
  };

  const completedChecks = task.checklist.filter((item) => item.checked).length;
  const totalChecks = task.checklist.length;
  const progress =
    totalChecks === 0 ? 0 : Math.round((completedChecks / totalChecks) * 100);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'checklist', label: 'Checklist', icon: ListChecks },
    { id: 'schedule', label: 'Schedule', icon: CalendarDays },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4">

      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {task.id}
              </span>

              <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusStyle(task.status)}`}>
                {task.status}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-3">
              {task.activity}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {task.equipment} • {task.type} maintenance
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
                  onClick={handleCompletePM}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Complete
                </button>

                <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold">
                  <Wrench className="h-4 w-4" />
                  Generate Work Order
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Equipment
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {task.equipment}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Frequency
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {task.type}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Assigned To
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {task.assignedTo}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Due Date
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">
                    {task.date}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Recurring
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {task.recurring ? 'Yes' : 'No'}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    Checklist Progress
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {completedChecks} of {totalChecks} completed ({progress}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-3">
              {task.checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/60 transition"
                >
                  <input
                    type="checkbox"
                    checked={item.checked || task.status === 'Completed'}
                    disabled={task.status === 'Completed'}
                    onChange={() => handleToggleCheck(item.id)}
                    className="mt-1 rounded text-blue-600 cursor-pointer"
                  />

                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        item.checked || task.status === 'Completed'
                          ? 'text-slate-400 line-through'
                          : 'text-slate-800'
                      }`}
                    >
                      {item.text}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Preventive maintenance checkpoint
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-xs text-slate-400 font-bold uppercase">
                  Schedule Type
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                  {task.type}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-xs text-slate-400 font-bold uppercase">
                  Next Due Date
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">
                  {task.date}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-xs text-slate-400 font-bold uppercase">
                  Assigned Technician
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                  {task.assignedTo}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-xs text-slate-400 font-bold uppercase">
                  Plan Status
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                  {task.status}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-sm font-semibold text-slate-800">
                  PM plan opened
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Viewed by {currentUser?.name || 'System User'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-sm font-semibold text-slate-800">
                  Schedule registered
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Frequency: {task.type} • Due: {task.date}
                </p>
              </div>

              {task.status === 'Completed' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-sm font-semibold text-emerald-800">
                    Preventive maintenance completed
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Completed by {currentUser?.name || 'System User'}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}