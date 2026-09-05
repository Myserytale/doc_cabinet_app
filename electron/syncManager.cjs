const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chokidar = require('chokidar');

class SyncManager {
  constructor(options = {}) {
    this.userDataPath = options.userDataPath || process.cwd();
    this.configFile = path.join(this.userDataPath, 'docvault-config.json');
    this.onEvent = options.onEvent || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});

    this.watcher = null;
    this.debounceTimers = new Map();
    this.history = [];
    this.maxHistory = 100;
    this.isProcessing = false;
    this.syncQueue = [];
    this.activeUploads = 0;

    this.config = this.loadConfig();
  }

  getDefaultConfig() {
    return {
      serverUrl: 'http://100.113.158.58:8080',
      token: '',
      username: '',
      watchedFolders: [],
      extensions: ['.pdf', '.docx', '.doc', '.txt', '.md', '.xlsx', '.csv', '.odt', '.rtf', '.pptx', '.json'],
      debounceMs: 2000,
      autoSync: true
    };
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const raw = fs.readFileSync(this.configFile, 'utf-8');
        return { ...this.getDefaultConfig(), ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('Failed to read config file:', err);
    }
    return this.getDefaultConfig();
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write config file:', err);
    }
    this.restartWatcher();
    return this.config;
  }

  getStatus() {
    return {
      autoSync: this.config.autoSync,
      watchedFolders: this.config.watchedFolders,
      serverUrl: this.config.serverUrl,
      hasToken: Boolean(this.config.token),
      username: this.config.username,
      queueLength: this.syncQueue.length,
      activeUploads: this.activeUploads,
      isProcessing: this.isProcessing,
      history: this.history.slice(0, 30)
    };
  }

  addHistory(entry) {
    const record = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.history.unshift(record);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
    this.onEvent(record);
    this.onStatusChange(this.getStatus());
  }

  init() {
    if (this.config.autoSync && this.config.watchedFolders.length > 0) {
      this.startWatcher();
    }
  }

  startWatcher() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (!this.config.watchedFolders || this.config.watchedFolders.length === 0) {
      return;
    }

    const validFolders = this.config.watchedFolders.filter(dir => {
      try {
        return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
      } catch {
        return false;
      }
    });

    if (validFolders.length === 0) {
      return;
    }

    const ignoredRegex = /(^|[\/\\])(\..|node_modules|\.git|dist|build|target|\.venv|__pycache__|~\$|\.tmp|\.swp|\.DS_Store|Thumbs\.db)/;

    this.watcher = chokidar.watch(validFolders, {
      ignored: ignoredRegex,
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 1500,
        pollInterval: 200
      },
      depth: 10
    });

    this.watcher.on('add', filePath => this.handleFileEvent('add', filePath));
    this.watcher.on('change', filePath => this.handleFileEvent('change', filePath));
    this.watcher.on('error', err => console.error('Watcher error:', err));

    this.onStatusChange(this.getStatus());
  }

  stopWatcher() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.onStatusChange(this.getStatus());
  }

  restartWatcher() {
    this.stopWatcher();
    if (this.config.autoSync && this.config.watchedFolders.length > 0) {
      this.startWatcher();
    }
  }

  isMatchingExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.config.extensions.includes(ext);
  }

  handleFileEvent(eventType, filePath) {
    if (!this.config.autoSync) return;
    if (!this.isMatchingExtension(filePath)) return;

    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath));
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      this.enqueueFile(filePath);
    }, this.config.debounceMs || 2000);

    this.debounceTimers.set(filePath, timer);
  }

  enqueueFile(filePath) {
    if (!this.syncQueue.includes(filePath)) {
      this.syncQueue.push(filePath);
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing) return;
    if (this.syncQueue.length === 0) return;

    this.isProcessing = true;
    this.onStatusChange(this.getStatus());

    while (this.syncQueue.length > 0) {
      const filePath = this.syncQueue.shift();
      await this.syncFile(filePath);
    }

    this.isProcessing = false;
    this.onStatusChange(this.getStatus());
  }

  computeChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  async checkChecksum(checksum) {
    const res = await fetch(`${this.config.serverUrl}/api/documents/check-checksum?checksum=${checksum}`, {
      headers: {
        'Authorization': `Bearer ${this.config.token}`
      }
    });
    if (!res.ok) {
      throw new Error(`Checksum verification failed with HTTP ${res.status}`);
    }
    return await res.json();
  }

  async syncFile(filePath) {
    const fileName = path.basename(filePath);

    try {
      if (!fs.existsSync(filePath)) {
        return;
      }

      const stat = fs.statSync(filePath);
      if (!stat.isFile() || stat.size === 0) {
        return;
      }

      if (!this.config.token) {
        this.addHistory({
          filePath,
          fileName,
          status: 'error',
          message: 'Server token missing. Please login first.'
        });
        return;
      }

      // 1. Calculate local SHA-256
      const checksum = await this.computeChecksum(filePath);

      // 2. Pre-flight check against homelab backend
      const checkRes = await this.checkChecksum(checksum);
      if (checkRes.exists) {
        this.addHistory({
          filePath,
          fileName,
          checksum,
          status: 'skipped',
          message: 'Deduplicated: identical document already stored',
          documentId: checkRes.document ? checkRes.document.id : null,
          categoryName: checkRes.document ? checkRes.document.categoryName : null
        });
        return;
      }

      // 3. Upload file
      this.activeUploads++;
      this.onStatusChange(this.getStatus());

      const fileBuffer = fs.readFileSync(filePath);
      const mimeType = this.getMimeType(filePath);
      const blob = new Blob([fileBuffer], { type: mimeType });

      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('title', fileName);
      formData.append('sourcePath', filePath);
      formData.append('checksum', checksum);

      const uploadRes = await fetch(`${this.config.serverUrl}/api/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`
        },
        body: formData
      });

      this.activeUploads = Math.max(0, this.activeUploads - 1);

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        this.addHistory({
          filePath,
          fileName,
          checksum,
          status: 'error',
          message: `Upload failed: ${errorText || uploadRes.statusText}`
        });
        return;
      }

      const doc = await uploadRes.json();
      this.addHistory({
        filePath,
        fileName,
        checksum,
        status: 'uploaded',
        message: 'Uploaded successfully. Background text extraction & auto-categorization active.',
        documentId: doc.id,
        categoryName: doc.categoryName
      });

    } catch (err) {
      this.activeUploads = Math.max(0, this.activeUploads - 1);
      this.addHistory({
        filePath,
        fileName,
        status: 'error',
        message: err.message || 'Unknown error occurred during sync'
      });
    }
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.json': 'application/json',
      '.csv': 'text/csv',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.odt': 'application/vnd.oasis.opendocument.text',
      '.rtf': 'application/rtf'
    };
    return map[ext] || 'application/octet-stream';
  }

  triggerManualSync() {
    if (!this.config.watchedFolders || this.config.watchedFolders.length === 0) {
      return { queued: 0, message: 'No folders configured to watch' };
    }

    let count = 0;
    const scanDir = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.') || ['node_modules', '.git', 'dist', 'build', 'target', '.venv', '__pycache__'].includes(entry.name)) {
            continue;
          }
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(full);
          } else if (entry.isFile() && this.isMatchingExtension(full)) {
            this.enqueueFile(full);
            count++;
          }
        }
      } catch (err) {
        console.warn(`Cannot read directory ${dir}:`, err.message);
      }
    };

    for (const folder of this.config.watchedFolders) {
      if (fs.existsSync(folder)) {
        scanDir(folder);
      }
    }

    this.processQueue();
    return { queued: count, message: `Queued ${count} documents for synchronization check` };
  }
}

module.exports = SyncManager;
