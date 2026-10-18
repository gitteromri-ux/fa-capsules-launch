/* The French Atelier — shared interactions */
(function(){
  // Header scroll state
  var header=document.querySelector('.site-header');
  function onScroll(){ if(!header)return; if(window.scrollY>40)header.classList.add('scrolled');else header.classList.remove('scrolled'); }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  // Mobile drawer
  var toggle=document.querySelector('.nav-toggle');
  var drawer=document.querySelector('.nav-drawer');
  var close=document.querySelector('.nav-drawer-close');
  if(toggle&&drawer){ toggle.addEventListener('click',function(){drawer.classList.add('open');document.body.style.overflow='hidden';}); }
  if(close&&drawer){ close.addEventListener('click',function(){drawer.classList.remove('open');document.body.style.overflow='';}); }
  if(drawer){ drawer.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){drawer.classList.remove('open');document.body.style.overflow='';});}); }

  // Scroll reveal — lenient: any sliver in view (or near it) reveals + never gets stuck
  var revealEls=[].slice.call(document.querySelectorAll('.reveal'));
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);} });
    },{threshold:0,rootMargin:'0px 0px 18% 0px'});
    revealEls.forEach(function(el){io.observe(el);});
    // Safety net: anything in or above the viewport that hasn't revealed yet gets revealed.
    var sweep=function(){
      var vh=window.innerHeight||800;
      revealEls.forEach(function(el){
        if(el.classList.contains('in'))return;
        var r=el.getBoundingClientRect();
        if(r.top < vh*1.15){ el.classList.add('in'); io.unobserve(el); }
      });
    };
    window.addEventListener('scroll',sweep,{passive:true});
    window.addEventListener('resize',sweep,{passive:true});
    sweep();
    // Absolute fallback: nothing stays invisible forever (fires fast so nothing ever looks broken).
    setTimeout(function(){ revealEls.forEach(function(el){ el.classList.add('in'); }); },1100);
    // Re-collect late-mounted reveal nodes and reveal anything already on-screen.
    setTimeout(function(){
      [].slice.call(document.querySelectorAll('.reveal:not(.in)')).forEach(function(el){ el.classList.add('in'); });
    },1800);
  } else {
    revealEls.forEach(function(el){el.classList.add('in');});
  }

  // Animated number counters (Acadomia power figures)
  var counters=document.querySelectorAll('[data-count]');
  if(counters.length){
    var cio=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        var el=e.target; cio.unobserve(el);
        var target=parseFloat(el.getAttribute('data-count'))||0;
        var pre=el.getAttribute('data-prefix')||'', suf=el.getAttribute('data-suffix')||'';
        var dur=1400, start=null;
        function step(ts){
          if(start===null) start=ts;
          var p=Math.min((ts-start)/dur,1);
          var eased=1-Math.pow(1-p,3);
          var val=target<10?(Math.round(target*eased*10)/10):Math.round(target*eased);
          el.textContent=pre+val+suf;
          if(p<1) requestAnimationFrame(step); else el.textContent=pre+target+suf;
        }
        requestAnimationFrame(step);
      });
    },{threshold:.4});
    counters.forEach(function(c){cio.observe(c);});
  }

  // Ambient autoplay-muted videos — play EVERY autoplay/muted video sitewide,
  // including Julien character clips (.jul-video, .jul-vid-card, .pm-main, .pm-sm),
  // even ones that mount below the fold (IntersectionObserver kicks them off).
  var ambient=[].slice.call(document.querySelectorAll('video[autoplay], video[muted], .video-bg video, .video-frame video, .video-band video, .jul-video-frame video, .jul-vid-card video, .pm-main video, .pm-sm video'));
  ambient.forEach(function(v){ v.muted=true; v.setAttribute('muted',''); v.setAttribute('playsinline',''); v.loop=true; v.play().catch(function(){}); });
  if('IntersectionObserver' in window && ambient.length){
    var vio=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.play().catch(function(){}); } });
    },{threshold:.05});
    ambient.forEach(function(v){ vio.observe(v); });
  }

  // Interactive course worlds (accordion)
  document.querySelectorAll('[data-world] .world-head').forEach(function(head){
    head.addEventListener('click',function(){
      var world=head.closest('[data-world]');
      if(!world)return;
      var open=world.classList.contains('is-open');
      // close all others
      document.querySelectorAll('[data-world].is-open').forEach(function(w){
        if(w!==world){w.classList.remove('is-open');var h=w.querySelector('.world-head');if(h)h.setAttribute('aria-expanded','false');}
      });
      world.classList.toggle('is-open',!open);
      head.setAttribute('aria-expanded',String(!open));
    });
  });

  // Sorbonne pillars (click-to-open accordion cards, keyboard accessible)
  document.querySelectorAll('.sorb-pillar .sorb-ph').forEach(function(head){
    head.addEventListener('click',function(){
      var pillar=head.closest('.sorb-pillar');
      if(!pillar)return;
      var open=pillar.classList.contains('is-open');
      // close siblings within the same group for a clean single-open feel
      var group=pillar.parentNode;
      if(group){
        group.querySelectorAll('.sorb-pillar.is-open').forEach(function(p){
          if(p!==pillar){p.classList.remove('is-open');var h=p.querySelector('.sorb-ph');if(h)h.setAttribute('aria-expanded','false');}
        });
      }
      pillar.classList.toggle('is-open',!open);
      head.setAttribute('aria-expanded',String(!open));
    });
  });

  // Pillar motion videos (autoplay muted loop)
  document.querySelectorAll('.pillar video').forEach(function(v){
    v.muted=true; v.setAttribute('muted',''); v.setAttribute('playsinline','');
    v.loop=true; v.play().catch(function(){});
  });

  // ===== Site-wide video playback: normal speed (1x) =====
  // Browsers reset playbackRate on source/metadata changes, so we reapply on
  // loadedmetadata, loadeddata and play. We also force muted + autoplay so the
  // ambient clips actually fire (autoplay requires muted).
  (function(){
    var RATE=1;
    function applyRate(v){ try{ v.playbackRate=RATE; v.defaultPlaybackRate=RATE; }catch(e){} }
    document.querySelectorAll('video').forEach(function(v){
      applyRate(v);
      v.addEventListener('loadedmetadata', function(){ applyRate(v); });
      v.addEventListener('loadeddata', function(){ applyRate(v); });
      v.addEventListener('play', function(){ applyRate(v); });
      v.addEventListener('ratechange', function(){ if(v.playbackRate!==RATE){ applyRate(v); } });
      // ensure autoplay actually fires (muted is required by browsers)
      v.muted=true; v.setAttribute('muted','');
      v.setAttribute('playsinline','');
      if(v.play){ var p=v.play(); if(p&&p.catch){ p.catch(function(){}); } }
      applyRate(v);
    });
  })();

  // Video sound opt-in (autoplay muted -> click to unmute)
  document.querySelectorAll('[data-soundvideo]').forEach(function(container){
    var v=container.querySelector('video');
    var btn=container.querySelector('.sound-toggle');
    if(!v)return;
    v.muted=true; v.play().catch(function(){});
    if(btn){
      btn.addEventListener('click',function(){
        v.muted=!v.muted;
        if(!v.muted){ v.play().catch(function(){}); }
        container.classList.toggle('unmuted',!v.muted);
        btn.setAttribute('aria-pressed',String(!v.muted));
      });
    }
  });

  // ===== Site-wide sound opt-in: floating sound button on every video =====
  (function(){
    var JULIEN_AUDIO='assets/julien/audio/julien_intro_fr.mp3';
    function isAmbient(v){
      var p=v.closest('[data-soundvideo]'); if(p)return true; // already has toggle
      var amb=v.closest('.pillar, .marquee');
      if(amb)return true;
      return false;
    }
    function isJulienCutout(v){
      return v.classList.contains('jul-cutout')||v.classList.contains('jul-hero-cutout');
    }
    function attachToggle(v, audioSrc){
      if(v.dataset.faSound)return; v.dataset.faSound='1';
      var wrap=v.parentElement; if(!wrap)return;
      var cs=window.getComputedStyle(wrap);
      if(cs.position==='static') wrap.style.position='relative';
      var btn=document.createElement('button');
      btn.className='fa-sound-btn'; btn.type='button';
      btn.setAttribute('aria-pressed','false');
      btn.setAttribute('aria-label','Toggle sound');
      btn.innerHTML='<span class="fa-sound-ico" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg></span><span class="fa-sound-txt">Sound</span>';
      var companion=null;
      if(audioSrc){
        companion=document.createElement('audio');
        companion.src=audioSrc; companion.loop=true; companion.preload='metadata';
        wrap.appendChild(companion);
      }
      btn.addEventListener('click',function(e){
        e.preventDefault(); e.stopPropagation();
        var on;
        if(companion){
          on=companion.paused;
          if(on){ companion.currentTime=0; companion.play().catch(function(){}); }
          else { companion.pause(); }
        } else {
          v.muted=!v.muted;
          if(!v.muted){ v.play().catch(function(){}); }
          on=!v.muted;
        }
        btn.setAttribute('aria-pressed',String(on));
        btn.classList.toggle('is-on',on);
        btn.querySelector('.fa-sound-txt').textContent=on?'Mute':'Sound';
        btn.querySelector('.fa-sound-txt').textContent=on?'Mute':(audioSrc?'Hear Julien':'Sound');
      });
      if(audioSrc){ btn.querySelector('.fa-sound-txt').textContent='Hear Julien'; }
      wrap.appendChild(btn);
    }
    document.querySelectorAll('video').forEach(function(v){
      // Skip videos inside the Julien fold — that section provides its own
      // custom .jul-hero-sound toggle. Avoid injecting duplicate buttons.
      if(v.closest('#julien-fold'))return;
      if(isJulienCutout(v)){
        // Julien page: each speaking clip has its own line + button; silent gesture clips get no intro audio
        if(v.hasAttribute('data-speak') || /juliane\.html/.test(location.pathname)) return;
        attachToggle(v, JULIEN_AUDIO);
        return;
      }
      if(isAmbient(v))return;
      attachToggle(v, null);
    });
  })();

  // ===== Pillar video perf: pause/play based on viewport visibility =====
  // Reduces concurrent decoding of 6 looping videos when off-screen.
  (function(){
    if(!('IntersectionObserver' in window))return;
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        var v=en.target;
        if(en.isIntersecting){
          v.removeAttribute('data-paused-offscreen');
          var p=v.play(); if(p&&p.catch)p.catch(function(){});
        } else {
          v.setAttribute('data-paused-offscreen','1');
          try{v.pause();}catch(e){}
        }
      });
    },{rootMargin:'120px 0px',threshold:0.05});
    document.querySelectorAll('.pillar video').forEach(function(v){
      // ensure attrs for autoplay-on-visible
      v.muted=true; v.loop=true; v.playsInline=true;
      v.setAttribute('preload','auto');
      io.observe(v);
    });
  })();
})();

