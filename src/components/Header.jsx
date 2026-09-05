import React, { useRef } from 'react';
import { 
  Search, 
  X, 
  RefreshCw, 
  Upload, 
  FolderSync, 
  CheckCircle2, 
  Pause, 
  Play, 
  SlidersHorizontal 
} from 'lucide-react';

export default function Header({
  searchQuery,
  onSearchChange,
  syncStatus = {},
  onTriggerSync,
  onUploadFile,
  selectedCategoryName,
  onClearCategory,
  onOpenSyncSettings
}) {
  const fileInputRef = useRef(null);

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const isSyncing = syncStatus.isProcessing || (syncStatus.activeUploads > 0);

  return (
    <header className="h-14 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between gap-4 shrink-0">
      {/* Search Input & Category Filter */}
      <div className="flex items-center space-x-2 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search full-text, titles, or filenames..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {selectedCategoryName && (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-950/60 border border-indigo-700/50 rounded-md text-xs text-indigo-300 font-medium">
            <span>{selectedCategoryName}</span>
            <button onClick={onClearCategory} className="hover:text-white ml-1">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Sync Status Badge & Action Controls */}
      <div className="flex items-center space-x-3">
        {/* Sync Status Badge */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs">
          {isSyncing ? (
            <div className="flex items-center space-x-1.5 text-indigo-400 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing ({syncStatus.queueLength || 1})</span>
            </div>
          ) : !syncStatus.autoSync ? (
            <div className="flex items-center space-x-1.5 text-amber-400">
              <Pause className="w-3.5 h-3.5" />
              <span>Daemon Paused</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Watching {syncStatus.watchedFolders?.length || 0} folders</span>
            </div>
          )}
        </div>

        {/* Sync Now Button */}
        <button
          onClick={onTriggerSync}
          disabled={isSyncing}
          title="Trigger manual directory scan"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Sync Now</span>
        </button>

        {/* Upload Manual File */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
}
