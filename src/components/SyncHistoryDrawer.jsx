import React from 'react';
import { 
  X, 
  Activity, 
  CheckCircle2, 
  Copy, 
  FileText, 
  AlertTriangle, 
  Filter 
} from 'lucide-react';

export default function SyncHistoryDrawer({
  isOpen,
  onClose,
  history = []
}) {
  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'uploaded':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Uploaded
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-sky-500/15 text-sky-400 border border-sky-500/30">
            Deduplicated
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString();
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col select-none">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-100">Sync Event Log</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content: History Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs italic">
            No synchronization activity recorded in this session.
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id || item.timestamp}
              className="p-3 rounded-lg bg-slate-950 border border-slate-800/90 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                {getStatusBadge(item.status)}
                <span className="text-[10px] font-mono text-slate-500">
                  {formatTime(item.timestamp)}
                </span>
              </div>

              <div className="font-medium text-slate-200 truncate">
                {item.fileName || item.filePath?.split('/').pop()}
              </div>

              <div className="text-[11px] text-slate-400 leading-snug">
                {item.message}
              </div>

              {item.categoryName && (
                <div className="text-[10px] text-indigo-400 font-medium">
                  Category: {item.categoryName}
                </div>
              )}

              {item.filePath && (
                <div className="font-mono text-[10px] text-slate-500 truncate" title={item.filePath}>
                  {item.filePath}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center">
        <p className="text-[11px] text-slate-500">
          Showing latest {history.length} events (retained in memory)
        </p>
      </div>
    </div>
  );
}
