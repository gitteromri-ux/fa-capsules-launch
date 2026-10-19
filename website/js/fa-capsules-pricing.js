/* Culture Capsules 2026-10-13: click-to-play YouTube previews + copy promo code. */
(function(){
  document.querySelectorAll('.kpx-play[data-yt]').forEach(function(b){
    b.addEventListener('click',function(){
      var f=document.createElement('iframe');
      f.src='https://www.youtube-nocookie.com/embed/'+b.getAttribute('data-yt')+'?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen=true; f.title=b.getAttribute('aria-label')||'Video';
      b.parentNode.replaceChild(f,b);
    });
  });
  document.querySelectorAll('.kpx-code, .kpz-code').forEach(function(b){
    b.addEventListener('click',function(){
      var c=b.getAttribute('data-code');
      try{navigator.clipboard.writeText(c);}catch(e){}
      try{window.FA_CHECKOUT&&window.FA_CHECKOUT.promoApply&&window.FA_CHECKOUT.promoApply(c);}catch(e){}
      b.classList.add('is-copied'); var s=b.querySelector('.cp'); if(s){s.textContent='Copied';setTimeout(function(){s.textContent='Copy';b.classList.remove('is-copied');},2200);}
    });
  });
})();
