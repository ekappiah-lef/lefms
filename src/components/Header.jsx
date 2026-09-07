import React, { useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { moduleById } from '../config/platform';

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export default function Header({ currentUser, currentTab, onLogout }) {
  const [open, setOpen] = useState(false);
  const title = currentTab === 'dashboard' ? 'Overview' : moduleById(currentTab)?.label || 'Workspace';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-400 font-medium truncate">LEF MS {currentUser.regionName ? `· ${currentUser.regionName}` : ''}</div>
          <h2 className="text-sm font-display font-extrabold leading-none truncate text-slate-900">{title}</h2>
        </div>
      </div>

      <div className="relative">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100">
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-xs bg-primary">{initials(currentUser.fullName)}</div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-[13px] font-bold text-slate-800 leading-tight">{currentUser.fullName}</span>
            <span className="text-[11px] text-slate-500">{currentUser.role}{currentUser.regionName ? ` · ${currentUser.regionName}` : ''}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-xl z-50">
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="text-sm font-bold text-slate-800">{currentUser.fullName}</div>
              <div className="text-[11px] text-slate-500">{currentUser.staffNo} · {currentUser.email}</div>
            </div>
            <div className="p-2">
              <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
