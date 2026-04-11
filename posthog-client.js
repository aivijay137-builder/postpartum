/* ============================================================
   posthog-client.js
   Embeds PostHog's official async snippet loader, then wraps
   the SDK in window.PH. All methods no-op when posthogKey is
   not set in navya-config.js.
   ============================================================ */

(function () {
  'use strict';

  var cfg  = window.NAVYA_CONFIG || {};
  var key  = cfg.posthogKey  || '';
  var host = cfg.posthogHost || 'https://us.i.posthog.com';

  /* No-op PH when key is missing */
  if (!key) {
    window.PH = {
      isReady:  function () { return false; },
      identify: function () {},
      reset:    function () {},
      capture:  function () {},
      screen:   function () {},
    };
    return;
  }

  /* PostHog official async snippet — loads array.js from their CDN */
  /* eslint-disable */
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.people.toString()+" (stub)"},o="init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  /* eslint-enable */

  window.posthog.init(key, {
    api_host:                  host,
    capture_pageview:          false,  // we fire screen_viewed manually
    capture_pageleave:         false,
    autocapture:               false,  // keep event stream intentional
    persistence:               'localStorage',
    disable_session_recording: true,
  });

  window.PH = {
    isReady: function () { return true; },

    identify: function (uid, traits) {
      window.posthog.identify(uid, traits || {});
    },

    reset: function () {
      window.posthog.reset();
    },

    capture: function (event, props) {
      window.posthog.capture(event, props || {});
    },

    screen: function (name, props) {
      window.posthog.capture('screen_viewed', Object.assign({ screen: name }, props || {}));
    },
  };
})();
