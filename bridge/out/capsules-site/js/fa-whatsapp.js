/* French Atelier — WhatsApp floater + inline "Start Chat on WhatsApp" buttons (Longevity / eTeacher IIBS pattern).
   Display-only: adds sibling links next to existing lead forms; never touches the form fields or submit handlers. */
(function () {
  'use strict';
  var NUM = '12015023701'; /* same wa.me channel as longevitylifeacademy.com — confirm the French Atelier number before go-live */
  var HREF = 'https://wa.me/' + NUM + '?text=' + encodeURIComponent('Bonjour! I would like to know more about The French Atelier by Acadomia.');
  var base = /\/courses\//.test(location.pathname) ? '../' : '';
  var ICON = base + 'assets/wa/whatsapp.svg';
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function inlineBtn(label) {
    return el('<a class="fa-wa-inline" href="' + HREF + '" target="_blank" rel="noopener"><img src="' + ICON + '" alt="" width="18" height="18"><span>' + (label || 'Start Chat on WhatsApp') + '</span></a>');
  }

  /* floater (bottom-right; moves above the mobile enroll bar when present) */
  if (!document.getElementById('fa-wa')) {
    var f = el('<div id="fa-wa" class="fa-wa"><a class="fa-wa-btn" href="' + HREF + '" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp"><img src="' + ICON + '" alt="" width="22" height="22"><span class="fa-wa-lbl">Available on WhatsApp</span></a></div>');
    document.body.appendChild(f);
    setTimeout(function () { f.classList.add('is-in'); }, 600);
  }

  /* inline buttons after every lead-form submit (lead gen v2, advisor modal, contact form, pricing forms) */
  function addAfterSubmits() {
    var subs = document.querySelectorAll('form button[type="submit"]:not(.fa-ck-submit):not([data-wa-done])');
    Array.prototype.forEach.call(subs, function (b) {
      if (b.closest('#fa-ck') || b.closest('#fa-pay')) return;
      b.setAttribute('data-wa-done', '1');
      var wrap = el('<div class="fa-wa-after"><div class="fa-wa-or" aria-hidden="true"><span>or</span></div></div>');
      wrap.appendChild(inlineBtn());
      b.insertAdjacentElement('afterend', wrap);
    });
  }
  addAfterSubmits();
  /* modals rendered later (advisor modal / checkout) */
  var mo = new MutationObserver(function () { addAfterSubmits(); helpCards(); });
  mo.observe(document.body, { childList: true, subtree: true });

  /* help cards: checkout page side card + checkout modal "Not sure?" line */
  function helpCards() {
    var h = document.querySelector('#fa-pay .fa-pay-help');
    if (h && !h.querySelector('.fa-wa-inline')) { var tel = h.querySelector('.fa-pay-help-tel'); var b = inlineBtn('Chat with admissions on WhatsApp'); if (tel) tel.insertAdjacentElement('afterend', b); else h.appendChild(b); }
    var m = document.querySelector('#fa-ck .fa-ck-help');
    if (m && !m.parentNode.querySelector('.fa-wa-inline.is-modal')) { var mb = inlineBtn('Questions? Chat on WhatsApp'); mb.classList.add('is-modal'); m.insertAdjacentElement('afterend', mb); }
  }
  helpCards();
})();
