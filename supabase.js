/* ─────────────────────────────────────────────────────────────
   Navya — Supabase client initialisation
   Must load before auth.js and app.js
   ──────────────────────────────────────────────────────────── */

(function () {
  var SUPABASE_URL      = 'https://hbjkzobntziklizjhodc.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhiamt6b2JudHppa2xpempob2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4Mjk1ODcsImV4cCI6MjA5MTQwNTU4N30.o36bWLiyX4bYOLfMZ_n3e3Nf5LqrZbbrIQbwOZ0eelE';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Navya: Supabase JS library not loaded. Check the CDN <script> tag in index.html.');
    window._supabaseClient = null;
    return;
  }

  window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true   // parses OAuth / magic-link tokens from URL hash
    }
  });
})();
