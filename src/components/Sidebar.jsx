import React from 'react';
import { 
  FolderSync, 
  Files, 
  Tag, 
  Activity, 
  Settings, 
  LogOut, 
  Server, 
  CheckCircle2, 
  AlertCircle,
  FolderOpen
} from 'lucide-react';

export default function Sidebar({
  categories = [],
  selectedCategory,
  onSelectCategory,
  totalDocuments = 0,
  syncStatus = {},
  onOpenSyncSettings,
  onOpenHistory,
  onLogout,
  username = '',
  serverUrl = ''
}) {
  const isOnline = syncStatus.hasToken;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
            DV
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-white">DocVault</h1>
            <p className="text-xs text-slate-400 font-mono">Desktop Client</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Nav */}
        <div>
          <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Documents
          </p>
          <button
            onClick={() => onSelectCategory(null)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Files className="w-4 h-4" />
              <span>All Documents</span>
            </div>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
              {totalDocuments}
            </span>
          </button>
        </div>

        {/* Categories */}
        <div>
          <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Categories
          </p>
          <div className="space-y-1">
            {categories.length === 0 ? (
              <p className="px-2 py-1 text-xs text-slate-500 italic">No categories yet</p>
            ) : (
              categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || '#6366f1' }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span className="text-xs bg-slate-800/70 px-1.5 py-0.5 rounded text-slate-400 font-mono ml-2">
                      {cat.documentCount || 0}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Folder Sync Section */}
        <div>
          <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Auto-Sync Daemon
          </p>
          <div className="space-y-1">
            <button
              onClick={onOpenSyncSettings}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <FolderOpen className="w-4 h-4 text-slate-400" />
                <span>Watched Folders</span>
              </div>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                {syncStatus.watchedFolders?.length || 0}
              </span>
            </button>

            <button
              onClick={onOpenHistory}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <Activity className="w-4 h-4 text-slate-400" />
                <span>Sync Activity</span>
              </div>
              {syncStatus.queueLength > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono">
                  {syncStatus.queueLength}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* User & Server Status Footer */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <div className="px-2 py-1.5 rounded bg-slate-950/50 border border-slate-800/80 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400">Server</span>
            <span className="flex items-center text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Connected
            </span>
          </div>
          <div className="truncate text-slate-400 font-mono text-[11px]">
            {serverUrl.replace(/^https?:\/\//, '')}
          </div>
        </div>

        <div className="flex items-center justify-between px-2 py-1">
          <div className="truncate">
            <p className="text-xs font-medium text-slate-200 truncate">{username || 'Anonymous'}</p>
            <p className="text-[10px] text-slate-500">Local Daemon</p>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onOpenSyncSettings}
              title="Daemon Settings"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
