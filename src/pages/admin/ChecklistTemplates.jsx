import React, { useEffect, useState } from 'react';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { PageHeader, SectionCard, Button, IconBtn, Badge } from '../../components/ui';
import { api } from '../../api/client';

// Administrator (and, for EHS, EHS User)-managed global checklist
// questions   either the standing PM checklist copied onto every new
// PM-type work order, or the EHS checklist copied onto every work
// order's linked EHS record, both at creation time.
export default function ChecklistTemplates({ kind = 'wo', title, subtitle }) {
  const client = kind === 'ehs' ? api.ehsChecklistTemplates : api.woChecklistTemplates;
  const [items, setItems] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = () => client.list(true).then(setItems);
  useEffect(() => { refresh(); }, [kind]);

  const add = async () => {
    if (!newQuestion.trim()) return;
    setBusy(true);
    try {
      await client.create({ question: newQuestion.trim(), sortOrder: items.length });
      setNewQuestion('');
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (item) => { await client.update(item.id, { isActive: !item.isActive }); refresh(); };
  const remove = async (item) => { if (window.confirm('Remove this question? Existing records keep their already-copied checklist.')) { await client.remove(item.id); refresh(); } };

  return (
    <div className="space-y-5">
      <PageHeader title={title} subtitle={subtitle} />

      <SectionCard title="Questions">
        <div className="space-y-2 mb-4">
          {items.length === 0 && <p className="text-sm text-slate-400">No checklist questions yet.</p>}
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
              <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
              <span className="text-[11px] text-slate-400 font-bold w-5 shrink-0">{i + 1}.</span>
              <span className={`flex-1 text-[13px] ${item.isActive ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{item.question}</span>
              <button onClick={() => toggleActive(item)}>
                <Badge tone={item.isActive ? 'green' : 'slate'}>{item.isActive ? 'Active' : 'Inactive'}</Badge>
              </button>
              <IconBtn icon={Trash2} tone="danger" title="Remove" onClick={() => remove(item)} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add a new checklist question…" className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
          <Button icon={Plus} onClick={add} disabled={!newQuestion.trim() || busy}>Add Question</Button>
        </div>
      </SectionCard>
    </div>
  );
}
