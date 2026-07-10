import { createClient } from '@supabase/supabase-js';
import { setSession, setAdminVerified, getSession, isAdminVerified } from './state.js';
import { crmApi } from './api.js';
import { forceAuthExit } from './sessionGuard.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

export function getSupabase() {
  if (!url || !key) return null;
  if (!supabase) supabase = createClient(url, key);
  return supabase;
}

export function isAuthConfigured() {
  return Boolean(url && key);
}

let authReady = false;
let reverifyPending = false;

export function isAuthReady() {
  return authReady;
}

export async function initAuth() {
  const sb = getSupabase();
  if (!sb) {
    authReady = true;
    return null;
  }
  const { data } = await sb.auth.getSession();
  if (data.session) {
    setSession(data.session);
    await verifyAdmin();
  }
  sb.auth.onAuthStateChange(async (_event, s) => {
    setSession(s);
    if (s) await verifyAdmin();
    else setAdminVerified(false);
  });
  document.addEventListener('visibilitychange', onVisibilityReverify);
  window.addEventListener('focus', onWindowFocusReverify);
  authReady = true;
  return data.session;
}

async function reverifyAdminAccess() {
  if (reverifyPending || !getSession() || !isAdminVerified()) return;
  reverifyPending = true;
  try {
    const ok = await verifyAdmin();
    if (!ok) await forceAuthExit();
  } finally {
    reverifyPending = false;
  }
}

export { reverifyAdminAccess };

async function onVisibilityReverify() {
  if (document.visibilityState !== 'visible') return;
  await reverifyAdminAccess();
}

function onWindowFocusReverify() {
  if (document.visibilityState !== 'visible') return;
  reverifyAdminAccess();
}

export async function signIn(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  setSession(data.session);
  const ok = await verifyAdmin();
  if (!ok) {
    await signOut();
    throw new Error('Your account is not authorized for CRM access. Contact an administrator.');
  }
  return data.session;
}

export async function signOut() {
  await forceAuthExit();
}

export async function verifyAdmin() {
  try {
    await crmApi.get('/dashboard', { skipAuthExit: true });
    setAdminVerified(true);
    return true;
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      setAdminVerified(false);
      return false;
    }
    setAdminVerified(false);
    return false;
  }
}

export function getAccessToken() {
  const s = getSession();
  if (s?.access_token) return Promise.resolve(s.access_token);
  const sb = getSupabase();
  if (!sb) return null;
  return sb.auth.getSession().then(({ data }) => data.session?.access_token || null);
}
