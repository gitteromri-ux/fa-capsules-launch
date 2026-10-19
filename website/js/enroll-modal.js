/* Enroll Now -> lead form popup (same #lg-form fields, same eTeacher CRM binding) */
(function(){
  var ROOT = (document.currentScript && document.currentScript.src.indexOf('/js/enroll-modal.js')>-1) ? document.currentScript.src.split('/js/enroll-modal.js')[0] + '/' : '';
  var FORM = '<form class="lg-form em-form" id="em-lg-form" novalidate>\n      <div class="lg-form-body">\n        <p class="lg-form-title">Personal consultation request</p>\n        <p class="lg-form-sub">All fields required. Your information is private and never shared.</p>\n        <div class="lg-row two">\n          <div class="lg-field"><label for="em-lg-first">First name</label><input id="em-lg-first" name="first_name" type="text" required autocomplete="given-name" placeholder="Marie"></div>\n          <div class="lg-field"><label for="em-lg-last">Last name</label><input id="em-lg-last" name="last_name" type="text" required autocomplete="family-name" placeholder="Laurent"></div>\n        </div>\n        <div class="lg-row" style="margin-top:1.05rem">\n          <div class="lg-field"><label for="em-lg-email">Email</label><input id="em-lg-email" name="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>\n        </div>\n        <div class="lg-row two" style="margin-top:1.05rem">\n          <div class="lg-field"><label for="em-lg-phone">Phone</label><input id="em-lg-phone" name="phone" type="tel" required autocomplete="tel" placeholder="+1 555 123 4567"></div>\n          <div class="lg-field"><label for="em-lg-level">French level</label><select id="em-lg-level" name="level" required><option value="" disabled selected>Select your level</option><option value="absolute-beginner">Absolute beginner</option><option value="beginner">Beginner (A1)</option><option value="elementary">Elementary (A2)</option><option value="intermediate">Intermediate (B1)</option><option value="upper-intermediate">Upper-intermediate (B2)</option><option value="advanced">Advanced (C1+)</option><option value="unsure">I\'m not sure</option></select></div>\n        </div>\n        <div class="lg-row two" style="margin-top:1.05rem">\n          <div class="lg-field"><label for="em-lg-timing">When to start</label><select id="em-lg-timing" name="timing" required><option value="" disabled selected>Choose timing</option><option value="asap">As soon as possible</option><option value="1-month">Within a month</option><option value="3-months">Within 3 months</option><option value="exploring">Just exploring</option></select></div>\n          <div class="lg-field"><label for="em-lg-country">Country</label><input id="em-lg-country" name="country" type="text" required autocomplete="country-name" placeholder="United States"></div>\n        </div>\n        <button type="submit" class="lg-submit">Request my consultation</button>\n        <p class="lg-fineprint">By submitting you agree to our <a href="__ROOT__privacy.html">Privacy Policy</a> and to be contacted by our enrollment team.</p>\n      </div>\n      <div class="lg-success" role="status" aria-live="polite">Merci. Your request has been received — we will reach out within one business day.</div>\n    </form>';
  var overlay;
  function build(){
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'em-overlay'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true'); overlay.setAttribute('aria-label','Enrollment consultation request');
    overlay.innerHTML = '<div class="em-modal"><button type="button" class="em-close" aria-label="Close">&times;</button>' + FORM.replace(/__ROOT__/g, ROOT) + '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });
    overlay.querySelector('.em-close').addEventListener('click', close);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
    var f = overlay.querySelector('form');
    f.dataset.formId = 'lg-form'; // identical tracking id to the homepage form
    if (!document.getElementById('lg-form')) f.id = 'lg-form';
    if (window.eTeacherLeads && typeof window.eTeacherLeads.bind === 'function') window.eTeacherLeads.bind(f);
    else if (window.__eTeacherBind) window.__eTeacherBind(f);
    return overlay;
  }
  function open(e){
    if (e) e.preventDefault();
    build().classList.add('is-open'); document.body.classList.add('em-lock');
    var first = overlay.querySelector('input'); if (first && window.innerWidth > 640) setTimeout(function(){ first.focus(); }, 60);
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'enroll_modal_open', page: location.pathname }); } catch (err) {}
  }
  function close(){ if (!overlay) return; overlay.classList.remove('is-open'); document.body.classList.remove('em-lock'); }
  function isEnroll(a){ return /^\s*enrol+\s+now\s*$/i.test(a.textContent || ''); }
  function wire(){
    document.querySelectorAll('a,button').forEach(function(a){
      if (a.__em || !isEnroll(a)) return;
      a.__em = true; a.setAttribute('data-enroll-modal','1'); a.addEventListener('click', open);
    });
    // pre-build so eTeacher's init (DOMContentLoaded) can bind the form
    build();
  }
  if (document.body) wire(); // script sits at end of body: build now so eTeacher's deferred init binds the popup form
  document.addEventListener('DOMContentLoaded', wire);
  window.addEventListener('load', wire);
  try { new MutationObserver(function(){ wire(); }).observe(document.documentElement, { childList: true, subtree: true }); } catch (err) {}
  window.openEnrollModal = open;
})();
