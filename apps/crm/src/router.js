import { renderDashboard } from './pages/dashboard.js';
import { renderClients } from './pages/clients.js';
import { renderClientDetail } from './pages/client-detail.js';
import { renderProjects } from './pages/projects.js';
import { renderProjectDetail } from './pages/project-detail.js';
import { renderInbox } from './pages/inbox.js';
import { renderReviews } from './pages/reviews.js';
import { renderFinance } from './pages/finance.js';
import { renderWebsiteSettings } from './pages/website/settings.js';
import { renderWebsiteHero } from './pages/website/hero.js';
import { renderWebsiteShowcase } from './pages/website/showcase.js';
import { renderWebsitePricing } from './pages/website/pricing.js';
import { renderWebsiteSections } from './pages/website/sections.js';
import { getSession, isAdminVerified, el, setSession, setAdminVerified } from './state.js';
import { isAuthReady, reverifyAdminAccess } from './auth.js';
import { forceAuthExit, isAuthSelfTestEnabled } from './sessionGuard.js';
import { renderShell } from './components/shell.js';

const routes = [
  { pattern: /^\/dashboard\/visibilityTest$/, render: renderVisibilitySelfTest },
  { pattern: /^\/dashboard$/, render: renderDashboard },
  { pattern: /^\/clients$/, render: renderClients },
  { pattern: /^\/clients\/([^/]+)$/, render: renderClientDetail },
  { pattern: /^\/projects$/, render: renderProjects },
  { pattern: /^\/projects\/([^/]+)$/, render: renderProjectDetail },
  { pattern: /^\/inbox$/, render: renderInbox },
  { pattern: /^\/reviews$/, render: renderReviews },
  { pattern: /^\/finance$/, render: renderFinance },
  { pattern: /^\/website\/settings$/, render: renderWebsiteSettings },
  { pattern: /^\/website\/hero$/, render: renderWebsiteHero },
  { pattern: /^\/website\/showcase$/, render: renderWebsiteShowcase },
  { pattern: /^\/website\/pricing$/, render: renderWebsitePricing },
  { pattern: /^\/website\/sections$/, render: renderWebsiteSections },
];

let currentPath = '/dashboard';
const listeners = new Set();

export function getPath() {
  return currentPath;
}

export function navigate(path, replace) {
  const next = path.startsWith('/') ? path : '/' + path;
  if (replace) history.replaceState(null, '', '#/crm' === next ? '#/dashboard' : '#' + next);
  else history.pushState(null, '', '#' + next);
  currentPath = next;
  listeners.forEach((fn) => fn(next));
  render();
}

function parseHash() {
  const hash = location.hash.replace(/^#/, '') || '/dashboard';
  return hash.startsWith('/') ? hash : '/' + hash;
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    currentPath = parseHash();
    render();
  });
  currentPath = parseHash();
  if (!location.hash) navigate('/dashboard', true);
}

export function refresh() {
  return render();
}

let renderGen = 0;
let visibilityTestStarted = false;

function renderVisibilitySelfTest({ path }) {
  if (!visibilityTestStarted) {
    visibilityTestStarted = true;
    setSession({ access_token: 'visibility-self-test' });
    setAdminVerified(true);
    queueMicrotask(() => reverifyAdminAccess());
  }
  return renderShell({
    title: 'Visibility test',
    currentPath: path,
    content: el('div', { className: 'crm-loading', text: 'Visibility re-verify self-test…' }),
  });
}

export async function render() {
  const app = document.getElementById('app');
  if (!app) return;
  if (document.body.classList.contains('crm-modal-open')) return;

  const gen = ++renderGen;
  const session = getSession();
  const path = parseHash();
  currentPath = path;

  if (!isAuthReady()) {
    if (!app.querySelector('.crm-app')) {
      app.innerHTML = '';
      app.appendChild(renderShell({
        title: 'Loading',
        currentPath: path,
        content: el('div', { className: 'crm-loading', text: 'Loading…' }),
      }));
    }
    return;
  }

  if (!session || !isAdminVerified()) {
    const visibilitySelfTest = path === '/dashboard/visibilityTest' && isAuthSelfTestEnabled();
    if (!visibilitySelfTest) {
      forceAuthExit();
      return;
    }
  }

  let matched = null;
  let params = [];

  for (const route of routes) {
    const m = path.match(route.pattern);
    if (m) {
      matched = route;
      params = m.slice(1);
      break;
    }
  }

  if (!matched) {
    navigate('/dashboard', true);
    return;
  }

  const result = await matched.render({ params, path });
  if (gen !== renderGen) return;
  if (result && !result.isConnected) app.appendChild(result);
}
