
const url = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const supabaseConfig = {
  url,
  anonKey,
};

export const isSupabaseConfigured = Boolean(url && anonKey);

console.log('Supabase URL loaded:', Boolean(url));
console.log('Supabase key loaded:', Boolean(anonKey));
