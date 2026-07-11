(function assistantWidget(){
  'use strict';

  // Bilingual UI strings. The assistant's replies themselves are language-detected
  // server-side; these are only the widget's own chrome.
  const T = {
    title:      { en:'Website assistant',            sq:'Asistenti i faqes' },
    subtitle:   { en:'Ask about your website',       sq:'Pyet për faqen tënde' },
    open:       { en:'Chat with us',                 sq:'Bisedo me ne' },
    close:      { en:'Close chat',                    sq:'Mbyll bisedën' },
    placeholder:{ en:'Type your question…',           sq:'Shkruaj pyetjen tënde…' },
    send:       { en:'Send',                          sq:'Dërgo' },
    greeting:   {
      en:"Hi! I can answer questions about the websites we build and how working together works. How can I help?",
      sq:"Përshëndetje! Mund t'i përgjigjem pyetjeve për faqet që ndërtojmë dhe si funksionon puna me ne. Si mund të ndihmoj?",
    },
    error:      {
      en:'Something went wrong. Please try again.',
      sq:'Diçka shkoi keq. Provoni sërish.',
    },
  };

  const lang = () => (document.documentElement.lang === 'sq' ? 'sq' : 'en');
  const t = (k) => T[k][lang()];

  // Conversation history sent to the API: {role, content}.
  const history = [];
  let open = false;
  let busy = false;

  /* ---- build DOM ---- */
  const root = document.createElement('div');
  root.className = 'ij-assist';
  root.innerHTML = `
    <button type="button" class="ij-assist-fab" aria-haspopup="dialog" aria-expanded="false" aria-label="${t('open')}">
      <span class="ij-assist-fab-icon" aria-hidden="true">💬</span>
    </button>
    <div class="ij-assist-panel" role="dialog" aria-modal="false" aria-label="${t('title')}" hidden>
      <div class="ij-assist-head">
        <div class="ij-assist-head-txt">
          <strong class="ij-assist-title">${t('title')}</strong>
          <span class="ij-assist-sub">${t('subtitle')}</span>
        </div>
        <button type="button" class="ij-assist-x" aria-label="${t('close')}">✕</button>
      </div>
      <div class="ij-assist-log" role="log" aria-live="polite"></div>
      <form class="ij-assist-form">
        <textarea class="ij-assist-input" rows="1" placeholder="${t('placeholder')}" maxlength="1000" aria-label="${t('placeholder')}"></textarea>
        <button type="submit" class="ij-assist-send" aria-label="${t('send')}">➤</button>
      </form>
    </div>`;
  document.body.appendChild(root);

  const fab    = root.querySelector('.ij-assist-fab');
  const panel  = root.querySelector('.ij-assist-panel');
  const closeX = root.querySelector('.ij-assist-x');
  const log    = root.querySelector('.ij-assist-log');
  const form   = root.querySelector('.ij-assist-form');
  const input  = root.querySelector('.ij-assist-input');

  /* ---- helpers ---- */
  function scrollDown(){ log.scrollTop = log.scrollHeight; }

  function addMsg(role, text){
    const el = document.createElement('div');
    el.className = 'ij-msg ij-msg-' + (role === 'user' ? 'user' : 'bot');
    // Plain text only — never inject HTML from the model.
    text.split('\n').forEach((line, i) => {
      if(i) el.appendChild(document.createElement('br'));
      el.appendChild(document.createTextNode(line));
    });
    log.appendChild(el);
    scrollDown();
    return el;
  }

  function addTyping(){
    const el = document.createElement('div');
    el.className = 'ij-msg ij-msg-bot ij-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(el);
    scrollDown();
    return el;
  }

  let greeted = false;
  function greet(){
    if(greeted) return;
    greeted = true;
    addMsg('bot', t('greeting'));
  }

  function setOpen(next){
    open = next;
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    root.classList.toggle('is-open', open);
    if(open){
      greet();
      setTimeout(() => input.focus(), 60);
    }
  }

  /* ---- events ---- */
  fab.addEventListener('click', () => setOpen(!open));
  closeX.addEventListener('click', () => { setOpen(false); fab.focus(); });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && open){ setOpen(false); fab.focus(); }
  });

  // Auto-grow textarea; Enter sends, Shift+Enter = newline.
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });
  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      form.requestSubmit();
    }
  });

  async function send(text){
    busy = true;
    input.value = '';
    input.style.height = 'auto';
    addMsg('user', text);
    history.push({ role:'user', content:text });

    const typing = addTyping();
    try{
      const res = await fetch('/api/assistant', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const body = await res.json().catch(() => ({}));
      typing.remove();
      const reply = (body && typeof body.reply === 'string' && body.reply.trim())
        ? body.reply.trim()
        : t('error');
      addMsg('bot', reply);
      history.push({ role:'assistant', content:reply });
    }catch(err){
      typing.remove();
      addMsg('bot', t('error'));
    }finally{
      busy = false;
      input.focus();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if(!text || busy) return;
    send(text);
  });

  // Keep the widget chrome in sync if the visitor flips the site language.
  function refreshLang(){
    fab.setAttribute('aria-label', t('open'));
    panel.setAttribute('aria-label', t('title'));
    closeX.setAttribute('aria-label', t('close'));
    root.querySelector('.ij-assist-title').textContent = t('title');
    root.querySelector('.ij-assist-sub').textContent = t('subtitle');
    input.setAttribute('placeholder', t('placeholder'));
    input.setAttribute('aria-label', t('placeholder'));
  }
  new MutationObserver(refreshLang).observe(document.documentElement, {
    attributes: true, attributeFilter: ['lang'],
  });
})();
