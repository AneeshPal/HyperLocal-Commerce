export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
).replace(/\/+$/, '');

export const API_URL = `${API_BASE}/api`;
