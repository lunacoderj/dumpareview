import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Legacy Express API is not deployed. Return empty payloads instead of
  // hammering localhost:5000 and flooding the console with fetch errors.
  if (!API_BASE_URL) {
    // Legacy endpoints — return shapes matching what callers expect.
    if (endpoint.includes('wall-of-fame')) return [];
    if (endpoint.includes('notifications')) return [];
    if (endpoint.includes('campaigns')) return [];
    if (endpoint.includes('profile')) return null;
    return [];
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? '';

  const isFormData = options.body instanceof FormData;

  const headers: any = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  } else if (isFormData && headers['Content-Type'] === 'application/json') {
    delete headers['Content-Type'];
  }

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
