import { setAdminVerified, setSession } from './state.js';

let authExitInProgress = false;

const DEFAULT_IDLE_MS = 30 * 60 * 1000;
const IDLE_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
let idleTimer = null;
let idleWatchActive = false;

function getIdleMs() {
  const raw = import.meta.env.VITE_CRM_IDLE_TIMEOUT_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_IDLE_MS;
}

export function isAuthSelfTestEnabled() {
  return import.meta.env.VITE_CRM_AUTH_SELF_TEST === '1';
}

function resetIdleTimer() {
  if (!idleWatchActive) return;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    forceAuthExit();
  }, getIdleMs());
}

export function startIdleWatch() {
  if (idleWatchActive) return;
  idleWatchActive = true;
  IDLE_EVENTS.forEach((ev) => document.addEventListener(ev, resetIdleTimer, { passive: true }));
  document.addEventListener('visibilitychange', onIdleVisibility);
  resetIdleTimer();
}

export function stopIdleWatch() {
  if (!idleWatchActive) return;
  idleWatchActive = false;
  clearTimeout(idleTimer);
  idleTimer = null;
  IDLE_EVENTS.forEach((ev) => document.removeEventListener(ev, resetIdleTimer));
  document.removeEventListener('visibilitychange', onIdleVisibility);
}

function onIdleVisibility() {
  if (document.visibilityState === 'visible') resetIdleTimer();
}

export function isAuthFailureStatus(status) {
  return status === 401 || status === 403;
}

export async function forceAuthExit() {
  if (authExitInProgress) return;
  authExitInProgress = true;
  stopIdleWatch();
  setAdminVerified(false);
  setSession(null);
  window.location.replace('/login.html');
  try {
    const { getSupabase } = await import('./auth.js');
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
  } catch (_) {}
}
