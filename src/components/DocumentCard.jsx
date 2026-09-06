import React from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  File, 
  Download, 
  Trash2, 
  FolderSearch, 
  Clock, 
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export default function DocumentCard({
  document,
  isSelected = false,
  onToggleSelect,
  onSelect,
  onDelete,
  onDownload
}) {
  const getFileIcon = (filename, mime) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-rose-400" />;
    if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (['json', 'md', 'txt', 'py', 'java', 'js', 'ts'].includes(ext)) return <FileCode className="w-5 h-5 text-sky-400" />;
    return <File className="w-5 h-5 text-indigo-400" />;
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleRevealLocal = (e) => {
    e.stopPropagation();
    if (document.sourcePath && window.desktopApi?.showItemInFolder) {
      window.desktopApi.showItemInFolder(document.sourcePath);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'INDEXED':
        return (
          <span className="flex items-center text-[11px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
            Indexed
          </span>
        );
      case 'PROCESSING':
      case 'PENDING':
        return (
          <span className="flex items-center text-[11px] text-indigo-400 font-mono">
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
            Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center text-[11px] text-rose-400 font-mono">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={() => onSelect(document)}
      className={`group relative border rounded-lg p-4 transition-all duration-150 hover:shadow-md cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'bg-indigo-950/25 border-indigo-500/60 shadow-indigo-950/30'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div>
        {/* Header Row: Checkbox, Icon, Title, Status */}
        <div className="flex items-start justify-between gap-2.5 mb-2">
          <div className="flex items-start space-x-2.5 truncate">
            {onToggleSelect && (
              <div
                className="mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(document.id);
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                />
              </div>
            )}
            <div className="p-2 rounded-md bg-slate-950 border border-slate-800/80 shrink-0">
              {getFileIcon(document.originalFilename, document.mimeType)}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-medium text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                {document.title || document.originalFilename}
              </h3>
              <p className="text-xs text-slate-400 truncate font-mono mt-0.5">
                {document.originalFilename}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            {getStatusBadge(document.status)}
          </div>
        </div>

        {/* Category Badge & Source Path */}
        <div className="flex flex-wrap items-center gap-1.5 my-2.5">
          {document.categoryName && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
              style={{
                backgroundColor: `${document.categoryColor || '#6366f1'}20`,
                color: document.categoryColor || '#a5b4fc',
                border: `1px solid ${document.categoryColor || '#6366f1'}40`
              }}
            >
              {document.categoryName}
            </span>
          )}

          {document.sourcePath && (
            <button
              onClick={handleRevealLocal}
              title={`Local file: ${document.sourcePath}`}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80 transition-colors font-mono truncate max-w-[200px]"
            >
              <HardDrive className="w-3 h-3 shrink-0" />
              <span className="truncate">{document.sourcePath.split('/').pop()}</span>
            </button>
          )}
        </div>

        {/* Search Highlights */}
        {document.highlights && document.highlights.length > 0 && (
          <div className="mt-2 text-xs bg-slate-950/80 border border-slate-800/80 rounded p-2 text-slate-300 font-sans leading-relaxed">
            {document.highlights.map((snippet, idx) => (
              <div
                key={idx}
                dangerouslySetInnerHTML={{ __html: snippet }}
                className="[&_mark]:bg-amber-400/25 [&_mark]:text-amber-200 [&_mark]:px-0.5 [&_mark]:rounded"
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Row: Metadata & Actions */}
      <div className="mt-3 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-3 font-mono text-[11px]">
          <span>{formatSize(document.sizeBytes)}</span>
          <span>{formatDate(document.createdAt)}</span>
        </div>

        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onDownload(document)}
            title="Download document"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(document.id)}
            title="Delete document"
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
