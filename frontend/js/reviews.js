/* ===================== CLIENT REVIEWS =====================
   Loads existing reviews into the looping clients marquee, runs the
   star-rating widget, and posts new reviews to the backend. New reviews
   are added to the marquee immediately. */
(function reviews(){
  const marquee = document.getElementById('marquee');
  const form = document.getElementById('reviewForm');

  /* ---- helpers ---- */
  function escapeHtml(s){
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML; // escapes & < > so user text is safe to inject
  }
  function initials(name){
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    const s = (parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '');
    return (s || 'C').toUpperCase();
  }
  function cardHTML(r){
    const rating = Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5));
    const full = '★'.repeat(rating);
    const empty = '☆'.repeat(5 - rating);
    const emptyHtml = empty ? '<span class="stars-empty">' + empty + '</span>' : '';
    return '<div class="tcard is-review"><span class="stars" aria-hidden="true">' + full + emptyHtml + '</span>'
      + '<p>' + escapeHtml(r.text || '') + '</p>'
      + '<div class="who"><span class="avatar" aria-hidden="true">' + escapeHtml(initials(r.name)) + '</span>'
      + '<span><b>' + escapeHtml(r.name || 'Anonymous') + '</b><span>' + escapeHtml(r.role || 'Client') + '</span></span></div></div>';
  }
  /* Render each review exactly once — no duplication/looping. Cards sit in a
     static, centered row that wraps as more reviews come in. */
  const items = []; // newest first
  function render(){
    if(!marquee) return;
    marquee.classList.add('is-static');
    marquee.innerHTML = items.map(cardHTML).join('');
  }
  function addReview(r, toFront){
    if(!r) return;
    if(toFront) items.unshift(r); else items.push(r);
    render();
  }

  /* ---- load existing reviews ---- */
  fetch('/api/reviews')
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(data && data.ok && Array.isArray(data.reviews) && data.reviews.length){
        data.reviews.forEach(function(r){ items.push(r); });
        render();
      }
    })
    .catch(function(){});

  if(!form) return;

  /* ---- star-rating widget ---- */
  const ratingWrap = document.getElementById('ratingInput');
  const ratingInput = document.getElementById('rf-rating');
  const stars = ratingWrap ? Array.prototype.slice.call(ratingWrap.querySelectorAll('.star')) : [];
  function paint(val){ stars.forEach(function(s){ s.classList.toggle('on', +s.dataset.val <= val); }); }
  function setRating(val){ ratingInput.value = val; paint(val); }
  stars.forEach(function(s){
    s.addEventListener('click', function(){ setRating(+s.dataset.val); });
    s.addEventListener('mouseenter', function(){ paint(+s.dataset.val); });
  });
  if(ratingWrap) ratingWrap.addEventListener('mouseleave', function(){ paint(+ratingInput.value); });
  setRating(5);

  /* ---- status + validation ---- */
  const status = document.getElementById('reviewStatus');
  const submit = form.querySelector('button[type="submit"]');
  const MSG = {
    sending: { en:'Posting…', sq:'Duke postuar…' },
    ok: { en:'Thank you for your feedback!', sq:'Faleminderit për vlerësimin tuaj!' },
    fail: { en:'Could not post your review. Please try again.', sq:'Vlerësimi nuk u postua. Ju lutemi provoni sërish.' },
  };
  const FIELD_MSG = {
    name: { en:'Please enter your name (at least 2 characters).', sq:'Ju lutemi shkruani emrin (të paktën 2 karaktere).' },
    rating: { en:'Please pick a star rating.', sq:'Ju lutemi zgjidhni një vlerësim me yje.' },
    text: { en:'Please write at least 10 characters.', sq:'Ju lutemi shkruani të paktën 10 karaktere.' },
  };
  const lang = function(){ return document.documentElement.lang === 'sq' ? 'sq' : 'en'; };
  const say = function(key, kind){ status.textContent = MSG[key][lang()]; status.className = 'form-status' + (kind ? ' ' + kind : ''); };

  function clearErrors(){
    ['name','role','rating','text'].forEach(function(n){
      const f = document.getElementById('rfield-' + n); if(f) f.classList.remove('invalid');
      const e = document.getElementById('rerr-' + n); if(e) e.textContent = '';
    });
  }
  function showError(n){
    const f = document.getElementById('rfield-' + n); if(f) f.classList.add('invalid');
    const e = document.getElementById('rerr-' + n); if(e && FIELD_MSG[n]) e.textContent = FIELD_MSG[n][lang()];
  }
  function validate(d){
    const bad = [];
    if(!d.name || d.name.length < 2) bad.push('name');
    if(!(d.rating >= 1 && d.rating <= 5)) bad.push('rating');
    if(!d.text || d.text.length < 10) bad.push('text');
    return bad;
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    clearErrors();
    status.textContent = '';
    const d = {
      name: document.getElementById('rf-name').value.trim(),
      role: document.getElementById('rf-role').value.trim(),
      rating: parseInt(ratingInput.value, 10),
      text: document.getElementById('rf-text').value.trim(),
    };
    const bad = validate(d);
    if(bad.length){ bad.forEach(showError); return; }

    submit.disabled = true;
    say('sending');
    try{
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(d),
      });
      const body = await res.json().catch(function(){ return {}; });
      if(res.ok && body.ok){
        // 4★+ reviews auto-publish: show the new card right away (once, at the front).
        // Lower ratings are held for moderation and simply don't appear.
        if(body.published && body.review){ addReview(body.review, true); }
        say('ok', 'ok');
        form.reset();
        setRating(5);
      }else if(res.status === 400 && Array.isArray(body.fields)){
        body.fields.forEach(showError);
      }else{
        say('fail', 'err');
      }
    }catch(err){
      say('fail', 'err');
    }finally{
      submit.disabled = false;
    }
  });
})();
