function createSupabaseClient(url, key) {
  if (!window.supabase?.createClient) throw new Error('Auth client failed to load.');
  return window.supabase.createClient(url, key);
}
function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('ij-theme', theme); } catch (e) {}
}

function setLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-en]').forEach((el) => {
    const t = el.getAttribute('data-' + lang);
    if (!t) return;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (el.hasAttribute('placeholder')) el.placeholder = t;
    } else if (tag === 'OPTION') {
      el.textContent = t;
    } else {
      el.innerHTML = t;
    }
  });
  ['btn-en', 'btn-sq'].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('active', id === 'btn-en' ? lang === 'en' : lang === 'sq');
  });
  try { localStorage.setItem('ij-lang', lang); } catch (e) {}
}

function initChrome() {
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    setTheme(getTheme() === 'light' ? 'dark' : 'light');
  });
  document.getElementById('btn-en')?.addEventListener('click', () => setLang('en'));
  document.getElementById('btn-sq')?.addEventListener('click', () => setLang('sq'));
  try {
    setLang(localStorage.getItem('ij-lang') || 'en');
  } catch (e) {
    setLang('en');
  }
  window.addEventListener('scroll', () => {
    document.getElementById('header')?.classList.toggle('scrolled', window.scrollY > 24);
  }, { passive: true });
}

async function loadConfig() {
  const res = await fetch('/api/auth/config');
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) throw new Error(body.error || 'Auth is not configured.');
  return body;
}

async function fetchMe(token) {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: 'Bearer ' + token },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    const err = new Error(body.error || 'Could not verify account.');
    err.status = res.status;
    throw err;
  }
  return body;
}

async function boot() {
  initChrome();

  let config;
  try {
    config = await loadConfig();
  } catch {
    window.location.href = '/login';
    return;
  }

  const sb = createSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);
  const { data } = await sb.auth.getSession();
  if (!data.session?.access_token) {
    window.location.href = '/login';
    return;
  }

  let me;
  try {
    me = await fetchMe(data.session.access_token);
  } catch {
    await sb.auth.signOut();
    window.location.href = '/login';
    return;
  }

  if (me.role === 'admin') {
    window.location.href = '/crm/#/dashboard';
    return;
  }

  if (me.role !== 'client') {
    await sb.auth.signOut();
    window.location.href = '/login';
    return;
  }

  const greeting = document.getElementById('portalGreeting');
  if (greeting && me.displayName) {
    const lang = document.documentElement.lang || 'en';
    greeting.textContent = lang === 'sq'
      ? 'Mirë se vini, ' + me.displayName
      : 'Welcome, ' + me.displayName;
  }

  document.getElementById('portalLogout')?.addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.href = '/';
  });
}

boot();
