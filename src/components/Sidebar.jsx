import React, { useState } from 'react';
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
  FolderOpen,
  Plus,
  Trash2,
  Check,
  X
} from 'lucide-react';

export default function Sidebar({
  categories = [],
  selectedCategory,
  onSelectCategory,
  onCreateCategory,
  onDeleteCategory,
  watchedFolders = [],
  selectedFolder = null,
  onSelectFolder,
  totalDocuments = 0,
  syncStatus = {},
  onOpenSyncSettings,
  onOpenHistory,
  onOpenLogin,
  onLogout,
  username = '',
  serverUrl = ''
}) {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  const handleCreateCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || isSubmittingCat) return;
    setIsSubmittingCat(true);
    try {
      if (onCreateCategory) {
        await onCreateCategory(newCategoryName.trim(), newCategoryColor);
      }
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (err) {
      alert('Failed to create category: ' + err.message);
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const activeFolders = (watchedFolders && watchedFolders.length > 0)
    ? watchedFolders
    : (syncStatus.watchedFolders || []);

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
            onClick={() => {
              onSelectCategory(null);
              if (onSelectFolder) onSelectFolder(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === null && selectedFolder === null
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
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Categories
            </p>
            <button
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              title="Add Category"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Category Inline Form */}
          {isAddingCategory && (
            <form onSubmit={handleCreateCategorySubmit} className="p-2 mb-2 rounded-md bg-slate-950 border border-slate-800 space-y-2">
              <input
                type="text"
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  {['#6366f1', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCategoryColor(c)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        newCategoryColor === c
                          ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-950'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="submit"
                    disabled={!newCategoryName.trim() || isSubmittingCat}
                    className="p-1 text-indigo-400 hover:text-indigo-300 rounded hover:bg-indigo-950/40 disabled:opacity-40"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-1">
            {categories.length === 0 ? (
              <p className="px-2 py-1 text-xs text-slate-500 italic">No categories yet</p>
            ) : (
              categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <button
                      onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                      className="flex-1 flex items-center space-x-2.5 truncate text-left"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || '#6366f1' }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </button>
                    <div className="flex items-center space-x-1 ml-2 shrink-0">
                      <span className="text-xs bg-slate-800/70 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                        {cat.documentCount || 0}
                      </span>
                      {onDeleteCategory && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete category "${cat.name}"? Any documents in this category will become uncategorized.`)) {
                              onDeleteCategory(cat.id);
                            }
                          }}
                          title="Delete category"
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Watched Folders Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Watched Folders
            </p>
            <button
              onClick={onOpenSyncSettings}
              title="Configure watched folders"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {activeFolders.length === 0 ? (
              <button
                onClick={onOpenSyncSettings}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-500 hover:text-slate-300 italic"
              >
                + Add a watched folder
              </button>
            ) : (
              activeFolders.map((folder) => {
                const folderName = folder.replace(/\/$/, '').split('/').pop() || folder;
                const isSelected = selectedFolder === folder;
                return (
                  <button
                    key={folder}
                    onClick={() => {
                      if (onSelectFolder) {
                        onSelectFolder(isSelected ? null : folder);
                      }
                    }}
                    title={folder}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{folderName}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] text-indigo-400 font-mono shrink-0 ml-1">
                        Active
                      </span>
                    )}
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
                <FolderSync className="w-4 h-4 text-slate-400" />
                <span>Daemon Settings</span>
              </div>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                {activeFolders.length}
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

          {syncStatus.isTokenExpired && (
            <button
              onClick={onOpenLogin}
              className="w-full mt-2 px-2 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium text-left flex items-center justify-between hover:bg-amber-500/25 transition-colors"
            >
              <span>Session Expired</span>
              <span className="underline">Sign In</span>
            </button>
          )}
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
