/* ===================== CONTACT FORM → BACKEND (POST /api/contact) ===================== */
(function contactForm(){
  const form   = document.getElementById('contactForm');
  if(!form) return;
  const status = document.getElementById('formStatus');
  const submit = form.querySelector('button[type="submit"]');

  /* bilingual status messages — mirror the site's data-en / data-sq convention */
  const MSG = {
    sending : { en:'Sending…',                              sq:'Duke dërguar…' },
    ok      : { en:'Thanks! We’ll get back to you soon.', sq:'Faleminderit! Do t’ju kthehemi së shpejti.' },
    invalid : { en:'Please fill in every field correctly.',  sq:'Ju lutemi plotësoni saktë çdo fushë.' },
    fail    : { en:'Something went wrong. Please try again.', sq:'Diçka shkoi keq. Ju lutemi provoni sërish.' },
  };
  const lang = () => (document.documentElement.lang === 'sq' ? 'sq' : 'en');
  const say  = (key, kind) => {
    status.textContent = MSG[key][lang()];
    status.className   = 'form-status' + (kind ? ' ' + kind : '');
  };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validate(data){
    const bad = [];
    if(!data.name    || data.name.trim().length    < 2)   bad.push('name');
    if(!data.email   || !EMAIL_RE.test(data.email))       bad.push('email');
    if(!data.message || data.message.trim().length < 10)  bad.push('message');
    return bad;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      name    : form.name.value,
      email   : form.email.value,
      message : form.message.value,
    };

    /* clear previous invalid marks */
    form.querySelectorAll('.field').forEach(f => f.classList.remove('invalid'));

    const bad = validate(data);
    if(bad.length){
      bad.forEach(n => form.querySelector(`[name="${n}"]`)?.closest('.field')?.classList.add('invalid'));
      say('invalid', 'err');
      return;
    }

    submit.disabled = true;
    say('sending');
    try{
      const res  = await fetch('/api/contact', {
        method  : 'POST',
        headers : { 'Content-Type':'application/json' },
        body    : JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if(res.ok && body.ok){
        say('ok', 'ok');
        form.reset();
      }else if(res.status === 400 && Array.isArray(body.fields)){
        body.fields.forEach(n => form.querySelector(`[name="${n}"]`)?.closest('.field')?.classList.add('invalid'));
        say('invalid', 'err');
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