/* ============================================================
   AGENT 5 — GLOBAL DESIGN SYSTEM INTERACTIONS
   modal open/close · marquee pause-on-hover · advisor-form
   validation + success · (scroll reveals + drawer handled above)
   Self-contained IIFE — does not touch accordion or pillar video.
   ============================================================ */
(function(){
  'use strict';

  /* ---------- Marquee: JS safeguard for pause-on-hover (CSS already handles) ---------- */
  document.querySelectorAll('.marquee').forEach(function(m){
    m.addEventListener('mouseenter',function(){m.classList.add('is-paused');});
    m.addEventListener('mouseleave',function(){m.classList.remove('is-paused');});
    // pause when offscreen for performance
    if('IntersectionObserver' in window){
      var track=m.querySelector('.marquee-track');
      if(track){
        new IntersectionObserver(function(es){
          es.forEach(function(e){track.style.animationPlayState=e.isIntersecting?'':'paused';});
        },{threshold:0}).observe(m);
      }
    }
  });

  /* ---------- Advisor modal: open via any [data-advisor] trigger ---------- */
  var modal=document.querySelector('.advisor-modal');
  var lastFocus=null;
  function openModal(){
    if(!modal)return;
    lastFocus=document.activeElement;
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    modal.setAttribute('aria-hidden','false');
    var first=modal.querySelector('input,select,button');
    if(first)setTimeout(function(){first.focus();},60);
  }
  function closeModal(){
    if(!modal)return;
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    modal.setAttribute('aria-hidden','true');
    if(lastFocus&&lastFocus.focus)lastFocus.focus();
  }
  document.querySelectorAll('[data-advisor]').forEach(function(trigger){
    trigger.addEventListener('click',function(e){e.preventDefault();openModal();});
  });
  if(modal){
    modal.querySelectorAll('.advisor-modal-close,[data-advisor-close]').forEach(function(b){
      b.addEventListener('click',closeModal);
    });
    modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('open'))closeModal();});
  }

  /* ---------- Advisor form ---------- */
  // Submission + validation are now handled by js/eteacher-leads.js, which posts
  // leads to the eTeacher CRM (French Atelier = ProductID 25). The old mailto
  // fallback handler was removed so it does not double-handle submits.
  // We keep only the lightweight "clear error styling as the user edits" UX.
  function clearError(field){ if(field) field.classList.remove('has-error'); }
  document.querySelectorAll('.advisor-form').forEach(function(form){
    form.querySelectorAll('input,select').forEach(function(inp){
      inp.addEventListener('input',function(){clearError(inp.closest('.field'));});
      inp.addEventListener('change',function(){clearError(inp.closest('.field'));});
    });
  });
})();

