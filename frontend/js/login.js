import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function setStatus(msg, isError) {
  const el = document.getElementById('loginStatus');
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('error', Boolean(isError));
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

function redirectForRole(role) {
  if (role === 'admin') {
    window.location.href = '/crm/#/dashboard';
    return;
  }
  if (role === 'client') {
    window.location.href = '/portal.html';
  }
}

async function tryExistingSession(sb) {
  const { data } = await sb.auth.getSession();
  if (!data.session?.access_token) return;
  try {
    const me = await fetchMe(data.session.access_token);
    redirectForRole(me.role);
  } catch {
    await sb.auth.signOut();
  }
}

async function boot() {
  initChrome();

  let config;
  try {
    config = await loadConfig();
  } catch (err) {
    setStatus(err.message, true);
    return;
  }

  const sb = createClient(config.supabaseUrl, config.supabaseAnonKey);
  await tryExistingSession(sb);

  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = form?.querySelector('button[type="submit"]');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!EMAIL_RE.test(email)) {
      setStatus(document.documentElement.lang === 'sq'
        ? 'Ju lutemi shkruani një email të vlefshëm.'
        : 'Please enter a valid email address.', true);
      return;
    }
    if (!password) {
      setStatus(document.documentElement.lang === 'sq'
        ? 'Ju lutemi shkruani fjalëkalimin.'
        : 'Please enter your password.', true);
      return;
    }

    const prevLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = document.documentElement.lang === 'sq' ? 'Duke hyrë…' : 'Signing in…';

    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const me = await fetchMe(data.session.access_token);
      redirectForRole(me.role);
    } catch (err) {
      if (err.status === 403) {
        await sb.auth.signOut();
        setStatus(document.documentElement.lang === 'sq'
          ? 'Llogaria juaj nuk ka akses. Kontaktoni IJ Technologys.'
          : 'Your account is not authorized. Contact IJ Technologys.', true);
      } else {
        setStatus(err.message || (document.documentElement.lang === 'sq' ? 'Hyrja dështoi.' : 'Sign in failed.'), true);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = prevLabel;
    }
  });
}

boot();
