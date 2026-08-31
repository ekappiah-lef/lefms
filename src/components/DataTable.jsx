import React from 'react';

export default function DataTable({ headers, children, emptyMessage = 'No matching systems found', emptyIcon: EmptyIcon }) {
  return (
    <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className="px-6 py-3 border-b border-slate-150">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {children}
          </tbody>
        </table>
      </div>
      {React.Children.count(children) === 0 && (
        <div className="text-center py-12 bg-slate-50 border-t border-slate-100">
          {EmptyIcon && <EmptyIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />}
          <p className="text-xs font-semibold text-slate-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
