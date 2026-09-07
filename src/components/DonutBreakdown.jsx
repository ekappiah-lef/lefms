import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { SectionCard } from './ui';

// Same visual language as the installed Creative Tim "donut-chart-breakdown"
// block (center total + a legend of dot/name/percentage/value/progress-bar
// rows) but built to take our own real data, not a fixed demo dataset.
export default function DonutBreakdown({ title, subtitle, data, totalLabel = 'Total', formatValue = (v) => v }) {
  const [active, setActive] = useState(null);
  const filtered = data.filter((d) => d.value > 0);
  const total = filtered.reduce((s, d) => s + d.value, 0);

  return (
    <SectionCard title={title} className="h-full">
      {subtitle && <p className="text-[12px] text-slate-400 -mt-3 mb-4">{subtitle}</p>}
      {total === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">No data yet.</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
          <div className="relative h-44 w-44 shrink-0 mx-auto sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={filtered} cx="50%" cy="50%" innerRadius="62%" outerRadius="85%" dataKey="value" strokeWidth={0} paddingAngle={3}
                  onMouseEnter={(_, idx) => setActive(filtered[idx].name)} onMouseLeave={() => setActive(null)}>
                  {filtered.map((d) => <Cell key={d.name} fill={d.color} opacity={active === null || active === d.name ? 1 : 0.35} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-display font-black text-slate-900">{formatValue(total)}</span>
              <span className="text-[11px] text-slate-400 font-semibold">{totalLabel}</span>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 min-w-0">
            {filtered.map((d) => (
              <div key={d.name} className="cursor-default" onMouseEnter={() => setActive(d.name)} onMouseLeave={() => setActive(null)}>
                <div className="flex items-center justify-between text-[13px] mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className={`font-medium truncate ${active === d.name ? 'text-slate-900' : 'text-slate-600'}`}>{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-400 text-[11px]">{((d.value / total) * 100).toFixed(0)}%</span>
                    <span className="font-bold text-slate-800 tabular-nums">{formatValue(d.value)}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(d.value / total) * 100}%`, background: d.color, opacity: active === null || active === d.name ? 1 : 0.35 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
