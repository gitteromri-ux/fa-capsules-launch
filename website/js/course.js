/* course.js — French Atelier course pages
   Animated counters · syllabus/testimonial carousels · FAQ accordion
   Standalone; does not depend on fa.js internals. */
(function(){
  'use strict';

  /* ---------- animated counters ---------- */
  function animateCounter(el){
    var target = parseFloat(el.getAttribute('data-target'));
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var dur = 1600, start = null;
    function frame(ts){
      if(start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix + val.toFixed(decimals) + suffix;
      if(p < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll('[data-target]');
  if(counters.length){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ animateCounter(e.target); cio.unobserve(e.target); }
      });
    }, {threshold:.4});
    counters.forEach(function(c){ cio.observe(c); });
  }

  /* ---------- carousels (syllabus + testimonials) ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function(wrap){
    var track = wrap.querySelector('[data-track]');
    var prev = wrap.querySelector('[data-prev]');
    var next = wrap.querySelector('[data-next]');
    if(!track) return;
    function step(){
      var card = track.querySelector(':scope > *');
      if(!card) return 320;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    }
    if(prev) prev.addEventListener('click', function(){ track.scrollBy({left:-step(),behavior:'smooth'}); });
    if(next) next.addEventListener('click', function(){ track.scrollBy({left:step(),behavior:'smooth'}); });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item .faq-q').forEach(function(q){
    q.addEventListener('click', function(){
      var item = q.closest('.faq-item');
      var ans = item.querySelector('.faq-a');
      var open = item.classList.contains('open');
      if(open){
        item.classList.remove('open');
        ans.style.maxHeight = '0px';
        q.setAttribute('aria-expanded','false');
      } else {
        item.classList.add('open');
        ans.style.maxHeight = ans.scrollHeight + 'px';
        q.setAttribute('aria-expanded','true');
      }
    });
  });

  /* ---------- ensure inline videos autoplay on iOS/Safari ---------- */
  document.querySelectorAll('video[autoplay]').forEach(function(v){
    v.muted = true; v.setAttribute('muted','');
    var p = v.play();
    if(p && p.catch) p.catch(function(){});
  });
})();
