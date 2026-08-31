import React, { useMemo } from 'react';
import {
  Wrench,
  FileText,
  Clock,
  Briefcase,
  Layers,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { MOCK_TECHNICIANS } from '../data/mockData';

export default function Dashboard({
  workOrders,
  preventiveTasks,
  requests,
  projects,
  completedTasksCount,
  setCurrentTab,
  setSelectedWorkOrderId,
}) {

  // 1. Calculate Summary Cards statistics dynamically
  const stats = useMemo(() => {
    const openWOs = workOrders.filter((wo) => wo.status === 'Open' || wo.status === 'In Progress').length;
    const pendingRequests = requests.filter((r) => r.status === 'Pending').length;
    const upcomingPMs = preventiveTasks.filter((t) => t.status === 'Pending').length;
    const activeTechs = MOCK_TECHNICIANS.length;
    const ongoingProjects = projects.filter((p) => p.status === 'In Progress' || p.status === 'Planning').length;
    const completedTasks = workOrders.filter((wo) => wo.status === 'Completed').length + completedTasksCount;

    return {
      openWOs,
      pendingRequests,
      upcomingPMs,
      activeTechs,
      ongoingProjects,
      completedTasks,
    };
  }, [workOrders, preventiveTasks, requests, projects, completedTasksCount]);

  // 2. Prepare charts data
  const statusChartData = useMemo(() => {
    const counts = { Open: 0, 'In Progress': 0, 'On Hold': 0, Completed: 0 };
    workOrders.forEach((wo) => {
      if (counts[wo.status] !== undefined) {
        counts[wo.status]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [workOrders]);

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981']; // blue, orange, red, green

  // 2.2 Monthly Maintenance Activities (Historical Simulation + Current)
  const monthlyActivitiesData = [
    { month: 'Jan', preventive: 14, corrective: 21 },
    { month: 'Feb', preventive: 18, corrective: 19 },
    { month: 'Mar', preventive: 22, corrective: 24 },
    { month: 'Apr', preventive: 25, corrective: 15 },
    { month: 'May', preventive: 30, corrective: 18 },
    { month: 'Jun', preventive: preventiveTasks.filter(t => t.status === 'Completed').length + 8, corrective: workOrders.filter(wo => wo.status === 'Completed').length + 10 },
  ];

  // 2.3 Technician Workload
  const technicianWorkloadData = useMemo(() => {
    const workloadMap = {};
    
    // Initialize
    MOCK_TECHNICIANS.forEach((tech) => {
      workloadMap[tech.id] = { name: tech.name.split(' ')[0], active: 0, completed: 0 };
    });

    workOrders.forEach((wo) => {
      if (workloadMap[wo.technicianId]) {
        if (wo.status === 'Completed') {
          workloadMap[wo.technicianId].completed++;
        } else {
          workloadMap[wo.technicianId].active++;
        }
      }
    });

    return Object.values(workloadMap);
  }, [workOrders]);

  // 3. Prepare Upcoming Activities
  const upcomingActivitiesList = useMemo(() => {
    const pmActivities = preventiveTasks
      .filter((task) => task.status === 'Pending')
      .map((t) => ({
        date: t.date,
        activity: `[Preventive] ${t.activity}`,
        assignedTo: t.assignedTo,
        status: 'Scheduled',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      }));

    const woActivities = workOrders
      .filter((wo) => wo.status !== 'Completed')
      .map((w) => {
        const assignedTech = MOCK_TECHNICIANS.find(t => t.id === w.technicianId)?.name || 'Unassigned';
        return {
          date: w.dueDate,
          activity: `[Work Order] ${w.title}`,
          assignedTo: assignedTech,
          status: w.status,
          badgeColor: w.status === 'In Progress' ? 'bg-amber-50 text-gray-700 border-amber-200 font-bold' : 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
        };
      });

    return [...pmActivities, ...woActivities]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [preventiveTasks, workOrders]);

  const handleRowClick = (woId) => {
    setSelectedWorkOrderId(woId);
    setCurrentTab('work-orders');
  };

  return (
    <div className="space-y-6" id="executive-dashboard-view">
  

      {/* Stats summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Open WOs */}
        <div
          onClick={() => setCurrentTab('work-orders')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs hover:shadow-xs transition-shadow cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Open Work Orders</span>
           
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{stats.openWOs}</h3>
            <span className="text-[10px] text-green-600 font-medium">+4 today</span>
          </div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Pending Maintenance Requests */}
        <div
          onClick={() => setCurrentTab('requests')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs hover:shadow-xs transition-shadow cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Pending Requests</span>
           
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{stats.pendingRequests}</h3>
            <span className="text-[10px] text-amber-600 font-medium">3 High Priority</span>
          </div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Upcoming Preventive Maintenance */}
        <div
          onClick={() => setCurrentTab('preventive')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs hover:shadow-xs transition-shadow cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Scheduled PMs</span>
            
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{stats.upcomingPMs}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Due this week</span>
          </div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Active Technicians */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Active Crews</span>
            
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{stats.activeTechs}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Certified Techs</span>
          </div>
          
          
        </div>

        {/* Ongoing Projects */}
        <div
          onClick={() => setCurrentTab('projects')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs hover:shadow-xs transition-shadow cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Active Projects</span>
           
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{stats.ongoingProjects}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Infrastructure level</span>
          </div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Completed Tasks - Styled precisely after fleet efficiency (high contrast dark slate style) */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Completed Work</span>
          
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white">{stats.completedTasks}</h3>
           
          </div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>

      {/* Visual analytics segment (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Orders by Status Pie */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs flex flex-col h-[320px]">
          <h4 className="text-sm font-bold text-slate-800 mb-2">Work Orders by Status</h4>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
               <Tooltip
                cursor={false}
                formatter={(value) => [`${value} Work Orders`, 'Count']}
                contentStyle={{
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
              />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Maintenance Activities Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs flex flex-col h-[320px]">
          <h4 className="text-sm font-bold text-slate-800 mb-2">Monthly Maintenance Tasks</h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={monthlyActivitiesData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="preventive" name="Preventive" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="corrective" name="Corrective/WO" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Technician Workload Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs flex flex-col h-[320px]">
          <h4 className="text-sm font-bold text-slate-800 mb-2">Technician Active Workload</h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={technicianWorkloadData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="active" name="In Progress" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="completed" name="Closed Work" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Operational Task grids (Tables) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Work Orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-800">Recent Work Orders</h4>
            </div>
            <button
              onClick={() => setCurrentTab('work-orders')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-0.5 hover:underline"
            >
              See all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3 rounded-l-lg">WO Number</th>
                  <th className="py-2.5 px-3">Equipment</th>
                  <th className="py-2.5 px-3">Technician</th>
                  <th className="py-2.5 px-3 text-center">Priority</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workOrders.slice(0, 5).map((wo) => {
                  const tech = MOCK_TECHNICIANS.find((t) => t.id === wo.technicianId);
                  const priorityStyles = {
                    Low: 'bg-slate-100 text-slate-600',
                    Medium: 'bg-blue-50 text-blue-600',
                    High: 'bg-orange-50 text-orange-600',
                    Critical: 'bg-red-50 text-red-600'
                  };
                  const statusStyles = {
                    Open: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
                    'In Progress': 'bg-amber-100 text-amber-800 ring-1 ring-amber-600/20',
                    'On Hold': 'bg-slate-100 text-slate-700 ring-1 ring-slate-600/10',
                    Completed: 'bg-gray-50 text-gray-500 line-through'
                  };

                  return (
                    <tr
                      key={wo.id}
                      onClick={() => handleRowClick(wo.id)}
                      className="hover:bg-slate-50/85 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 font-semibold text-blue-600 group-hover:underline font-mono">
                        {wo.id}
                      </td>
                      <td className="py-3 px-3 max-w-[150px] truncate">
                        <div className="font-medium text-slate-800">{wo.equipment}</div>
                        <div className="text-[10px] text-slate-400">{wo.location}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                        
                          <span className="font-medium text-slate-600 text-[11px]">{tech?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityStyles[wo.priority]}`}>
                          {wo.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyles[wo.status]}`}>
                          {wo.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Activities Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-800">Upcoming Operations & Preventive Schedule</h4>
            </div>
            <button
              onClick={() => setCurrentTab('preventive')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-0.5 hover:underline"
            >
              Calendar View <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3 rounded-l-lg">Date</th>
                  <th className="py-2.5 px-3">Activity description</th>
                  <th className="py-2.5 px-3">Responsibile Owner</th>
                  <th className="py-2.5 px-3 text-center rounded-r-lg">Type Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingActivitiesList.map((act, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-500 whitespace-nowrap">
                      {act.date}
                    </td>
                    <td className="py-3 px-3 max-w-[200px] truncate font-medium text-slate-800">
                      {act.activity}
                    </td>
                    <td className="py-3 px-3SourcePath whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        <span>{act.assignedTo}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold ${act.badgeColor}`}>
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

   
    </div>
  );
}
