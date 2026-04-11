/* ─────────────────────────────────────────────────────────────
   Navya — CheckinService
   Handles all Supabase operations for the Daily Check-in screen.

   Tables used:
     daily_checkins          — one row per user per day
     daily_checkin_symptoms  — child rows, one per selected symptom
     (symptom_master         — read-only reference, not written here)

   Storage bucket:  voice-notes
     Path pattern:  {user_id}/{YYYY-MM-DD}.webm

   Depends on: supabase.js  (window._supabaseClient must exist)
   Called by:  app.js  (ciSave, showCheckin)
   ──────────────────────────────────────────────────────────── */

var CheckinService = (function () {

  /* ── internal: get authenticated user ──────────────────── */
  async function _getUser() {
    var result = await _supabaseClient.auth.getUser();
    if (result.error || !result.data.user) throw new Error('Not signed in');
    return result.data.user;
  }

  /* ── internal: upload voice blob to Storage ─────────────── */
  async function _uploadVoice(blob, userId, date) {
    // Determine file extension from blob MIME type
    var ext  = (blob.type || '').includes('ogg') ? 'ogg' : 'webm';
    var path = userId + '/' + date + '.' + ext;

    var { error } = await _supabaseClient.storage
      .from('voice-notes')
      .upload(path, blob, {
        upsert:      true,              // replace if user re-records on the same day
        contentType: blob.type || 'audio/webm',
      });

    if (error) throw error;

    // Get the public URL for playback
    var { data: urlData } = _supabaseClient.storage
      .from('voice-notes')
      .getPublicUrl(path);

    return { path: path, url: urlData.publicUrl };
  }

  /* ── public: save (or update) today's check-in ──────────── */
  /*
    state = {
      date:      'YYYY-MM-DD',
      mood:      'okay',
      note:      'text note',
      voiceText: 'transcript',
      symptoms:  ['slug-1', 'slug-2']
    }
    voiceBlob = MediaRecorder Blob or null
  */
  async function save(state, voiceBlob) {
    var user = await _getUser();

    /* ── Step 1: upsert daily_checkins ─────────────────────── */
    var { data: checkin, error: upsertErr } = await _supabaseClient
      .from('daily_checkins')
      .upsert(
        {
          user_id:           user.id,
          checkin_date:      state.date,
          mood:              state.mood        || null,
          text_note:         state.note        || null,       // was note_text
          voice_transcript:  state.voiceText   || null,
          checkin_timestamp: new Date().toISOString(),
        },
        { onConflict: 'user_id,checkin_date' }   // UPDATE on duplicate date
      )
      .select('id')
      .single();

    if (upsertErr) throw upsertErr;
    var checkinId = checkin.id;

    /* ── Step 2: delete existing symptoms for this check-in ── */
    var { error: delErr } = await _supabaseClient
      .from('daily_checkin_symptoms')
      .delete()
      .eq('daily_checkin_id', checkinId);   // was checkin_id

    if (delErr) throw delErr;

    /* ── Step 3: insert freshly selected symptoms ───────────── */
    if (state.symptoms && state.symptoms.length > 0) {
      // CHECK_IN_SYMPTOMS is a global defined in app.js
      var rows = state.symptoms.map(function (slug) {
        var meta = (typeof CHECK_IN_SYMPTOMS !== 'undefined')
          ? CHECK_IN_SYMPTOMS.find(function (s) { return s.slug === slug; })
          : null;
        return {
          daily_checkin_id: checkinId,          // was checkin_id
          symptom_slug:     slug,
          symptom_label:    meta ? meta.label    : slug,
          severity:         meta ? meta.severity : null,
        };
      });

      var { error: sympErr } = await _supabaseClient
        .from('daily_checkin_symptoms')
        .insert(rows);

      if (sympErr) throw sympErr;
    }

    /* ── Step 4: upload voice blob to Storage (if provided) ── */
    if (voiceBlob) {
      var voice = await _uploadVoice(voiceBlob, user.id, state.date);

      var { error: voiceUpdateErr } = await _supabaseClient
        .from('daily_checkins')
        .update({
          voice_note_storage_path: voice.path,  // was voice_note_path
          voice_note_url:          voice.url,
        })
        .eq('id', checkinId);

      if (voiceUpdateErr) throw voiceUpdateErr;
    }

    return checkinId;
  }

  /* ── public: load today's check-in from Supabase ───────── */
  async function loadToday(date) {
    var user = await _getUser();

    var { data, error } = await _supabaseClient
      .from('daily_checkins')
      .select('*, daily_checkin_symptoms(symptom_slug, symptom_label, severity)')
      .eq('user_id', user.id)
      .eq('checkin_date', date)
      .maybeSingle();          // returns null (not error) when no row exists

    if (error) throw error;
    return data;               // null if not found
  }

  /* ── public API ─────────────────────────────────────────── */
  return {
    save:      save,
    loadToday: loadToday,
  };

})();
