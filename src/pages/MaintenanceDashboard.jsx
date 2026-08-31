import React from 'react';
import WorkOrders from './WorkOrders';
import MaintenanceRequests from './MaintenanceRequests';
import PreventiveMaintenance from './PreventiveMaintenance';
import RoutineMaintenance from './RoutineMaintenance';
import Projects from './Projects';
import Reports from './Reports';

export default function MaintenanceDashboard({ currentTab, ...props }) {
  switch (currentTab) {
    case 'work-orders':
      return <WorkOrders {...props} />;
    case 'requests':
      return <MaintenanceRequests {...props} />;
    case 'preventive':
      return <PreventiveMaintenance {...props} />;
    case 'routine':
      return <RoutineMaintenance {...props} />;
    case 'projects':
      return <Projects {...props} />;
    case 'reports':
      return <Reports {...props} />;
    default:
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          Select a maintenance system option from the sidebar to view metrics, rosters, and calendars.
        </div>
      );
  }
}
