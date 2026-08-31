import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtitle, trend, trendColor, activeColor, onClick, actionElement }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-3xs hover:shadow-2xs transition-all relative overflow-hidden group ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">{title}</span>
        {Icon && (
          <div className={`p-1 px-1.5 rounded ${activeColor || 'bg-slate-50 text-slate-650'}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900">{value}</span>
          {trend && (
            <span className={`text-xs font-semibold ${trendColor || 'text-slate-500'}`}>{trend}</span>
          )}
        </div>
        {subtitle && <p className="text-[10px] text-slate-400 mt-1 font-medium">{subtitle}</p>}
      </div>
      {actionElement}
      <div className="absolute right-0 bottom-0 h-1 w-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
}
