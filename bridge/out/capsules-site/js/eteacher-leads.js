/* ============================================================================
   FRENCH ATELIER — eTeacher CRM Lead Integration
   ----------------------------------------------------------------------------
   Mirrors the Longevity Life Academy integration, but for FRENCH ATELIER.

   ⚠️  PRODUCT ID: 25  (French Atelier).  NOT 26 (that is Longevity).
       ProductID 25 is sent on every lead payload below.

   Flow:  Website form  ->  eTeacher AWS API Gateway (direct HTTPS POST)
          ->  SQS  ->  eTeacher Leads consumer.
          No Cloudflare worker is used; the site posts straight to the API.

   API docs: leads-api-documentation. Auth: none. Success: 200 OK.
   Required fields: FirstName, LastName, Email, CountryIsoCode, LandingPage,
                    UserAgent, and at least one of MobilePhone / HomePhone.
   ============================================================================ */
(function () {
  'use strict';

  // ---- Environment ---------------------------------------------------------
  // PRODUCTION: live eTeacher CRM endpoint (switched 2026-06-29 per user).
  // Staging was validated end-to-end (HTTP 200, lead queued) before this flip.
  var ETEACHER_ENV = 'production';

  // Routed through the French Atelier CORS relay (adds the CORS headers the
  // eTeacher AWS API does not send; forwards to eTeacher; forces ProductID 25).
  // This is a SEPARATE relay from Longevity's — Longevity is never touched.
  // Relay source: workspace/fa-leads-proxy/api/leads.js (Vercel).
  // Upstream eTeacher endpoints it forwards to (official API doc §2):
  //   staging:    https://81pg281wke.execute-api.eu-west-1.amazonaws.com/staging/leads
  //   production: https://u6ygel4ywa.execute-api.eu-west-1.amazonaws.com/prod/leads
  var ENDPOINTS = {
    staging:    'https://fa-leads-proxy.vercel.app/leads/staging',
    production: 'https://fa-leads-proxy.vercel.app/leads/production'
  };

  // French Atelier product id in the eTeacher CRM.
  var FA_PRODUCT_ID = 25;

  // ---- Best-effort country-by-IP (no key, single attempt, non-blocking) ----
  var ipCountryPromise = null;
  function getIpCountry() {
    if (ipCountryPromise) return ipCountryPromise;
    ipCountryPromise = fetch('https://ipapi.co/country/', { method: 'GET', cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (t) { t = (t || '').trim().toUpperCase(); return /^[A-Z]{2}$/.test(t) ? t : ''; })
      .catch(function () { return ''; });
    return ipCountryPromise;
  }

  function isValidEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

  // Country name -> ISO 3166-1 alpha-2 (covers common spellings; falls back to
  // the raw value if already a 2-letter code).
  var COUNTRY_TO_ISO = {
    'UNITED STATES': 'US', 'USA': 'US', 'US': 'US', 'AMERICA': 'US',
    'UNITED KINGDOM': 'GB', 'UK': 'GB', 'GREAT BRITAIN': 'GB', 'ENGLAND': 'GB', 'GB': 'GB',
    'CANADA': 'CA', 'CA': 'CA', 'AUSTRALIA': 'AU', 'AU': 'AU',
    'FRANCE': 'FR', 'FR': 'FR', 'GERMANY': 'DE', 'DE': 'DE', 'SPAIN': 'ES', 'ES': 'ES',
    'ITALY': 'IT', 'IT': 'IT', 'IRELAND': 'IE', 'IE': 'IE', 'NETHERLANDS': 'NL', 'NL': 'NL',
    'BELGIUM': 'BE', 'BE': 'BE', 'SWITZERLAND': 'CH', 'CH': 'CH', 'AUSTRIA': 'AT', 'AT': 'AT',
    'SWEDEN': 'SE', 'SE': 'SE', 'NORWAY': 'NO', 'NO': 'NO', 'DENMARK': 'DK', 'DK': 'DK',
    'PORTUGAL': 'PT', 'PT': 'PT', 'ISRAEL': 'IL', 'IL': 'IL', 'BRAZIL': 'BR', 'BR': 'BR',
    'MEXICO': 'MX', 'MX': 'MX', 'JAPAN': 'JP', 'JP': 'JP', 'CHINA': 'CN', 'CN': 'CN',
    'INDIA': 'IN', 'IN': 'IN', 'NEW ZEALAND': 'NZ', 'NZ': 'NZ', 'SOUTH AFRICA': 'ZA', 'ZA': 'ZA',
    'SINGAPORE': 'SG', 'SG': 'SG', 'UNITED ARAB EMIRATES': 'AE', 'UAE': 'AE', 'AE': 'AE'
  };
  function normalizeCountryIso(val, ipFallback) {
    var v = String(val || '').trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(v) && COUNTRY_TO_ISO[v]) return COUNTRY_TO_ISO[v];
    if (COUNTRY_TO_ISO[v]) return COUNTRY_TO_ISO[v];
    if (/^[A-Z]{2}$/.test(v)) return v; // already a plausible ISO-2
    return ipFallback || '';
  }

  // ---- Click-ID + UTM capture (persist 30d, like Longevity) ----------------
  var ATTR_KEYS = ['gclid', 'fbclid', 'msclkid', 'ttclid', 'li_fat_id', 'wbraid', 'gbraid',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var ATTR_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  var ATTR_STORAGE_KEY = 'fa_attribution_v1';
  function readAttributionStorage() {
    try {
      var raw = localStorage.getItem(ATTR_STORAGE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !obj.ts || (Date.now() - obj.ts) > ATTR_TTL_MS) return null;
      return obj;
    } catch (e) { return null; }
  }
  function captureAttribution() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var found = {}, hasAny = false;
      ATTR_KEYS.forEach(function (k) { var v = params.get(k); if (v) { found[k] = v; hasAny = true; } });
      if (hasAny) {
        found.ts = Date.now();
        found.first_landing = window.location.href;
        found.first_referrer = document.referrer || '';
        try { localStorage.setItem(ATTR_STORAGE_KEY, JSON.stringify(found)); } catch (e) {}
        return found;
      }
      return readAttributionStorage();
    } catch (e) { return null; }
  }
  var _cachedAttribution = captureAttribution();
  function getAttribution() { return _cachedAttribution || readAttributionStorage(); }
  function buildDynamicParameters(attr) {
    if (!attr) return '';
    var pairs = [];
    ATTR_KEYS.forEach(function (k) { if (attr[k]) pairs.push(k + '=' + attr[k]); });
    return pairs.join(';');
  }

  // ---- Retry policy (docs §4: 3 attempts, exp backoff, 5xx/network only) ----
  function postWithRetry(url, payload, attempt) {
    attempt = attempt || 1;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'omit',
      mode: 'cors'
    }).then(function (res) {
      if (res.status === 200) return { ok: true, status: 200 };
      if (res.status >= 400 && res.status < 500) return { ok: false, status: res.status, retryable: false };
      if (attempt < 3) {
        var delay = Math.pow(2, attempt - 1) * 1000;
        return new Promise(function (resolve) {
          setTimeout(function () { resolve(postWithRetry(url, payload, attempt + 1)); }, delay);
        });
      }
      return { ok: false, status: res.status, retryable: true };
    }).catch(function (err) {
      if (attempt < 3) {
        var delay = Math.pow(2, attempt - 1) * 1000;
        return new Promise(function (resolve) {
          setTimeout(function () { resolve(postWithRetry(url, payload, attempt + 1)); }, delay);
        });
      }
      return { ok: false, status: 0, retryable: true, error: String(err) };
    });
  }

  // ---- Public API: window.eTeacherLeads.submit(fields) ---------------------
  // fields: { firstName, lastName, email, phone, countryIso, level, timing,
  //           preferredTime, adminNotes, campaignId, googleCampaignId }
  window.eTeacherLeads = {
    endpoint: ENDPOINTS[ETEACHER_ENV],
    env: ETEACHER_ENV,
    productId: FA_PRODUCT_ID,
    getAttribution: getAttribution,
    submit: function (fields) {
      return getIpCountry().then(function (ipCountry) {
        var countryIso = normalizeCountryIso(fields.countryIso, ipCountry);

        // Hard validation per docs §3.3.
        if (!fields || !fields.firstName || !fields.lastName ||
            !isValidEmail(fields.email || '') || !fields.phone || !countryIso) {
          return { ok: false, status: 0, error: 'Missing or invalid fields' };
        }

        var payload = {
          FirstName: String(fields.firstName).trim(),
          LastName:  String(fields.lastName).trim(),
          Email:     String(fields.email).trim(),
          MobilePhone: String(fields.phone).trim(),
          CountryIsoCode: countryIso,
          LandingPage: window.location.href,
          UserAgent: navigator.userAgent,
          ReferringSite: document.referrer || window.location.hostname,
          QueryString: (window.location.search || '').replace(/^\?/, ''),
          // ⚠️ ProductID 25 = French Atelier. Sent explicitly AND tagged by the worker.
          ProductID: FA_PRODUCT_ID
        };
        if (ipCountry) payload.CountryIsoCodeByIp = ipCountry;

        // Roll level / timing / preferred-time into AdminNotes so advisors have
        // context (these are FA-specific and not first-class CRM fields).
        var notes = [];
        notes.push('Source: French Atelier (ProductID 25)');
        if (fields.level) notes.push('French level: ' + fields.level);
        if (fields.timing) notes.push('Start timing: ' + fields.timing);
        if (fields.preferredTime) notes.push('Preferred time: ' + fields.preferredTime);
        if (fields.adminNotes) notes.push(String(fields.adminNotes));
        payload.AdminNotes = notes.join(' | ').slice(0, 4000);

        // Attribution -> DynamicParameters
        var attr = getAttribution();
        var dyn = buildDynamicParameters(attr);
        if (fields.googleCampaignId && /^\d+$/.test(String(fields.googleCampaignId))) {
          dyn = (dyn ? dyn + ';' : '') + 'google_campaign_id=' + String(fields.googleCampaignId);
        }
        if (dyn) payload.DynamicParameters = dyn.slice(0, 4000);

        // eTeacher internal CampaignID (integer), if configured.
        if (fields.campaignId && /^\d+$/.test(String(fields.campaignId))) {
          payload.CampaignID = parseInt(fields.campaignId, 10);
        }

        return postWithRetry(ENDPOINTS[ETEACHER_ENV], payload);
      });
    }
  };
})();

