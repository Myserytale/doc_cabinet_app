import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Folder, 
  FolderPlus, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  HardDrive,
  RefreshCw
} from 'lucide-react';

export default function SyncSettingsModal({
  isOpen,
  onClose,
  config = {},
  onSaveConfig
}) {
  const [watchedFolders, setWatchedFolders] = useState([]);
  const [serverUrl, setServerUrl] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [debounceMs, setDebounceMs] = useState(2000);
  const [extensions, setExtensions] = useState([]);
  const [newExt, setNewExt] = useState('');
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (config) {
      setWatchedFolders(config.watchedFolders || []);
      setServerUrl(config.serverUrl || '');
      setAutoSync(config.autoSync !== false);
      setDebounceMs(config.debounceMs || 2000);
      setExtensions(config.extensions || ['.pdf', '.docx', '.doc', '.txt', '.md', '.xlsx', '.csv', '.odt', '.rtf', '.pptx', '.json']);
    }
  }, [config]);

  if (!isOpen) return null;

  const handleAddFolder = async () => {
    if (window.desktopApi?.selectDirectory) {
      const selected = await window.desktopApi.selectDirectory();
      if (selected && !watchedFolders.includes(selected)) {
        setWatchedFolders([...watchedFolders, selected]);
      }
    }
  };

  const handleRemoveFolder = (folder) => {
    setWatchedFolders(watchedFolders.filter((f) => f !== folder));
  };

  const handleAddExtension = (e) => {
    e.preventDefault();
    let ext = newExt.trim().toLowerCase();
    if (!ext) return;
    if (!ext.startsWith('.')) ext = '.' + ext;
    if (!extensions.includes(ext)) {
      setExtensions([...extensions, ext]);
    }
    setNewExt('');
  };

  const handleRemoveExtension = (ext) => {
    setExtensions(extensions.filter((e) => e !== ext));
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      if (window.desktopApi?.testConnection) {
        const res = await window.desktopApi.testConnection(serverUrl, config.token);
        setTestStatus(res.ok ? { success: true, message: 'Server responded healthy' } : { success: false, message: res.error || 'Failed to connect' });
      } else {
        const res = await fetch(`${serverUrl}/actuator/health`);
        setTestStatus(res.ok ? { success: true, message: 'Server responded healthy' } : { success: false, message: 'Server unreachable' });
      }
    } catch (err) {
      setTestStatus({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      watchedFolders,
      serverUrl,
      autoSync,
      debounceMs: Number(debounceMs),
      extensions
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-100">Folder Sync & Daemon Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Watched Folders */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-medium text-slate-200">Watched Directories</h3>
                <p className="text-slate-500 text-[11px]">
                  New documents placed into these folders are automatically hashed and synchronized.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFolder}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Add Folder</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800 bg-slate-950/50">
              {watchedFolders.length === 0 ? (
                <div className="p-4 text-center text-slate-500 italic">
                  No folders added yet. Click 'Add Folder' to select a local directory.
                </div>
              ) : (
                watchedFolders.map((folder) => (
                  <div key={folder} className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center space-x-2 truncate mr-2">
                      <Folder className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-300 truncate">{folder}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFolder(folder)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Auto-Sync Toggle & Debounce */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-slate-200 font-medium">Automatic Inotify Watching</p>
                <p className="text-slate-500 text-[11px]">Sync on filesystem changes</p>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
              <label className="block text-slate-200 font-medium mb-1">Write Debounce (ms)</label>
              <input
                type="number"
                min="500"
                step="500"
                value={debounceMs}
                onChange={(e) => setDebounceMs(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Monitored Extensions */}
          <div>
            <h3 className="text-sm font-medium text-slate-200 mb-1">Monitored File Extensions</h3>
            <p className="text-slate-500 text-[11px] mb-2">
              Only files matching these extensions will be evaluated and synced.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {extensions.map((ext) => (
                <span
                  key={ext}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700/60"
                >
                  <span>{ext}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExtension(ext)}
                    className="hover:text-rose-400 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddExtension} className="flex space-x-2">
              <input
                type="text"
                placeholder=".ext (e.g. .pdf)"
                value={newExt}
                onChange={(e) => setNewExt(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono w-44"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                Add Extension
              </button>
            </form>
          </div>

          {/* Homelab Server Endpoint */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-200 font-medium">Homelab Server URL</label>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            {testStatus && (
              <p className={`text-[11px] flex items-center space-x-1 ${testStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                {testStatus.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{testStatus.message}</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-slate-400 hover:text-white text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
}
