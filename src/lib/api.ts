import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const user = auth.currentUser;
  let token = '';
  
  if (user) {
    token = await user.getIdToken();
  }

  console.log('[apiFetch] user:', user?.uid, 'token:', token ? 'exists' : 'missing');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `API request failed with status ${response.status}`);
  }

  return response.json();
};
