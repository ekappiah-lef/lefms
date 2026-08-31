import React from 'react';

export default function DashboardCard({ title, subtitle, extraHeader, children, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-3xs overflow-hidden flex flex-col ${className}`}>
      {(title || subtitle || extraHeader) && (
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            {title && <h3 className="text-sm font-bold text-slate-800">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {extraHeader && <div className="text-xs">{extraHeader}</div>}
        </div>
      )}
      <div className="flex-1 p-5">
        {children}
      </div>
    </div>
  );
}
