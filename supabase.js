/* ─────────────────────────────────────────────────────────────
   Navya — Supabase client
   Must load before checkin.js and app.js
   ──────────────────────────────────────────────────────────── */

(function () {
  var SUPABASE_URL      = 'https://hbjkzobntziklizjhodc.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhiamt6b2JudHppa2xpempob2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4Mjk1ODcsImV4cCI6MjA5MTQwNTU4N30.o36bWLiyX4bYOLfMZ_n3e3Nf5LqrZbbrIQbwOZ0eelE';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('Navya: Supabase JS library not loaded — check the CDN <script> in index.html.');
    window._supabaseClient = null;
    return;
  }

  window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: false   // app uses hash routing — don't parse URL for tokens
    }
  });

  // Ensure an auth session always exists.
  // signInAnonymously() is a no-op when a session is already stored in localStorage.
  window._supabaseClient.auth.getSession().then(function (result) {
    if (!result.data.session) {
      window._supabaseClient.auth.signInAnonymously().then(function (res) {
        if (res.error) {
          console.warn('Navya: anonymous sign-in failed —', res.error.message);
        } else {
          console.log('Navya: anonymous session created', res.data.user.id);
        }
      });
    }
  });
})();