/* ============================================================================
   UNIVERSAL FORM -> CRM SUBMIT HANDLER
   Binds to: #lg-form (full homepage form), .advisor-form (site-wide),
   and .contact-form (contact page). Awaits the API; only shows the success
   state on a 200 OK. On error, shows an inline message and keeps the form.
   ============================================================================ */
(function () {
  'use strict';

  // Optional eTeacher CampaignID per form (waiting on eTeacher to provide).
  window.FA_CAMPAIGN_IDS = window.FA_CAMPAIGN_IDS || {
    // 'lg-form': 123456,
  };
  // Google Ads Campaign IDs by ISO-2 country (sent in DynamicParameters).
  window.FA_GOOGLE_CAMPAIGN_IDS = window.FA_GOOGLE_CAMPAIGN_IDS || {
    // US: '000000', GB: '000000'
  };

  function val(form, name) {
    var el = form.querySelector('[name="' + name + '"], #' + name);
    return el ? (el.value || '') : '';
  }
  function splitName(full) {
    var parts = String(full || '').trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return { first: '', last: '' };
    if (parts.length === 1) return { first: parts[0], last: parts[0] }; // CRM needs a last name
    return { first: parts[0], last: parts.slice(1).join(' ') };
  }

  function ensureErrorBox(form) {
    var box = form.querySelector('.fa-form-error');
    if (!box) {
      box = document.createElement('div');
      box.className = 'fa-form-error';
      box.setAttribute('role', 'alert');
      box.style.cssText = 'display:none;margin-top:14px;padding:12px 16px;border-radius:12px;' +
        'background:rgba(176,28,46,.07);border:1px solid rgba(176,28,46,.32);color:#7a1320;' +
        'font-size:14px;line-height:1.5;';
      var submit = form.querySelector('button[type="submit"], .form-submit, .lg-submit');
      var anchor = submit && submit.closest ? (submit.closest('.form-submit') || submit) : submit;
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor.nextSibling);
      else form.appendChild(box);
    }
    return box;
  }
  function showError(form, msg) { var b = ensureErrorBox(form); b.textContent = msg; b.style.display = 'block'; }
  function clearError(form) { var b = form.querySelector('.fa-form-error'); if (b) b.style.display = 'none'; }

  function showSuccess(form) {
    // 1) Homepage lg-form uses .is-sent on the form (CSS: .lg-form.is-sent .lg-success{display:block}).
    if (form.classList.contains('lg-form')) { form.classList.add('is-sent'); return; }
    // 2) advisor-form: CSS reveals the success via .advisor-card.is-success .advisor-success
    //    and hides the form via .advisor-form.is-success. Match that exact mechanism.
    if (form.classList.contains('advisor-form')) {
      var card = form.closest('.advisor-card') || form.parentNode;
      if (card) card.classList.add('is-success');
      form.classList.add('is-success');
      try {
        var success = card ? card.querySelector('.advisor-success') : null;
        if (success) success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {}
      return;
    }
    // 3) Generic fallback (e.g. contact-form): mark sent + reset.
    form.classList.add('is-success');
    form.reset();
  }

  function collectFields(form) {
    var first = val(form, 'first_name') || val(form, 'firstName') || val(form, 'lg-first');
    var last  = val(form, 'last_name')  || val(form, 'lastName')  || val(form, 'lg-last');
    if (!first && !last) {
      var nm = splitName(val(form, 'name'));
      first = nm.first; last = nm.last;
    }
    var countryIso = val(form, 'country') || val(form, 'countryIso') || val(form, 'lg-country');
    // Capture any free-text message (contact form) into AdminNotes so it is not lost.
    var message = val(form, 'message');
    var baseNotes = form.dataset.adminNotes || '';
    if (message) baseNotes = (baseNotes ? baseNotes + ' | ' : '') + 'Message: ' + message;
    var fields = {
      firstName: first,
      lastName: last,
      email: val(form, 'email') || val(form, 'lg-email'),
      phone: val(form, 'phone') || val(form, 'lg-phone'),
      countryIso: countryIso,
      level: val(form, 'level'),
      timing: val(form, 'timing'),
      preferredTime: val(form, 'time'),
      adminNotes: baseNotes,
      campaignId: (window.FA_CAMPAIGN_IDS && window.FA_CAMPAIGN_IDS[form.dataset.formId || form.id]) || '',
      googleCampaignId: ''
    };
    if (countryIso && window.FA_GOOGLE_CAMPAIGN_IDS) {
      fields.googleCampaignId = window.FA_GOOGLE_CAMPAIGN_IDS[String(countryIso).toUpperCase()] || '';
    }
    return fields;
  }

  function bind(form) {
    if (form.dataset.crmBound === '1') return;
    form.dataset.crmBound = '1';
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError(form);
      var f = collectFields(form);

      if (!f.firstName || !f.lastName) { showError(form, 'Please enter your full name (first and last).'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { showError(form, 'Please enter a valid email address.'); return; }
      if (!f.phone) { showError(form, 'Please enter a phone number so an advisor can reach you.'); return; }
      if (!f.countryIso) { showError(form, 'Please enter your country.'); return; }
      // "All fields required": enforce the level / timing selects when the form has them.
      if (form.querySelector('select[name="level"]') && !f.level) { showError(form, 'Please select your French level.'); return; }
      if (form.querySelector('select[name="timing"]') && !f.timing) { showError(form, 'Please choose when you would like to start.'); return; }

      form.classList.add('is-submitting');
      window.eTeacherLeads.submit(f).then(function (res) {
        form.classList.remove('is-submitting');
        var attr = (window.eTeacherLeads.getAttribution && window.eTeacherLeads.getAttribution()) || {};
        if (res.ok) {
          try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              event: 'lead_form_submit', form_id: form.dataset.formId || form.id || form.className || 'fa-form',
              crm_status: 'ok', product_id: 25, env: window.eTeacherLeads.env,
              gclid: attr.gclid || '', fbclid: attr.fbclid || '',
              utm_source: attr.utm_source || '', utm_campaign: attr.utm_campaign || '',
              utm_medium: attr.utm_medium || ''
            });
          } catch (err) {}
          showSuccess(form);
        } else {
          try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ event: 'lead_form_submit_error', form_id: form.dataset.formId || form.id || 'fa-form', crm_status: res.status, product_id: 25, env: window.eTeacherLeads.env });
          } catch (err) {}
          showError(form, "We couldn't submit your details right now. Please try again in a moment, or email advisor@eTeacherGroup.com.");
        }
      });
    });
  }

  function init() {
    document.querySelectorAll('#lg-form, form.lg-form, form.advisor-form, form.contact-form').forEach(bind);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
