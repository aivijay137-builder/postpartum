/* ============================================================
   posthog-client.js
   Thin wrapper around PostHog browser SDK.
   Exports window.PH — all methods no-op gracefully when
   posthogKey is not configured or the SDK hasn't loaded.
   ============================================================ */

(function () {
  'use strict';

  var cfg  = window.NAVYA_CONFIG || {};
  var key  = cfg.posthogKey  || '';
  var host = cfg.posthogHost || 'https://app.posthog.com';
  var ok   = !!(key && window.posthog);

  if (ok) {
    window.posthog.init(key, {
      api_host:             host,
      capture_pageview:     false,   // we capture screens manually
      capture_pageleave:    false,
      autocapture:          false,   // keep event stream clean
      persistence:          'localStorage',
      disable_session_recording: true,
    });
  }

  function noop() {}

  window.PH = {
    isReady: function () { return ok; },

    /* Identify a logged-in user */
    identify: function (uid, traits) {
      if (!ok) return;
      window.posthog.identify(uid, traits || {});
    },

    /* Reset on logout (clears distinct_id so next session is fresh) */
    reset: function () {
      if (!ok) return;
      window.posthog.reset();
    },

    /* Track any event */
    capture: function (event, props) {
      if (!ok) return;
      window.posthog.capture(event, props || {});
    },

    /* Convenience: screen / route change */
    screen: function (name, props) {
      if (!ok) return;
      window.posthog.capture('screen_viewed', Object.assign({ screen: name }, props || {}));
    },
  };
})();
