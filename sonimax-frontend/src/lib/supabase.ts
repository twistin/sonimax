import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://zdamggjjfmkothvlvwln.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYW1nZ2pqZm1rb3Rodmx2d2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODk5MjEsImV4cCI6MjA3Nzg2NTkyMX0.MKclI9LC5jJ0sCNIuFrYbYx5tT-9n_9fi72wg31AUVY";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { supabaseUrl };
