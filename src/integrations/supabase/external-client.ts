// External Supabase project (user-owned). Anon keys are publishable.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fvwdojrbcuplilktubns.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2d2RvanJiY3VwbGlsa3R1Ym5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMDYxNjgsImV4cCI6MjA5Mzg4MjE2OH0._fIYf5UTIRmKDBqRFuMH1PvwWJnx4PCseAyXNIi-xnE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
