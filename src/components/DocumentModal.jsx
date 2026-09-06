import React, { useState } from 'react';
import { 
  X, 
  Download, 
  RefreshCw, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  HardDrive, 
  FileText, 
  Calendar, 
  Hash, 
  Layers 
} from 'lucide-react';

export default function DocumentModal({
  document,
  categories = [],
  onClose,
  onDownload,
  onDelete,
  onReindex,
  onUpdateCategory
}) {
  const [copied, setCopied] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  if (!document) return null;

  const handleCopyChecksum = () => {
    if (document.checksum) {
      navigator.clipboard.writeText(document.checksum);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      await onReindex(document.id);
    } finally {
      setIsReindexing(false);
    }
  };

  const handleOpenLocal = () => {
    if (document.sourcePath && window.desktopApi?.openPath) {
      window.desktopApi.openPath(document.sourcePath);
    }
  };

  const handleRevealFolder = () => {
    if (document.sourcePath && window.desktopApi?.showItemInFolder) {
      window.desktopApi.showItemInFolder(document.sourcePath);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h2 className="text-base font-semibold text-slate-100 truncate">
                {document.title || document.originalFilename}
              </h2>
              <p className="text-xs text-slate-400 font-mono truncate">
                {document.originalFilename}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Metadata Grid */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-500 font-medium">Category</span>
                {isUpdatingCategory && (
                  <span className="text-[10px] text-indigo-400 font-mono flex items-center">
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                    Saving...
                  </span>
                )}
              </div>
              <select
                value={document.categoryId || ''}
                disabled={isUpdatingCategory}
                onChange={async (e) => {
                  const val = e.target.value || null;
                  setIsUpdatingCategory(true);
                  try {
                    if (onUpdateCategory) {
                      await onUpdateCategory(document.id, val);
                    }
                  } finally {
                    setIsUpdatingCategory(false);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              >
                <option value="">(Uncategorized)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-500 font-medium mb-1.5">Status</div>
              <div className="font-mono text-slate-200 text-xs flex items-center h-7">
                {document.status}
              </div>
            </div>
          </div>

          {/* Local Source Path */}
          {document.sourcePath && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-500 font-medium">Local Watched Path</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleOpenLocal}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <span>Open File</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleRevealFolder}
                    className="text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                  >
                    <span>Show in Folder</span>
                    <HardDrive className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="font-mono text-slate-300 break-all text-[11px] bg-slate-900/80 p-2 rounded border border-slate-800/80">
                {document.sourcePath}
              </p>
            </div>
          )}

          {/* SHA-256 Checksum */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-500 font-medium">SHA-256 Checksum</span>
              {document.checksum && (
                <button
                  onClick={handleCopyChecksum}
                  className="text-slate-400 hover:text-slate-200 flex items-center space-x-1 font-mono"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            <p className="font-mono text-slate-300 break-all text-[11px] bg-slate-900/80 p-2 rounded border border-slate-800/80">
              {document.checksum || 'Pending computation'}
            </p>
          </div>

          {/* Details Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800">
            <div className="flex justify-between px-3 py-2 bg-slate-950/60 font-mono">
              <span className="text-slate-500">Document ID</span>
              <span className="text-slate-300">{document.id}</span>
            </div>
            <div className="flex justify-between px-3 py-2 font-mono">
              <span className="text-slate-500">MIME Type</span>
              <span className="text-slate-300">{document.mimeType}</span>
            </div>
            <div className="flex justify-between px-3 py-2 bg-slate-950/60 font-mono">
              <span className="text-slate-500">Size</span>
              <span className="text-slate-300">
                {document.sizeBytes ? `${(document.sizeBytes / 1024).toFixed(1)} KB` : '0 KB'}
              </span>
            </div>
            <div className="flex justify-between px-3 py-2 font-mono">
              <span className="text-slate-500">Created At</span>
              <span className="text-slate-300">
                {document.createdAt ? new Date(document.createdAt).toLocaleString() : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Permanently delete this document from DocVault?')) {
                onDelete(document.id);
                onClose();
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border border-rose-900/40 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReindex}
              disabled={isReindexing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? 'animate-spin' : ''}`} />
              <span>Reindex</span>
            </button>
            <button
              onClick={() => onDownload(document)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
