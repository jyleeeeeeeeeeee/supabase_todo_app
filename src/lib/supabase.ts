import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Category = {
  id: number;
  user_id: string;
  name: string;
  created_at: string;
};

export type Todo = {
  id: number;
  created_at: string;
  title: string;
  is_done: boolean;
  user_id: string;
  category_id: number | null;
};
