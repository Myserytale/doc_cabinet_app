import React from 'react';
import DocumentCard from './DocumentCard';
import { Files, SearchX } from 'lucide-react';

export default function DocumentList({
  documents = [],
  loading = false,
  isSearch = false,
  onSelectDocument,
  onDeleteDocument,
  onDownloadDocument
}) {
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
              ? 'Try modifying your search term or clearing the category filter.'
              : 'Add a watched folder in Daemon Settings or upload a document manually.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onSelect={onSelectDocument}
            onDelete={onDeleteDocument}
            onDownload={onDownloadDocument}
          />
        ))}
      </div>
    </div>
  );
}
