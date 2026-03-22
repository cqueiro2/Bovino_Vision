import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your .env file.');
}

/**
 * Reusable Supabase client instance.
 * All authentication and database operations should use this client.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper function to check if the connection is active.
 * Useful for debugging or initial app load.
 */
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { success: true, message: 'Supabase connection established.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
