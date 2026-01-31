import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSyncedData } from '../hooks/useSyncedData';

interface CommandPaletteItem {
  id: string;
  label: string;
  type: 'staff'|'theme'|'evaluation'|'draft'|'action';
  path?: string;
}

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [items, setItems] = React.useState<CommandPaletteItem[]>([]);
  const navigate = useNavigate();
  const { staff=[], themes=[], evaluations=[] } = useSyncedData() || {} as any;

  React.useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v)=>!v);
      }
      if (open && e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [open]);

  React.useEffect(() => {
    const base: CommandPaletteItem[] = [];
    staff.slice(0,500).forEach((s:any)=> base.push({ id: 's-'+s.id, label: `${s.firstName} ${s.lastName}`, type:'staff', path: `/staff?member=${s.id}` }));
    themes.slice(0,500).forEach((t:any)=> base.push({ id: 't-'+t.id, label: `Thème: ${t.name}`, type:'theme', path: `/evaluation?theme=${encodeURIComponent(t.name)}` }));
    evaluations.slice(0,500).forEach((e:any)=> base.push({ id: 'e-'+e.id, label: `Éval: ${e.firstName} ${e.lastName} • ${e.formationTheme}`, type:'evaluation', path: `/statistics?person=${e.staffId}` }));
    base.push({ id: 'a-new-eval', label: 'Nouvelle évaluation', type:'action', path:'/evaluation' });
    base.push({ id: 'a-staff', label: 'Aller à Personnel', type:'action', path:'/staff' });
    base.push({ id: 'a-stats', label: 'Voir Statistiques', type:'action', path:'/statistics' });
    setItems(base);
  }, [staff, themes, evaluations]);

  const filtered = React.useMemo(()=>{
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0,15);
    return items.filter(i=> i.label.toLowerCase().includes(q)).slice(0,20);
  }, [items, query]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-[80]" onClick={()=>setOpen(false)}>
      <div className="mx-auto mt-24 max-w-2xl" onClick={e=>e.stopPropagation()}>
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-3 border-b bg-slate-50">
            <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher (membre, thème, action)..." className="w-full outline-none bg-white px-3 py-2 rounded border border-slate-200 focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="max-h-80 overflow-auto">
            {filtered.length===0 && <div className="p-4 text-slate-500 text-sm">Aucun résultat</div>}
            {filtered.map(i=> (
              <button key={i.id} onClick={()=>{ if(i.path){ navigate(i.path); } setOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100">
                <div className="text-sm font-medium text-slate-800">{i.label}</div>
                <div className="text-xs text-slate-500">{i.type}</div>
              </button>
            ))}
          </div>
          <div className="p-2 text-xs text-slate-500 text-right">Esc pour fermer</div>
        </div>
      </div>
    </div>
  );
};
