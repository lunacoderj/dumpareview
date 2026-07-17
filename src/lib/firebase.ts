// Firebase has been removed. This module is kept as a no-op stub so any
// stray imports don't crash the app. All auth now goes through Lovable Cloud
// (Supabase) via `@/hooks/useAuth` and `@/integrations/supabase/client`.
export const auth = null as unknown as never;
export const googleProvider = null as unknown as never;
export const messaging = async () => null;
