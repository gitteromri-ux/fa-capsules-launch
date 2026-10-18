/* Culture Capsules v3 — hero reel, capsule reveal, stage reels */
(function(){
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function playSafe(v){ if(!v) return; var p=v.play&&v.play(); if(p&&p.catch) p.catch(function(){}); }
  function loadSrc(v){
    if(!v || v.dataset.loaded) return;
    v.querySelectorAll('source[data-src]').forEach(function(s){ s.src=s.getAttribute('data-src'); });
    v.dataset.loaded='1'; v.load();
  }

  /* ---- hero: three worlds, one clip each, crossfade ---- */
  var hero=document.querySelector('.kps-hero');
  if(hero){
    var vids=[].slice.call(hero.querySelectorAll('.bg video'));
    var pills=[].slice.call(hero.querySelectorAll('.kps-reel .kps-pill'));
    var idx=0, timer=null;
    function show(i){
      idx=(i+vids.length)%vids.length;
      vids.forEach(function(v,k){ var on=k===idx; v.classList.toggle('is-on',on); if(on){ v.currentTime=0; playSafe(v);} else { try{v.pause();}catch(e){} } });
      pills.forEach(function(p,k){ p.classList.toggle('is-on',k===idx); p.setAttribute('aria-selected',k===idx?'true':'false'); });
    }
    function arm(){ if(reduce) return; clearInterval(timer); timer=setInterval(function(){ show(idx+1); }, 7000); }
    pills.forEach(function(p,k){ p.addEventListener('click',function(){ show(k); arm(); }); });
    var first=vids.findIndex(function(v){return v.classList.contains('is-on');}); if(first<0) first=0;
    vids.forEach(function(v){ v.muted=true; });
    show(first); arm();
    document.addEventListener('visibilitychange',function(){ if(document.hidden){ clearInterval(timer);} else { arm(); playSafe(vids[idx]); } });
  }

  /* ---- capsule cards -> reveals ---- */
  var cards=[].slice.call(document.querySelectorAll('.kps-card[data-pack]'));
  var reveals={}; var stageTimers={};
  cards.forEach(function(c){ reveals[c.dataset.pack]=document.getElementById('kps-reveal-'+c.dataset.pack); });

  function stageStart(rev){
    var vids=[].slice.call(rev.querySelectorAll('.kps-stage video'));
    var dots=[].slice.call(rev.querySelectorAll('.kps-stage .reel i'));
    if(!vids.length) return;
    vids.forEach(loadSrc);
    var i=0;
    function go(n){
      i=n%vids.length;
      vids.forEach(function(v,k){ var on=k===i; v.classList.toggle('is-on',on); if(on){ v.currentTime=0; playSafe(v);} else { try{v.pause();}catch(e){} } });
      dots.forEach(function(d,k){ d.classList.toggle('is-on',k===i); });
    }
    go(0);
    clearInterval(stageTimers[rev.id]);
    if(!reduce) stageTimers[rev.id]=setInterval(function(){ go(i+1); }, 7000);
  }
  function stageStop(rev){
    clearInterval(stageTimers[rev.id]);
    rev.querySelectorAll('.kps-stage video').forEach(function(v){ try{v.pause();}catch(e){} });
  }

  function open(pack, scroll){
    cards.forEach(function(c){
      var on=c.dataset.pack===pack;
      c.classList.toggle('is-open',on); c.setAttribute('aria-expanded',on?'true':'false');
      var r=reveals[c.dataset.pack]; if(!r) return;
      if(on){ r.classList.add('is-open'); stageStart(r); }
      else { r.classList.remove('is-open'); stageStop(r); }
    });
    if(scroll && reveals[pack]){
      var top=reveals[pack].getBoundingClientRect().top+window.pageYOffset-90;
      window.scrollTo({top:top,behavior:reduce?'auto':'smooth'});
    }
  }
  function toggle(pack){
    var c=cards.filter(function(x){return x.dataset.pack===pack;})[0];
    if(c && c.classList.contains('is-open')){ c.classList.remove('is-open'); c.setAttribute('aria-expanded','false'); reveals[pack].classList.remove('is-open'); stageStop(reveals[pack]); }
    else open(pack,true);
  }
  cards.forEach(function(c){
    c.addEventListener('click',function(){ toggle(c.dataset.pack); });
    c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(c.dataset.pack); } });
  });
  if(location.hash && /^#capsule-(fashion|gastro|cinema)$/.test(location.hash)){ open(location.hash.replace('#capsule-',''),true); }
  else if(cards.length){ open(cards[0].dataset.pack,false); }

  /* ---- speakers background: lazy clip ---- */
  var sp=document.querySelector('.kps-method .bg video');
  if(sp && 'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ loadSrc(sp); playSafe(sp); io.disconnect(); } }); },{rootMargin:'300px'});
    io.observe(sp);
  }
})();
