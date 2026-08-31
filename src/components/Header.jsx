import React, { useState } from 'react';
import { ChevronDown, CheckCircle, LogOut, UserCog } from 'lucide-react';
import { MOCK_USERS } from '../data/mockData';
import { moduleById } from '../config/platform';

export default function Header({ currentUser, onUserChange, currentTab, users = MOCK_USERS, onLogout }) {
  const [showProfile, setShowProfile] = useState(false);
  const title = currentTab === 'dashboard' ? 'Hospital Dashboard' : moduleById(currentTab)?.label || 'Workspace';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <div className="text-[11px] text-slate-400 font-medium">The Bank Hospital · Accra</div>
        <h2 className="text-sm font-display font-extrabold leading-none" style={{ color: '#0b1c30' }}>{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100">
            <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: '#0b1c30' }}>{currentUser.avatar}</div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-[13px] font-bold text-slate-800 leading-tight">{currentUser.name}</span>
              <span className="text-[11px] text-slate-500">{currentUser.role}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-xl z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-sm font-bold text-slate-800">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500">{currentUser.role}</div>
              </div>

              <div className="max-h-[46vh] overflow-y-auto">
                <div className="px-4 pt-2 pb-1 text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5"><UserCog className="h-3.5 w-3.5" /> Switch role (demo)</div>
                {users.map((u) => (
                  <button key={u.id} onClick={() => { onUserChange(u); setShowProfile(false); }} className={`w-full flex items-center justify-between px-3 py-2 text-sm ${currentUser.id === u.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-600">{u.avatar}</div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-800 leading-tight">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.role}</div>
                      </div>
                    </div>
                    {currentUser.id === u.id && <CheckCircle className="h-4 w-4 text-blue-600" />}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 p-2">
                <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
