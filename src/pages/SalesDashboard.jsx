import React from 'react';
import { UserPlus, Compass, DollarSign, Plus, Lock, ArrowUpRight } from 'lucide-react';

export default function SalesDashboard() {
  return (  
 <div className="space-y-6 animate-in fade-in duration-200" id="hr-placeholder-container">
      {/* Dynamic Future Phase Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 border border-slate-850 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center space-x-1 font-semibold text-[10px] tracking-widest text-blue-400 uppercase bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-900">
            Phase 2 Expansion Scope
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-tight">
            Sales Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed font-medium">
Manage leads, opportunities, customer accounts, quotations, and sales performance from a single workspace. Gain actionable insights to drive revenue growth and improve customer relationships.
          </p>
          
      
        </div>
      </div>

    </div>
  );
}
