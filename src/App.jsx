import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DocumentList from './components/DocumentList';
import DocumentModal from './components/DocumentModal';
import SyncSettingsModal from './components/SyncSettingsModal';
import SyncHistoryDrawer from './components/SyncHistoryDrawer';
import LoginModal from './components/LoginModal';
import { api, initApiConfig, setAuthExpiredListener } from './api';

export default function App() {
  const [config, setConfig] = useState(null);
  const [syncStatus, setSyncStatus] = useState({});
  const [syncHistory, setSyncHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Modals & Drawers
  const [isSyncSettingsOpen, setIsSyncSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Load config & subscribe to IPC events on mount
  useEffect(() => {
    setAuthExpiredListener(() => {
      setIsLoginOpen(true);
    });

    async function init() {
      let cfg = {};
      if (window.desktopApi?.getConfig) {
        cfg = await window.desktopApi.getConfig();
      } else {
        cfg = {
          serverUrl: 'http://100.113.158.58:8080',
          token: localStorage.getItem('docvault_token') || '',
          username: localStorage.getItem('docvault_username') || '',
          watchedFolders: [],
          autoSync: true
        };
      }
      setConfig(cfg);
      initApiConfig(cfg.serverUrl, cfg.token);

      if (window.desktopApi?.getSyncStatus) {
        const st = await window.desktopApi.getSyncStatus();
        setSyncStatus(st);
        if (st.history) setSyncHistory(st.history);
        if (st.isTokenExpired || !cfg.token) {
          setIsLoginOpen(true);
        }
      } else if (!cfg.token) {
        setIsLoginOpen(true);
      }
    }

    init();

    // Listen to status changes from Electron main process
    const unlistenStatus = window.desktopApi?.onSyncStatus?.((status) => {
      setSyncStatus(status);
      if (status.isTokenExpired) {
        setIsLoginOpen(true);
      }
      if (status.history) setSyncHistory(status.history);
    });

    // Listen to individual sync events
    const unlistenEvent = window.desktopApi?.onSyncEvent?.((ev) => {
      if (ev.type === 'auth_expired' || ev.isAuthError) {
        setIsLoginOpen(true);
      }
      setSyncHistory((prev) => [ev, ...prev.slice(0, 49)]);
      // When a file is uploaded, reload documents to show latest state
      if (ev.status === 'uploaded') {
        setTimeout(() => {
          loadData();
        }, 1200);
      }
    });

    return () => {
      if (unlistenStatus) unlistenStatus();
      if (unlistenEvent) unlistenEvent();
    };
  }, []);

  // Fetch documents and categories
  const loadData = useCallback(async (catId = selectedCategory, query = searchQuery) => {
    if (!config?.token) return;
    setLoading(true);
    try {
      // Load categories
      try {
        const cats = await api.getCategories();
        setCategories(cats);
      } catch (err) {
        console.warn('Failed to load categories:', err);
      }

      // Load documents or search results
      if (query && query.trim().length > 0) {
        const searchRes = await api.searchDocuments(query.trim(), catId);
        setDocuments(searchRes.items || []);
      } else {
        const docs = await api.listDocuments(catId);
        setDocuments(docs || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, [config?.token, selectedCategory, searchQuery]);

  // Trigger reload on selection change
  useEffect(() => {
    if (config?.token) {
      loadData(selectedCategory, searchQuery);
    }
  }, [config?.token, selectedCategory, searchQuery, loadData]);

  // Handlers
  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
  };

  const handleSearchChange = (q) => {
    setSearchQuery(q);
  };

  const handleSaveConfig = async (newConfig) => {
    let saved = newConfig;
    if (window.desktopApi?.saveConfig) {
      saved = await window.desktopApi.saveConfig(newConfig);
    }
    setConfig(saved);
    initApiConfig(saved.serverUrl, saved.token);
    loadData();
  };

  const handleTriggerSync = async () => {
    if (window.desktopApi?.triggerSync) {
      await window.desktopApi.triggerSync();
    }
  };

  const handleUploadFile = async (file) => {
    try {
      await api.uploadDocument(file);
      setTimeout(() => loadData(), 1200);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      loadData();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleDownloadDocument = (doc) => {
    const downloadUrl = api.getDownloadUrl(doc.id);
    const a = window.document.createElement('a');
    a.href = downloadUrl;
    a.setAttribute('download', doc.originalFilename || 'document');
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const handleReindexDocument = async (id) => {
    try {
      await api.reindexDocument(id);
      alert('Reindexing scheduled for document ' + id);
      setTimeout(() => loadData(), 1500);
    } catch (err) {
      alert('Reindex failed: ' + err.message);
    }
  };

  const handleLoginSuccess = async (authData) => {
    const updated = {
      ...config,
      serverUrl: authData.serverUrl,
      username: authData.username,
      token: authData.token
    };
    if (window.desktopApi?.saveConfig) {
      await window.desktopApi.saveConfig(updated);
    } else {
      localStorage.setItem('docvault_token', authData.token);
      localStorage.setItem('docvault_username', authData.username);
    }
    setConfig(updated);
    initApiConfig(updated.serverUrl, updated.token);
    setIsLoginOpen(false);
    loadData();
  };

  const handleLogout = async () => {
    const updated = {
      ...config,
      token: '',
      username: ''
    };
    if (window.desktopApi?.saveConfig) {
      await window.desktopApi.saveConfig(updated);
    } else {
      localStorage.removeItem('docvault_token');
      localStorage.removeItem('docvault_username');
    }
    setConfig(updated);
    initApiConfig(updated.serverUrl, '');
    setDocuments([]);
    setCategories([]);
    setIsLoginOpen(true);
  };

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Sidebar */}
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        totalDocuments={documents.length}
        syncStatus={syncStatus}
        onOpenSyncSettings={() => setIsSyncSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        username={config?.username}
        serverUrl={config?.serverUrl || 'http://100.113.158.58:8080'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          syncStatus={syncStatus}
          onTriggerSync={handleTriggerSync}
          onUploadFile={handleUploadFile}
          selectedCategoryName={selectedCategoryObj?.name}
          onClearCategory={handleClearCategory}
          onOpenSyncSettings={() => setIsSyncSettingsOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
        />

        {/* Documents Grid / Search View */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          <DocumentList
            documents={documents}
            loading={loading}
            isSearch={Boolean(searchQuery)}
            onSelectDocument={(doc) => setSelectedDocument(doc)}
            onDeleteDocument={handleDeleteDocument}
            onDownloadDocument={handleDownloadDocument}
          />
        </main>
      </div>

      {/* Document Details Modal */}
      <DocumentModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onDownload={handleDownloadDocument}
        onDelete={handleDeleteDocument}
        onReindex={handleReindexDocument}
      />

      {/* Sync Settings Modal */}
      <SyncSettingsModal
        isOpen={isSyncSettingsOpen}
        onClose={() => setIsSyncSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      {/* Sync History Drawer */}
      <SyncHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={syncHistory}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        defaultServerUrl={config?.serverUrl || 'http://100.113.158.58:8080'}
        defaultUsername={config?.username || ''}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
