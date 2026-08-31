import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Eye,
  Plus,
  Download,
  CalendarDays
} from 'lucide-react';
import RoutineInspectionModal from '../pages/RoutineInspectionModal';

export default function RoutineMaintenance({
  currentUser,
  routineInspections,
  setRoutineInspections
}) {
  const [selectedRoutineId, setSelectedRoutineId] = useState(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const selectedRoutine = useMemo(() => {
    return routineInspections.find((rt) => rt.id === selectedRoutineId) || null;
  }, [routineInspections, selectedRoutineId]);

  const filteredInspections = useMemo(() => {
    return routineInspections.filter((rt) => {
      const search = searchText.toLowerCase();

      const matchesSearch =
        rt.id.toLowerCase().includes(search) ||
        rt.name.toLowerCase().includes(search) ||
        rt.frequency.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === 'All' || rt.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [routineInspections, searchText, statusFilter]);

  const totalAudits = routineInspections.length;
  const passedAudits = routineInspections.filter((x) => x.status === 'Pass').length;
  const pendingAudits = routineInspections.filter((x) => x.status === 'Pending').length;
  const failedAudits = routineInspections.filter((x) => x.status === 'Fail').length;

  const statusStyles = {
    Pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Fail: 'bg-red-50 text-red-700 border-red-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200'
  };

  const openInspection = (id) => {
    setSelectedRoutineId(id);
    setShowInspectionModal(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Total Audits</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">{totalAudits}</h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Passed</p>
          <h2 className="text-2xl font-bold text-emerald-600 mt-2">{passedAudits}</h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Pending</p>
          <h2 className="text-2xl font-bold text-amber-600 mt-2">{pendingAudits}</h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Failed</p>
          <h2 className="text-2xl font-bold text-red-600 mt-2">{failedAudits}</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Safety Audits & Compliance
            </h3>
           
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg">
              <Plus className="h-4 w-4" />
              New Audit
            </button>

            <button className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-slate-50">
              <Download className="h-4 w-4" />
              Export
            </button>

            <button className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-slate-50">
              <CalendarDays className="h-4 w-4" />
              Calendar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-5 border-b border-slate-100 bg-slate-50/60">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

            <input
              type="text"
              placeholder="Search audits..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg">
            <Filter className="h-4 w-4 text-slate-400" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-0 text-xs text-slate-700 focus:outline-none w-full font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Pass">Passed</option>
              <option value="Pending">Pending</option>
              <option value="Fail">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b border-slate-200">
              <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-bold whitespace-nowrap">Audit ID</th>
                <th className="px-5 py-3 font-bold">Inspection</th>
                <th className="px-5 py-3 font-bold whitespace-nowrap">Frequency</th>
                <th className="px-5 py-3 font-bold whitespace-nowrap">Last Check</th>
                <th className="px-5 py-3 font-bold whitespace-nowrap">Next Check</th>
                <th className="px-5 py-3 font-bold whitespace-nowrap">Status</th>
                <th className="px-5 py-3 font-bold text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-14 text-center">
                    <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">
                      No safety audits found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try changing the search or filters
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInspections.map((rt) => (
                  <tr
                    key={rt.id}
                    onClick={() => openInspection(rt.id)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs font-bold text-blue-600 whitespace-nowrap">
                      {rt.id}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 truncate max-w-[420px]">
                        {rt.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Checklist items: {rt.checklist?.length || 0}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                      {rt.frequency}
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {rt.lastChecked}
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {rt.nextCheck}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusStyles[rt.status]}`}>
                        {rt.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openInspection(rt.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showInspectionModal && selectedRoutine && (
        <RoutineInspectionModal
          inspection={selectedRoutine}
          currentUser={currentUser}
          setRoutineInspections={setRoutineInspections}
          onClose={() => {
            setShowInspectionModal(false);
            setSelectedRoutineId(null);
          }}
        />
      )}
    </div>
  );
}