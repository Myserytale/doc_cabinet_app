# DocVault Desktop Client

Full-featured desktop client for DocVault with background filesystem watching, pre-flight SHA-256 deduplication, auto-sync, and document exploration.

## Features

- Background Watch Daemon: Uses `chokidar` in Node/Electron main process to monitor configured directories (including `~` or subfolders).
- Pre-Flight SHA-256 Deduplication: Computes SHA-256 stream hashes locally before uploading. Skips files already present in DocVault to conserve bandwidth and storage.
- Auto-Categorization Support: Displays real-time server-side categorization badges (Finance, Legal, Technical, Academic, Personal).
- Multi-Tenant Search: Real-time full-text search with highlight snippets powered by Elasticsearch 8.
- Native System Integration: System Tray resident daemon, native folder picker dialogs, and direct "Reveal in Local Folder" actions.
- Local Configuration: Stores watched folders, debounce intervals, extension whitelists, and connection tokens locally in persistent storage.

## Architecture

- Electron Main Process (`electron/main.cjs`): Window lifecycle, system tray integration, and native dialog IPC handlers.
- Sync Manager (`electron/syncManager.cjs`): Inotify/filesystem watcher, debounce queues, streaming SHA-256 hashing, and multipart upload client.
- Preload Bridge (`electron/preload.cjs`): Context-isolated IPC bridge exposing `window.desktopApi`.
- Frontend (`src/`): React 19, Tailwind CSS, Lucide Icons, and Vite.

## Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run electron:dev
```

### 3. Build Production Bundle
```bash
npm run build
npm start
```
