import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://zdamggjjfmkothvlvwln.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYW1nZ2pqZm1rb3Rodmx2d2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODk5MjEsImV4cCI6MjA3Nzg2NTkyMX0.MKclI9LC5jJ0sCNIuFrYbYx5tT-9n_9fi72wg31AUVY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { supabaseUrl };
