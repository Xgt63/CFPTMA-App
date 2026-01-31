import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSyncedData } from '../hooks/useSyncedData';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export const GlobalStatusBar: React.FC = () => {
  const { user } = useAuth();
  const { isLoading, syncVersion } = useSyncedData() || { isLoading: false, syncVersion: 0 } as any;
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ls = localStorage.getItem('lastSavedAt');
    if (ls) setLastSaved(ls);
    const handler = (e: any) => {
      const at = e?.detail?.at || new Date().toISOString();
      setLastSaved(at);
    };
    window.addEventListener('save-status-updated', handler as any);
    return () => window.removeEventListener('save-status-updated', handler as any);
  }, []);

  const timeLabel = React.useMemo(() => {
    if (!lastSaved) return '—';
    try { return format(new Date(lastSaved), 'HH:mm'); } catch { return lastSaved; }
  }, [lastSaved]);

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
        <span className="font-medium">{user?.firstName} {user?.lastName}</span>
      </div>
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
        {isLoading ? <RefreshCw className="h-4 w-4 animate-spin text-blue-600"/> : <CheckCircle className="h-4 w-4 text-green-600"/>}
        <span className="font-medium">Sync v{syncVersion}</span>
      </div>
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
        <CheckCircle className="h-4 w-4 text-green-600"/>
        <span>Auto‑save OK à <span className="font-semibold">{timeLabel}</span></span>
      </div>
    </div>
  );
};