/* ============================================================
   COURSE PAGES — IIBS-level interactions (.cp-* / .faq-q)
   FAQ accordion · testimonial pause-offscreen · carousel nav
   Self-contained IIFE.
   ============================================================ */
(function(){
  'use strict';

  /* FAQ accordion (.faq-q toggles .faq-item.is-open) */
  document.querySelectorAll('.faq-q').forEach(function(q){
    q.setAttribute('aria-expanded','false');
    q.addEventListener('click',function(){
      var item=q.closest('.faq-item');
      if(!item)return;
      var open=item.classList.contains('is-open');
      item.classList.toggle('is-open',!open);
      q.setAttribute('aria-expanded',String(!open));
    });
  });

  /* FAQ accordion variant (.faq-btn[aria-expanded] toggles .faq-body.open) */
  document.querySelectorAll('.faq-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var open=btn.getAttribute('aria-expanded')==='true';
      var body=document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded',String(!open));
      if(body)body.classList.toggle('open',!open);
    });
  });

  /* Testimonial marquee: pause when offscreen for perf */
  document.querySelectorAll('.cp-testi').forEach(function(m){
    var track=m.querySelector('.cp-testi-track');
    if(track&&'IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){track.style.animationPlayState=e.isIntersecting?'':'paused';});
      },{threshold:0}).observe(m);
    }
  });

  /* Horizontal carousels (faculty + syllabus). Prev/next buttons via data-carousel-prev / -next pointing to a track id. */
  function scrollCarousel(id,dir){
    var track=document.getElementById(id);
    if(!track)return;
    var card=track.querySelector(':scope > *');
    var step=card?card.getBoundingClientRect().width+22:340;
    track.scrollBy({left:dir*step*1,behavior:'smooth'});
  }
  document.querySelectorAll('[data-carousel-prev]').forEach(function(b){
    b.addEventListener('click',function(){scrollCarousel(b.getAttribute('data-carousel-prev'),-1);});
  });
  document.querySelectorAll('[data-carousel-next]').forEach(function(b){
    b.addEventListener('click',function(){scrollCarousel(b.getAttribute('data-carousel-next'),1);});
  });

  /* ============================================================
     COURSE CLUSTERS — two clickable header cards reveal a
     horizontal slider. Default: nothing open. Clicking a cluster
     opens its slider; clicking the same one again closes it;
     clicking the other swaps. Smooth animate. Arrows + drag.
     ============================================================ */
  (function initClusters(){
    var btns = document.querySelectorAll('.cls-card[data-cluster]');
    if(!btns.length) return;
    var hint = document.getElementById('cls-hint');
    var active = null;

    function reveal(key){ return document.getElementById('cls-track-'+key); }
    function btn(key){ return document.getElementById('cls-btn-'+key); }

    function closePanel(key){
      var r = reveal(key), b = btn(key);
      if(!r) return;
      r.classList.remove('is-open');
      if(b){ b.classList.remove('is-active'); b.setAttribute('aria-selected','false'); }
      // collapse after transition
      window.setTimeout(function(){ if(!r.classList.contains('is-open')) r.hidden = true; }, 480);
    }
    function openPanel(key){
      var r = reveal(key), b = btn(key);
      if(!r) return;
      r.hidden = false;
      // force reflow so the transition runs from hidden->open
      void r.offsetWidth;
      r.classList.add('is-open');
      if(b){ b.classList.add('is-active'); b.setAttribute('aria-selected','true'); }
      active = key;
      if(hint) hint.classList.add('is-hidden');
      updateArrows(r);
      // Mobile: smooth-scroll revealed slider into view so user isn't blocked
      // by the other cluster card sitting between them and the courses.
      if(window.matchMedia && window.matchMedia('(max-width:760px)').matches){
        window.setTimeout(function(){
          try{
            var top = r.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({top: top, behavior: 'smooth'});
          }catch(e){}
        }, 320);
      }
    }

    btns.forEach(function(b){
      b.addEventListener('click', function(){
        var key = b.getAttribute('data-cluster');
        if(active === key){
          // toggle closed
          closePanel(key);
          active = null;
          if(hint) hint.classList.remove('is-hidden');
          return;
        }
        if(active){ closePanel(active); }
        openPanel(key);
      });

      /* ---- Hover-to-expand (1.2s dwell) ---- */
      var hoverTimer = null;
      var HOVER_DELAY = 1200;
      b.addEventListener('mouseenter', function(){
        var key = b.getAttribute('data-cluster');
        if(active === key) return;
        if(hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function(){
          if(active === key) return;
          if(active){ closePanel(active); }
          openPanel(key);
        }, HOVER_DELAY);
      });
      b.addEventListener('mouseleave', function(){
        if(hoverTimer){ clearTimeout(hoverTimer); hoverTimer = null; }
      });
    });

    /* ---- Slider: arrows ---- */
    function railOf(id){ return document.getElementById(id); }
    function stepWidth(rail){
      var card = rail.querySelector('.cls-course');
      if(!card) return 320;
      var gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    }
    function updateArrows(scope){
      var rail = (scope||document).querySelector('.cls-rail');
      if(!rail) return;
      var slider = rail.closest('.cls-slider');
      if(!slider) return;
      var prev = slider.querySelector('.cls-arrow-prev');
      var next = slider.querySelector('.cls-arrow-next');
      var max = rail.scrollWidth - rail.clientWidth - 2;
      if(prev) prev.disabled = rail.scrollLeft <= 2;
      if(next) next.disabled = rail.scrollLeft >= max;
    }
    document.querySelectorAll('[data-slider-prev]').forEach(function(btn){
      var rail = railOf(btn.getAttribute('data-slider-prev'));
      if(!rail) return;
      btn.addEventListener('click', function(){ rail.scrollBy({left:-stepWidth(rail),behavior:'smooth'}); });
      rail.addEventListener('scroll', function(){ updateArrows(rail.closest('.cls-reveal')||rail.parentNode); }, {passive:true});
    });
    document.querySelectorAll('[data-slider-next]').forEach(function(btn){
      var rail = railOf(btn.getAttribute('data-slider-next'));
      if(!rail) return;
      btn.addEventListener('click', function(){ rail.scrollBy({left:stepWidth(rail),behavior:'smooth'}); });
    });
    window.addEventListener('resize', function(){
      document.querySelectorAll('.cls-reveal.is-open').forEach(updateArrows);
    }, {passive:true});

    /* ---- Slider: pointer drag ---- */
    document.querySelectorAll('.cls-rail').forEach(function(rail){
      var down=false, startX=0, startScroll=0, moved=0;
      rail.addEventListener('pointerdown', function(e){
        down=true; moved=0; startX=e.clientX; startScroll=rail.scrollLeft;
        rail.classList.add('is-dragging');
        try{ rail.setPointerCapture(e.pointerId); }catch(_){}
      });
      rail.addEventListener('pointermove', function(e){
        if(!down) return;
        var dx = e.clientX - startX;
        moved = Math.max(moved, Math.abs(dx));
        rail.scrollLeft = startScroll - dx;
      });
      function end(){
        if(!down) return;
        down=false; rail.classList.remove('is-dragging');
        updateArrows(rail.closest('.cls-reveal')||rail.parentNode);
      }
      rail.addEventListener('pointerup', end);
      rail.addEventListener('pointercancel', end);
      rail.addEventListener('pointerleave', end);
      // prevent click navigation right after a drag
      rail.addEventListener('click', function(e){
        if(moved > 8){ e.preventDefault(); e.stopPropagation(); }
      }, true);
    });
  })();

  /* ============================================================
     HOW IT WORKS — single-row moveable slider (arrows + drag)
     ============================================================ */
  (function(){
    var track = document.getElementById('hiw3-journey');
    if(!track) return;
    var prev = document.querySelector('[data-hiw-prev]');
    var next = document.querySelector('[data-hiw-next]');

    function stepW(){
      var step = track.querySelector('.hiw3-step');
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0) || 20;
      return step ? (step.getBoundingClientRect().width + gap) : 240;
    }
    function updateArrows(){
      if(!prev || !next) return;
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
      var noScroll = track.scrollWidth <= track.clientWidth + 4;
      prev.style.display = next.style.display = noScroll ? 'none' : '';
    }
    if(prev) prev.addEventListener('click', function(){ track.scrollBy({left:-stepW(),behavior:'smooth'}); });
    if(next) next.addEventListener('click', function(){ track.scrollBy({left:stepW(),behavior:'smooth'}); });
    track.addEventListener('scroll', updateArrows, {passive:true});
    window.addEventListener('resize', updateArrows, {passive:true});
    setTimeout(updateArrows, 60);

    /* pointer drag */
    var down=false, startX=0, startScroll=0, moved=0;
    track.addEventListener('pointerdown', function(e){
      down=true; moved=0; startX=e.clientX; startScroll=track.scrollLeft;
      track.classList.add('is-dragging');
      try{ track.setPointerCapture(e.pointerId); }catch(_){}
    });
    track.addEventListener('pointermove', function(e){
      if(!down) return;
      var dx=e.clientX-startX; moved=Math.max(moved,Math.abs(dx));
      track.scrollLeft = startScroll - dx;
    });
    function end(){ if(!down) return; down=false; track.classList.remove('is-dragging'); updateArrows(); }
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
    track.addEventListener('pointerleave', end);
    track.addEventListener('click', function(e){ if(moved>8){ e.preventDefault(); e.stopPropagation(); } }, true);
  })();
})();

