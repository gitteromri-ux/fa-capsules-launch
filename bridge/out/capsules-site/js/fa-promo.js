/* French Atelier — top promo strip + floating enroll CTA. Display-level only; the checkout engine (fa-checkout.js) owns the promo code logic. */
(function () {
  'use strict';
  var FA = window.FA_CHECKOUT; if (!FA) return;
  var CFG = FA.config, CODE = 'CAPSULE20', DEF = CFG.promos && CFG.promos[CODE]; if (!DEF) return;
  var isCaps = /capsules\.html$/i.test(location.pathname);
  var base = /\/courses\//.test(location.pathname) ? '../' : '';
  var SEEN = 'fa_promo_seen_v1', HIDE = 'fa_strip_hide_v1';
  function expiry() { var pr = FA.promoGet(); if (pr && pr.code === CODE) return pr.exp; var t; try { t = parseInt(localStorage.getItem(SEEN), 10); if (!t) { t = Date.now(); localStorage.setItem(SEEN, String(t)); } } catch (e) { t = Date.now(); } return t + (DEF.days || 7) * 864e5; }
  function left(ms) { if (ms <= 0) return 'now'; var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3); return (d ? d + 'd ' : '') + (h < 10 ? '0' : '') + h + 'h ' + (m < 10 ? '0' : '') + m + 'm' + (d ? '' : ' ' + (s < 10 ? '0' : '') + s + 's'); }

  /* ---- strip ---- */
  var hidden = false; try { hidden = sessionStorage.getItem(HIDE) === '1'; } catch (e) {}
  var exp = expiry();
  if (!hidden && exp > Date.now()) {
    var strip = document.createElement('a');
    strip.className = 'fa-strip'; strip.href = base + 'capsules.html?promo=' + CODE + '#offers'; strip.setAttribute('aria-label', 'Promo code ' + CODE + ': ' + DEF.label);
    strip.innerHTML = '<span class="fa-strip-code"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>' + CODE + '</span>' +
      '<span class="fa-strip-msg"><b>' + DEF.pct + '% off</b><span class="long"> any Culture Capsules package</span><span class="short"> any package</span></span>' +
      '<span class="fa-strip-ends"><i></i><span class="lbl">Ends in</span><b id="faStripTimer">' + left(exp - Date.now()) + '</b></span>' +
      '<span class="fa-strip-cta">Claim offer <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></span>' +
      '<button type="button" class="fa-strip-x" aria-label="Hide this offer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button>';
    document.body.appendChild(strip); document.body.classList.add('has-fa-strip');
    function fit() { document.documentElement.style.setProperty('--fa-top', strip.offsetHeight + 'px'); }
    fit(); window.addEventListener('resize', fit);
    var timer = strip.querySelector('#faStripTimer');
    setInterval(function () { var ms = exp - Date.now(); timer.textContent = left(ms); if (ms <= 0) remove(); }, 1000);
    function remove() { strip.remove(); document.body.classList.remove('has-fa-strip'); document.documentElement.style.setProperty('--fa-top', '0px'); }
    strip.querySelector('.fa-strip-x').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); try { sessionStorage.setItem(HIDE, '1'); } catch (err) {} remove(); });
    strip.addEventListener('click', function (e) {
      FA.promoApply(CODE); decorate();
      if (isCaps) { e.preventDefault(); var t = document.getElementById('offers'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  }

  /* ---- capsules page: show the applied code on the 1-capsule offer ---- */
  function decorate() {
    if (!isCaps || document.querySelector('.kpx-plans')) return;
    var pr = FA.promoFor('capsule-1'); if (!pr) return;
    var btn = document.querySelector('.fa-cap-offer [data-fa-buy="capsule-1"]'); if (!btn) return;
    var card = btn.closest('.fa-cap-offer'); if (!card || card.querySelector('.fa-promo-tag')) return;
    var p = FA.product('capsule-1');
    var price = card.querySelector('.price'), sub = card.querySelector('.sub');
    if (price) price.innerHTML = '<s>' + FA.fmt(p.baseMonthly) + '</s>' + FA.fmt2(p.monthly) + '<small>/ month</small>';
    if (sub) sub.innerHTML = '<strong>Code ' + pr.code + ' applied · ' + pr.def.pct + '% off</strong> · 3 monthly payments<br><span class="fa-tot">' + FA.fmt2(p.total) + ' over three months instead of ' + FA.fmt(p.baseTotal) + '</span>';
    var tag = document.createElement('div'); tag.className = 'fa-promo-tag'; tag.textContent = pr.code + ' applied · ' + pr.def.pct + '% off';
    card.insertBefore(tag, card.querySelector('h3'));
  }
  decorate();

  /* ---- floating enroll CTA ---- */
  var cta = document.createElement('a');
  cta.className = 'fa-float-cta'; cta.id = 'faFloatCta';
  var course = FA.product('fa-course');
  if (isCaps) {
    cta.href = '#offers'; cta.setAttribute('aria-label', 'Join the Culture Capsules — from $63 a month per capsule');
    cta.innerHTML = '<span class="fa-cta-text"><span class="fa-cta-eyebrow">Enroll now · 3 monthly payments</span><span class="fa-cta-title">Culture Capsules</span></span><span class="fa-cta-pill"><span class="price">from $63</span><span class="mo">/ MO</span><svg class="fa-cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></span>';
    cta.addEventListener('click', function (e) { var t = document.getElementById('offers'); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  } else {
    cta.href = base + 'pricing.html#enroll-online'; cta.setAttribute('aria-label', 'Enroll now in the French Atelier live course — ' + FA.fmt2(course.firstPayment) + ' for the first month, then ' + FA.fmt2(course.monthly) + ' a month');
    cta.innerHTML = '<span class="fa-cta-text"><span class="fa-cta-eyebrow">Enroll now · then ' + FA.fmt2(course.monthly) + ' / mo</span><span class="fa-cta-title">French Atelier · Live Course</span></span><span class="fa-cta-pill"><span class="price">' + FA.fmt2(course.firstPayment) + '</span><span class="mo">/ 1ST MO</span><svg class="fa-cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></span>';
    cta.addEventListener('click', function (e) { e.preventDefault(); FA.open('fa-course'); });
  }
  document.body.appendChild(cta); document.body.classList.add('has-fa-float');
  function onScroll() { cta.classList.toggle('is-visible', window.scrollY > 140); }
  window.addEventListener('scroll', onScroll, { passive: true });
  setTimeout(function () { cta.classList.add('is-visible'); }, 800);
  onScroll();
})();
