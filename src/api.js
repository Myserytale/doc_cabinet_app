let currentServerUrl = 'http://100.113.158.58:8080';
let currentToken = '';

export const initApiConfig = (serverUrl, token) => {
  if (serverUrl) currentServerUrl = serverUrl.replace(/\/$/, '');
  if (token) currentToken = token;
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
    // Auto-login to obtain JWT token
    return await this.login(username, password);
  },

  async getCategories() {
    const res = await fetch(`${currentServerUrl}/api/categories`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`Failed to fetch categories (${res.status})`);
    return await res.json();
  },

  async listDocuments(categoryId = null) {
    const url = new URL(`${currentServerUrl}/api/documents`);
    if (categoryId) url.searchParams.append('categoryId', categoryId);

    const res = await fetch(url.toString(), {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`Failed to fetch documents (${res.status})`);
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
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    return await res.json();
  },

  async getDocument(id) {
    const res = await fetch(`${currentServerUrl}/api/documents/${id}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`Failed to load document (${res.status})`);
    return await res.json();
  },

  async deleteDocument(id) {
    const res = await fetch(`${currentServerUrl}/api/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`Failed to delete document (${res.status})`);
    return true;
  },

  async reindexDocument(id) {
    const res = await fetch(`${currentServerUrl}/api/documents/${id}/reindex`, {
      method: 'POST',
      headers: getHeaders()
    });
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
