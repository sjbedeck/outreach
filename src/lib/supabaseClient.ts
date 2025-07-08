import { createClient } from '@supabase/supabase-js';

// Get the URL and anonymous key from the environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for the browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey);