let currentServerUrl = '';
let currentToken = '';
let authExpiredListener = null;

export const initApiConfig = (serverUrl, token) => {
  if (serverUrl) currentServerUrl = serverUrl.replace(/\/$/, '');
  if (token) currentToken = token;
};

export const setAuthExpiredListener = (callback) => {
  authExpiredListener = callback;
};

export const getServerUrl = () => currentServerUrl;
export const getToken = () => currentToken;

const getHeaders = (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }
  return headers;
};

const checkStatus = (res) => {
  if (res.status === 401 || res.status === 403) {
    if (authExpiredListener) authExpiredListener();
  }
  return res;
};

export const api = {
  async login(username, password) {
    const res = await fetch(`${currentServerUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Login failed (${res.status})`);
    }
    const data = await res.json();
    currentToken = data.jwt;
    return data;
  },

  async register(username, email, password) {
    const res = await fetch(`${currentServerUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Registration failed (${res.status})`);
    }
    return await this.login(username, password);
  },

  async getCategories() {
    const res = await fetch(`${currentServerUrl}/api/categories`, {
      headers: getHeaders()
    });
    checkStatus(res);
    if (!res.ok) throw new Error(`Failed to fetch categories (${res.status})`);
    return await res.json();
  },

  async createCategory(name, color = '#6366f1') {
    const res = await fetch(`${currentServerUrl}/api/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, color })
    });
    checkStatus(res);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Failed to create category (${res.status})`);
    }
    return await res.json();
  },

  async deleteCategory(id) {
    const res = await fetch(`${currentServerUrl}/api/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    checkStatus(res);
    if (!res.ok) throw new Error(`Failed to delete category (${res.status})`);
    return true;
  },

  async listDocuments(categoryId = null, sourcePathPrefix = null) {
    const url = new URL(`${currentServerUrl}/api/documents`);
    if (categoryId) url.searchParams.append('categoryId', categoryId);
    if (sourcePathPrefix) url.searchParams.append('sourcePathPrefix', sourcePathPrefix);

    const res = await fetch(url.toString(), {
      headers: getHeaders()
    });
    checkStatus(res);
    if (!res.ok) throw new Error(`Failed to fetch documents (${res.status})`);
    return await res.json();
  },

  async updateDocumentCategory(documentId, categoryId = null) {
    const res = await fetch(`${currentServerUrl}/api/documents/${documentId}/category`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ categoryId })
    });
    checkStatus(res);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Failed to update document category (${res.status})`);
    }
    return await res.json();
  },

  async bulkSetCategory(documentIds, categoryId = null) {
    const res = await fetch(`${currentServerUrl}/api/documents/bulk-category`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ documentIds, categoryId })
    });
    checkStatus(res);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Bulk category assignment failed (${res.status})`);
    }
    return await res.json();
  },

  async bulkDelete(documentIds) {
    const res = await fetch(`${currentServerUrl}/api/documents/bulk-delete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ documentIds })
    });
    checkStatus(res);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Bulk delete failed (${res.status})`);
    }
    return await res.json();
  },

  async searchDocuments(query = '', categoryId = null, page = 0, size = 20) {
    const url = new URL(`${currentServerUrl}/api/documents/search`);
    if (query) url.searchParams.append('q', query);
    if (categoryId) url.searchParams.append('categoryId', categoryId);
    url.searchParams.append('page', page);
    url.searchParams.append('size', size);

    const res = await fetch(url.toString(), {
      headers: getHeaders()
    });
    checkStatus(res);
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    return await res.json();
  },

  async getDocument(id) {
    const res = await fetch(`${currentServerUrl}/api/documents/${id}`, {
      headers: getHeaders()
    });
    checkStatus(res);
    if (!res.ok) throw new Error(`Failed to load document (${res.status})`);
    return await res.json();
  },

  async deleteDocument(id) {
    const res = await fetch(`${currentServerUrl}/api/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    checkStatus(res);
    if (!res.ok) throw new Error(`Failed to delete document (${res.status})`);
    return true;
  },

  async reindexDocument(id) {
    const res = await fetch(`${currentServerUrl}/api/documents/${id}/reindex`, {
      method: 'POST',
      headers: getHeaders()
    });
    checkStatus(res);
    if (!res.ok) throw new Error(`Failed to reindex document (${res.status})`);
    return true;
  },

  async uploadDocument(file, title = '', sourcePath = '') {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (sourcePath) formData.append('sourcePath', sourcePath);

    const res = await fetch(`${currentServerUrl}/api/documents`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    checkStatus(res);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Upload failed (${res.status})`);
    }
    return await res.json();
  },

  getDownloadUrl(id) {
    return `${currentServerUrl}/api/documents/${id}/download`;
  }
};
