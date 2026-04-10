/* ─────────────────────────────────────────────────────────────
   Navya — Authentication module
   Depends on: supabase.js (must load first)
   Provides:   Auth.init(), Auth.showAuthScreen(), Auth.signOut()
   Auth methods: Email + password  |  Magic link (passwordless)
   ──────────────────────────────────────────────────────────── */

var Auth = (function () {

  /* ── private state ─────────────────────────────────────── */
  var _mode = 'signin'; // 'signin' | 'signup' | 'magic_sent' | 'confirm_sent'

  /* ── tiny helpers ──────────────────────────────────────── */
  function _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _root()     { return document.getElementById('app-root'); }
  function _getVal(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

  function _hideNav() {
    var nav = document.querySelector('.nav-bottom');
    if (nav) nav.style.display = 'none';
  }
  function _showNav() {
    var nav = document.querySelector('.nav-bottom');
    if (nav) nav.style.display = '';
  }

  function _setHtml(html) {
    var root = _root();
    if (root) root.innerHTML = html;
  }

  function _setError(msg) {
    var wrap = document.getElementById('auth-error');
    var text = document.getElementById('auth-error-text');
    if (!wrap) return;
    if (msg) {
      if (text) text.textContent = msg;
      wrap.style.display = 'flex';
    } else {
      wrap.style.display = 'none';
    }
  }

  function _setLoading(loading) {
    var btn = document.getElementById('auth-submit-btn');
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.125rem;vertical-align:middle;animation:spin 1s linear infinite;">refresh</span>\u2002Please wait\u2026';
    } else {
      btn.textContent = btn.dataset.label || 'Continue';
    }
  }

  /* ── clear all navya localStorage keys ─────────────────── */
  function _clearLocalData() {
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('navya_') === 0) toRemove.push(k);
    }
    toRemove.forEach(function (k) { localStorage.removeItem(k); });
  }

  /* ── auth screen HTML builders ──────────────────────────── */
  function _formScreen(isSignIn) {
    return (
      '<div class="auth-wrap">' +

        '<div class="auth-logo">' +
          '<div class="auth-logo-icon"><span class="material-symbols-outlined">spa</span></div>' +
          '<h1 class="auth-app-name">Navya</h1>' +
          '<p class="auth-app-tagline">Your postpartum companion</p>' +
        '</div>' +

        '<div class="auth-card">' +

          '<div class="auth-tabs">' +
            '<button class="auth-tab' + ( isSignIn ? ' active' : '') + '" onclick="Auth.showAuthScreen(\'signin\')">Sign in</button>' +
            '<button class="auth-tab' + (!isSignIn ? ' active' : '') + '" onclick="Auth.showAuthScreen(\'signup\')">Create account</button>' +
          '</div>' +

          '<div id="auth-error" class="auth-error" style="display:none;">' +
            '<span class="material-symbols-outlined" style="font-size:1rem;flex-shrink:0;">error</span>' +
            '<span id="auth-error-text"></span>' +
          '</div>' +

          '<div class="auth-form">' +

            (isSignIn ? '' :
              '<div class="auth-field">' +
                '<label class="auth-label" for="auth-name">First name</label>' +
                '<input class="auth-input" id="auth-name" type="text" placeholder="e.g.\u2002Priya" autocomplete="given-name" />' +
              '</div>'
            ) +

            '<div class="auth-field">' +
              '<label class="auth-label" for="auth-email">Email address</label>' +
              '<input class="auth-input" id="auth-email" type="email" placeholder="you@example.com" autocomplete="email" />' +
            '</div>' +

            '<div class="auth-field">' +
              '<label class="auth-label" for="auth-password">Password</label>' +
              '<div class="auth-pw-wrap">' +
                '<input class="auth-input" id="auth-password" type="password" ' +
                  'placeholder="' + (isSignIn ? 'Your password' : 'Min 8 characters') + '" ' +
                  'autocomplete="' + (isSignIn ? 'current-password' : 'new-password') + '" ' +
                  'onkeydown="if(event.key===\'Enter\')Auth._handleSubmit()" />' +
                '<button class="auth-pw-toggle" type="button" onclick="Auth._togglePw()" aria-label="Show / hide password">' +
                  '<span class="material-symbols-outlined" id="auth-pw-icon">visibility</span>' +
                '</button>' +
              '</div>' +
            '</div>' +

            '<button class="auth-submit" id="auth-submit-btn" ' +
              'data-label="' + (isSignIn ? 'Sign in' : 'Create account') + '" ' +
              'onclick="Auth._handleSubmit()">' +
              (isSignIn ? 'Sign in' : 'Create account') +
            '</button>' +

            '<div class="auth-divider"><span>or</span></div>' +

            '<button class="auth-magic-link-btn" onclick="Auth._handleMagicLink()">' +
              '<span class="material-symbols-outlined" style="font-size:1rem;">mail</span>' +
              'Send a magic link instead' +
            '</button>' +

          '</div>' + /* auth-form */
        '</div>' + /* auth-card */

        '<p class="auth-footer">Your journal is private and secure.<br>Only you can access your postpartum data.</p>' +

      '</div>'
    );
  }

  function _magicSentScreen() {
    return (
      '<div class="auth-wrap">' +
        '<div class="auth-logo">' +
          '<div class="auth-logo-icon auth-logo-icon--mail"><span class="material-symbols-outlined">mark_email_read</span></div>' +
          '<h1 class="auth-app-name">Check your inbox</h1>' +
          '<p class="auth-app-tagline">A sign-in link is on its way</p>' +
        '</div>' +
        '<div class="auth-card auth-card--center">' +
          '<p style="font-size:.9375rem;color:var(--on-surface-var);line-height:1.7;margin-bottom:1.25rem;">' +
            'Click the link in the email to sign in automatically \u2014 no password needed.' +
          '</p>' +
          '<p style="font-size:.8125rem;color:var(--on-surface-var);margin-bottom:1.75rem;">' +
            "Can\u2019t find it? Check your spam or junk folder." +
          '</p>' +
          '<button class="auth-magic-link-btn" onclick="Auth.showAuthScreen(\'signin\')">' +
            '<span class="material-symbols-outlined" style="font-size:1rem;">arrow_back</span> Back to sign in' +
          '</button>' +
        '</div>' +
      '</div>'
    );
  }

  function _confirmSentScreen(email) {
    return (
      '<div class="auth-wrap">' +
        '<div class="auth-logo">' +
          '<div class="auth-logo-icon auth-logo-icon--mail"><span class="material-symbols-outlined">mark_email_read</span></div>' +
          '<h1 class="auth-app-name">Confirm your email</h1>' +
          '<p class="auth-app-tagline">Almost there!</p>' +
        '</div>' +
        '<div class="auth-card auth-card--center">' +
          '<p style="font-size:.9375rem;color:var(--on-surface-var);line-height:1.7;margin-bottom:1.25rem;">' +
            'We sent a confirmation link to <strong>' + _esc(email) + '</strong>.<br>' +
            'Click it to activate your account, then sign in.' +
          '</p>' +
          '<button class="auth-magic-link-btn" onclick="Auth.showAuthScreen(\'signin\')">' +
            '<span class="material-symbols-outlined" style="font-size:1rem;">arrow_back</span> Back to sign in' +
          '</button>' +
        '</div>' +
      '</div>'
    );
  }

  /* ── public: showAuthScreen ─────────────────────────────── */
  function showAuthScreen(mode) {
    _mode = mode || 'signin';
    _hideNav();
    switch (_mode) {
      case 'signup':       _setHtml(_formScreen(false));       break;
      case 'magic_sent':   _setHtml(_magicSentScreen());       break;
      case 'confirm_sent': _setHtml(_confirmSentScreen(''));   break;
      default:             _setHtml(_formScreen(true));        break;
    }
  }

  /* ── form interactions ──────────────────────────────────── */
  function _togglePw() {
    var input = document.getElementById('auth-password');
    var icon  = document.getElementById('auth-pw-icon');
    if (!input) return;
    var hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    if (icon) icon.textContent = hidden ? 'visibility_off' : 'visibility';
  }

  function _handleSubmit() {
    _setError('');
    var email    = _getVal('auth-email');
    var password = _getVal('auth-password');

    if (!email)    { _setError('Please enter your email address.'); return; }
    if (!password) { _setError('Please enter your password.'); return; }
    if (_mode === 'signup' && password.length < 8) {
      _setError('Password must be at least 8 characters.');
      return;
    }

    _setLoading(true);

    if (_mode === 'signup') {
      var name = _getVal('auth-name');
      _supabaseClient.auth.signUp({
        email:    email,
        password: password,
        options:  { data: { display_name: name } }
      }).then(function (result) {
        _setLoading(false);
        if (result.error) { _setError(result.error.message); return; }
        if (result.data.session) {
          _onSignedIn(result.data.session);        // email confirmation disabled
        } else {
          _setHtml(_confirmSentScreen(email));     // confirmation email sent
        }
      }).catch(function () {
        _setLoading(false);
        _setError('Something went wrong. Please try again.');
      });

    } else {
      _supabaseClient.auth.signInWithPassword({
        email:    email,
        password: password
      }).then(function (result) {
        _setLoading(false);
        if (result.error) { _setError(result.error.message); return; }
        _onSignedIn(result.data.session);
      }).catch(function () {
        _setLoading(false);
        _setError('Something went wrong. Please try again.');
      });
    }
  }

  function _handleMagicLink() {
    _setError('');
    var email = _getVal('auth-email');
    if (!email) { _setError('Enter your email address above first.'); return; }

    _setLoading(true);
    _supabaseClient.auth.signInWithOtp({
      email:   email,
      options: { shouldCreateUser: true }
    }).then(function (result) {
      _setLoading(false);
      if (result.error) { _setError(result.error.message); return; }
      _setHtml(_magicSentScreen());
    }).catch(function () {
      _setLoading(false);
      _setError('Could not send magic link. Please try again.');
    });
  }

  /* ── post-auth: hand control back to the app ────────────── */
  function _onSignedIn(session) {
    var storedUid = localStorage.getItem('navya_uid');
    if (storedUid && storedUid !== session.user.id) {
      _clearLocalData();   // different account on same device — wipe old data
    }
    localStorage.setItem('navya_uid', session.user.id);
    _resumeApp();
  }

  function _resumeApp() {
    if (!window.notifMgr && typeof NotifManager !== 'undefined') {
      window.notifMgr = new NotifManager();
    }

    var onboarded = localStorage.getItem('navya_onboarded');
    if (!onboarded) {
      _hideNav();
      window.obData = {};
      window.obStep = 1;
      if (typeof showOnboarding === 'function') showOnboarding(1);
      return;
    }

    _showNav();
    if (typeof getCurrentDay === 'function') window.currentDay = getCurrentDay();
    if (window.notifMgr && typeof DB !== 'undefined') {
      window.notifMgr.restoreFromPrefs(DB.getNotifPrefs());
    }
    if (typeof route === 'function') route(location.hash || '#home');

    if (typeof allCards !== 'undefined' && !allCards.length) {
      fetch('./bf_symptom_cards.json').then(function(r){return r.json();}).then(function(d){window.allCards=d;}).catch(function(){});
    }
    if (typeof mealPlan !== 'undefined' && !mealPlan.length) {
      fetch('./meal_plan.json').then(function(r){return r.json();}).then(function(d){window.mealPlan=d;}).catch(function(){});
    }
  }

  /* ── public: signOut ────────────────────────────────────── */
  function signOut() {
    if (window.notifMgr) {
      window.notifMgr.clearFeedReminder();
      window.notifMgr.clearCheckinReminder();
    }
    _supabaseClient.auth.signOut().finally(function () {
      _clearLocalData();
      showAuthScreen('signin');
    });
  }

  /* ── public: init ───────────────────────────────────────── */
  function init() {
    if (!window._supabaseClient) {
      console.warn('Navya: Supabase not available, running offline.');
      _offlineFallback();
      return;
    }

    // Show spinner while checking existing session
    _hideNav();
    var root = _root();
    if (root) {
      root.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:60vh;">' +
          '<span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--primary-container);animation:spin 1s linear infinite;">refresh</span>' +
        '</div>';
    }

    _supabaseClient.auth.getSession().then(function (result) {
      var session = result.data && result.data.session;
      if (!session) { showAuthScreen('signin'); return; }
      _onSignedIn(session);
    }).catch(function () {
      showAuthScreen('signin');
    });

    // Handles magic-link and session-refresh redirects
    _supabaseClient.auth.onAuthStateChange(function (event, session) {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        var nav = document.querySelector('.nav-bottom');
        var onAuthScreen = !nav || nav.style.display === 'none';
        if (onAuthScreen) _onSignedIn(session);
      }
      if (event === 'SIGNED_OUT') {
        _clearLocalData();
        showAuthScreen('signin');
      }
    });
  }

  function _offlineFallback() {
    if (typeof NotifManager !== 'undefined') window.notifMgr = new NotifManager();
    if (!localStorage.getItem('navya_onboarded')) {
      var nav = document.querySelector('.nav-bottom');
      if (nav) nav.style.display = 'none';
      window.obData = {};
      window.obStep = 1;
      if (typeof showOnboarding === 'function') showOnboarding(1);
      return;
    }
    if (typeof getCurrentDay === 'function') window.currentDay = getCurrentDay();
    if (window.notifMgr && typeof DB !== 'undefined') window.notifMgr.restoreFromPrefs(DB.getNotifPrefs());
    var nav = document.querySelector('.nav-bottom');
    if (nav) nav.style.display = '';
    if (typeof route === 'function') route(location.hash || '#home');
  }

  /* ── public API ─────────────────────────────────────────── */
  return {
    init:             init,
    showAuthScreen:   showAuthScreen,
    signOut:          signOut,
    _handleSubmit:    _handleSubmit,
    _handleMagicLink: _handleMagicLink,
    _togglePw:        _togglePw,
    _onSignedIn:      _onSignedIn,
    _clearLocalData:  _clearLocalData
  };

})();
