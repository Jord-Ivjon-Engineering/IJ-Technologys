(function contactForm(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  const status = document.getElementById('formStatus');
  const submit = form.querySelector('button[type="submit"]');
  const pkgSelect = document.getElementById('cf-package');
  const DRAFT_KEY = 'ij-contact-draft';

  const MSG = {
    sending: { en:'Sending…', sq:'Duke dërguar…' },
    ok: { en:'Thanks! We will reply within one business day.', sq:'Faleminderit! Do t\'ju kthehemi brenda një dite pune.' },
    fail: { en:'Something went wrong. Please try again or email hello@ijTechnology.com.', sq:'Diçka shkoi keq. Provoni sërish ose dërgoni email te hello@ijTechnology.com.' },
  };

  const FIELD_MSG = {
    name: {
      en:'Please enter your name (at least 2 characters).',
      sq:'Ju lutemi shkruani emrin (të paktën 2 karaktere).',
    },
    email: {
      en:'Please enter a valid email address.',
      sq:'Ju lutemi shkruani një adresë email të vlefshme.',
    },
    message: {
      en:'Please tell us a bit more (at least 10 characters).',
      sq:'Ju lutemi shkruani pak më shumë (të paktën 10 karaktere).',
    },
  };

  const lang = () => (document.documentElement.lang === 'sq' ? 'sq' : 'en');
  const say = (key, kind) => {
    status.textContent = MSG[key][lang()];
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function clearFieldErrors(){
    form.querySelectorAll('.field').forEach(f => f.classList.remove('invalid'));
    ['name','email','message'].forEach(n=>{
      const el = document.getElementById('err-' + n);
      if(el) el.textContent = '';
    });
  }

  function showFieldError(name){
    const wrap = document.getElementById('field-' + name);
    const err = document.getElementById('err-' + name);
    if(wrap) wrap.classList.add('invalid');
    if(err && FIELD_MSG[name]) err.textContent = FIELD_MSG[name][lang()];
  }

  function validate(data){
    const bad = [];
    if(!data.name || data.name.trim().length < 2) bad.push('name');
    if(!data.email || !EMAIL_RE.test(data.email)) bad.push('email');
    if(!data.message || data.message.trim().length < 10) bad.push('message');
    return bad;
  }

  function applyPlan(plan){
    if(!pkgSelect || !plan) return;
    const opt = Array.from(pkgSelect.options).find(o => o.value === plan);
    if(opt) pkgSelect.value = plan;
    const msg = form.message;
    if(msg && !msg.value.trim()){
      const pre = lang() === 'sq'
        ? `Jam i interesuar për paketën ${plan}. `
        : `I am interested in the ${plan} package. `;
      msg.value = pre;
    }
  }

  const DRAFT_MSG = {
    restored: { en:'Draft restored.', sq:'Drafti u rikthye.' },
  };

  function loadDraft(){
    try{
      const raw = localStorage.getItem(DRAFT_KEY);
      if(!raw) return;
      const d = JSON.parse(raw);
      const hadContent = !!(d.name || d.email || d.message);
      if(d.name) form.name.value = d.name;
      if(d.email) form.email.value = d.email;
      if(d.message) form.message.value = d.message;
      if(d.package && pkgSelect) pkgSelect.value = d.package;
      if(hadContent && document.documentElement.getAttribute('data-display') === 'mobile'){
        status.textContent = DRAFT_MSG.restored[lang()];
        status.className = 'form-status';
      }
    }catch(e){}
  }

  function saveDraft(){
    try{
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        name: form.name.value,
        email: form.email.value,
        message: form.message.value,
        package: pkgSelect ? pkgSelect.value : '',
      }));
    }catch(e){}
  }

  function clearDraft(){
    try{ localStorage.removeItem(DRAFT_KEY); }catch(e){}
  }

  form.addEventListener('input', saveDraft);
  if(pkgSelect) pkgSelect.addEventListener('change', saveDraft);

  document.querySelectorAll('.plan-cta, .cta-row .primary[data-plan]').forEach(link=>{
    link.addEventListener('click', ()=>{
      const plan = link.getAttribute('data-plan');
      if(plan) applyPlan(plan);
    });
  });

  try{
    const fromSession = sessionStorage.getItem('ij-plan');
    if(fromSession) applyPlan(fromSession);
  }catch(e){}

  loadDraft();

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    clearFieldErrors();
    status.textContent = '';

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
      package: pkgSelect ? pkgSelect.value : '',
    };

    if(data.package){
      data.message = `[Package: ${data.package}]\n\n` + data.message;
    }

    const bad = validate(data);
    if(bad.length){
      bad.forEach(showFieldError);
      return;
    }

    submit.disabled = true;
    say('sending');
    try{
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, message: data.message }),
      });
      const body = await res.json().catch(() => ({}));
      if(res.ok && body.ok){
        say('ok', 'ok');
        form.reset();
        clearDraft();
        if(pkgSelect) pkgSelect.selectedIndex = 0;
      }else if(res.status === 400 && Array.isArray(body.fields)){
        body.fields.forEach(showFieldError);
      }else{
        say('fail', 'err');
      }
    }catch(err){
      say('fail', 'err');
    }finally{
      submit.disabled = false;
    }
  });

  window.contactFormRefresh = ()=>{
    clearFieldErrors();
  };
})();
