import './styles/crm.css';
import { initAuth } from './auth.js';
import { initRouter, render } from './router.js';
import { initToast } from './components/Toast.js';
import { subscribe } from './state.js';
import { startIdleWatch, stopIdleWatch } from './sessionGuard.js';

async function boot() {
  initToast();
  await initAuth();
  initRouter();
  subscribe(({ session, adminVerified }) => {
    if (session && adminVerified) startIdleWatch();
    else stopIdleWatch();
    render();
  });
  await render();
}

boot();
