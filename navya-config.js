/**
 * navya-config.js
 * Fill in your Supabase project credentials before deploying.
 * Dashboard → Project Settings → API → Project URL + anon public key
 * Leave blank to run in offline/localStorage-only mode.
 *
 * PostHog (optional):
 *   posthogKey  — Project API key from posthog.com → Project Settings → API keys
 *   posthogHost — 'https://us.i.posthog.com' (US) or 'https://eu.i.posthog.com' (EU)
 *                 Leave blank to default to US cloud.
 */
window.NAVYA_CONFIG = {
  supabaseUrl: 'https://notsccmtwdaqdhhirdnz.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdHNjY210d2RhcWRoaGlyZG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDI1MDcsImV4cCI6MjA5MTQxODUwN30.zD0Ux_mj0BpE-SfRheJr3dSsng607r2b1VJMArYE5RQ',

  posthogKey:  'phc_Bz4Brt2tSUsxyi2Gc2Fmu8pcqMhaiRAxtnWtCoRNsPdi',   // e.g. 'phc_XXXXXXXXXXXXXXXXXXXX'
  posthogHost: 'https://us.i.posthog.com',  // US cloud (use https://eu.i.posthog.com for EU)
};