/* ============================================================
   NO-ORPHANS — guarantee no heading / eyebrow / subheader ever
   ends in a single stranded word, at ANY viewport width. We bind
   the final two words of each target element with a non-breaking
   space so they always wrap together. Deterministic and runs on
   every page, so line breakage stays consistent fold-to-fold.
   ============================================================ */
(function(){
  var SEL = [
    'h1','h2',
    '.display-xl','.display-lg','.display-md','.display-sm',
    '.sorb-title','.sorb-pr-tt','.ch-title','.hero-sub','.eyebrow',
    '.lede','.sorb-sub','.lt-sub','.cls-card-sub',
    '.hiw2-head p','.etg-head p','.culture-head p','.tctr-head p',
    '.cpx-plan-sub','.price-sub','.lede-narrow','.cpx-center p','.lede-c'
  ].join(',');

  function bindLastTwo(el){
    if(el.getAttribute('data-noorphan')==='1') return;
    // Only operate on the LAST text node so we don't disturb inner markup
    // (italics, spans). Find the deepest last text node with content.
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var last=null, n;
    while(n=walker.nextNode()){ if(n.textContent.replace(/\s+/g,'').length) last=n; }
    if(!last) return;
    var t = last.textContent.replace(/\s+$/,'');
    // Split into words; glue the last word to the previous one(s) with nbsp.
    // If the final word is long (>=8 chars), glue the last THREE words so a
    // long word can't strand itself even when the last pair won't fit a line.
    var parts = t.split(/(\s+)/); // keep separators
    // collect word tokens with their indices
    var words=[]; for(var k=0;k<parts.length;k++){ if(parts[k].trim().length) words.push(k); }
    if(words.length<2) return;
    // Glue the last two words. (Joining three can OVER-fill a line when the
    // final word is long, pushing MORE words down — so we always bind exactly
    // the last pair and let text-wrap:balance distribute the rest evenly.)
    var sepIdx = words[words.length-1]-1;
    if(sepIdx<0) return;
    if(parts[sepIdx]==='\u00a0') return;        // last pair already glued
    if(/\s/.test(parts[sepIdx])) parts[sepIdx]='\u00a0';
    last.textContent = parts.join('');
    el.setAttribute('data-noorphan','1');
  }

  function run(){
    try{ document.querySelectorAll(SEL).forEach(bindLastTwo); }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

/* ─────────────────────────────────────────────────────────────────
   Mobile slider indicators — auto-inject dots + side hints
   Adds visible dots beneath every horizontal-scrolling rail on mobile.
   ───────────────────────────────────────────────────────────────── */
(function(){
  if (window.matchMedia && !window.matchMedia('(max-width: 760px)').matches) return;

  var RAILS = [
    { sel: '.cls-cards',         label: 'Courses' },
    { sel: '.pillars-grid',      label: 'Culture' },
    { sel: '.hiw3-journey',      label: 'Learning Journey' },
    { sel: '.fac-gallery',       label: 'Teachers' },
    { sel: '.tst-track',         label: 'Testimonials' },
    { sel: '.sorb-principles',   label: 'Sorbonne Principles' },
    { sel: '.sorb-cred-links-v2',label: 'Citations' }
  ];

  function buildDots(rail){
    if (rail.dataset.faDots === '1') return;
    var n = rail.children.length;
    if (n < 2) return;
    var wrap = document.createElement('div');
    wrap.className = 'fa-rail-dots';
    wrap.setAttribute('role','tablist');
    for (var i=0;i<n;i++){
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'fa-rail-dot' + (i===0 ? ' is-active' : '');
      d.setAttribute('role','tab');
      d.setAttribute('aria-label','Slide ' + (i+1));
      d.dataset.idx = String(i);
      d.addEventListener('click', function(ev){
        var idx = +ev.currentTarget.dataset.idx;
        var card = rail.children[idx];
        if (!card) return;
        rail.scrollTo({ left: card.offsetLeft - rail.offsetLeft, behavior: 'smooth' });
      });
      wrap.appendChild(d);
    }
    rail.parentNode.insertBefore(wrap, rail.nextSibling);
    rail.dataset.faDots = '1';

    function syncActive(){
      var rect = rail.getBoundingClientRect();
      var center = rect.left + rect.width/2;
      var best = 0, bestDist = Infinity;
      for (var i=0;i<rail.children.length;i++){
        var cr = rail.children[i].getBoundingClientRect();
        var cc = cr.left + cr.width/2;
        var d = Math.abs(cc - center);
        if (d < bestDist){ bestDist = d; best = i; }
      }
      var dots = wrap.querySelectorAll('.fa-rail-dot');
      dots.forEach(function(d,i){ d.classList.toggle('is-active', i === best); });
    }
    rail.addEventListener('scroll', function(){
      window.requestAnimationFrame(syncActive);
    }, { passive: true });
    syncActive();
  }

  function init(){
    RAILS.forEach(function(r){
      document.querySelectorAll(r.sel).forEach(buildDots);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
