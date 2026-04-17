// Supabase client configuration (optional)
let supabasePublic = null;
let supabaseAdmin = null;
let supabaseUrl = null;

// Only create Supabase clients if environment variables are set
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  const { createClient } = require('@supabase/supabase-js');
  supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
  supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : supabasePublic;
}

module.exports = {
  supabasePublic,
  supabaseAdmin,
  supabaseUrl,
  isSupabaseConfigured: !!(supabaseUrl),
};
