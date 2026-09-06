import React, { useState } from 'react';
import DocumentCard from './DocumentCard';
import { Files, SearchX, Trash2, Tag, CheckSquare, Square, X, Loader2 } from 'lucide-react';

export default function DocumentList({
  documents = [],
  categories = [],
  loading = false,
  isSearch = false,
  selectedIds = new Set(),
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onBulkCategory,
  onBulkDelete,
  onSelectDocument,
  onDeleteDocument,
  onDownloadDocument
}) {
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState('');
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 select-none">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mb-3">
            {isSearch ? <SearchX className="w-8 h-8" /> : <Files className="w-8 h-8" />}
          </div>
          <h3 className="text-sm font-medium text-slate-200">
            {isSearch ? 'No matching documents found' : 'No documents in repository'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isSearch
              ? 'Try modifying your search term or clearing the category/folder filter.'
              : 'Add a watched folder in Daemon Settings or upload a document manually.'}
          </p>
        </div>
      </div>
    );
  }

  const isAllSelected = documents.length > 0 && documents.every((d) => selectedIds.has(d.id));

  const handleBulkCategoryChange = async (catId) => {
    if (!catId && catId !== '') return;
    setIsBulkOperating(true);
    try {
      await onBulkCategory(catId === 'NONE' ? null : catId);
      setBulkCategoryTarget('');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkDeleteClick = async () => {
    if (confirm(`Delete ${selectedIds.size} selected document(s) permanently?`)) {
      setIsBulkOperating(true);
      try {
        await onBulkDelete();
      } finally {
        setIsBulkOperating(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Action / Selection Bar */}
      <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-3">
          <button
            onClick={onSelectAll}
            className="flex items-center space-x-1.5 text-slate-400 hover:text-white transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
          </button>

          {selectedIds.size > 0 && (
            <span className="font-mono text-indigo-400 font-medium">
              {selectedIds.size} of {documents.length} selected
            </span>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center space-x-2">
            {/* Category Dropdown */}
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded px-2 py-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={bulkCategoryTarget}
                disabled={isBulkOperating}
                onChange={(e) => handleBulkCategoryChange(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="" disabled>
                  Assign Category...
                </option>
                <option value="NONE">(Clear Category)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Delete */}
            <button
              onClick={handleBulkDeleteClick}
              disabled={isBulkOperating}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={onClearSelection}
              disabled={isBulkOperating}
              title="Clear selection"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {isBulkOperating && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 ml-1" />
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              isSelected={selectedIds.has(doc.id)}
              onToggleSelect={onToggleSelect}
              onSelect={onSelectDocument}
              onDelete={onDeleteDocument}
              onDownload={onDownloadDocument}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
