const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DISPLAY_MQ = matchMedia('(max-width: 1020px)');

function isMobileDisplay(){
  return document.documentElement.getAttribute('data-display') === 'mobile';
}

function isDesktopDisplay(){
  return document.documentElement.getAttribute('data-display') === 'desktop';
}

DISPLAY_MQ.addEventListener('change', ()=>{
  const next = DISPLAY_MQ.matches ? 'mobile' : 'desktop';
  if(document.documentElement.getAttribute('data-display') !== next) location.reload();
});

const DPR = Math.min(window.devicePixelRatio || 1, isDesktopDisplay() ? 1.75 : 1.5);
const BUDGET = {
  bgParticles : 900,
  globePoints : 1300,
  corePoints  : 160,
};
const visible = { bg:true, card:false, globe:false };
document.addEventListener('visibilitychange',()=>{ visible.bg = !document.hidden; });

function getTheme(){
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function setTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  try{ localStorage.setItem('ij-theme', theme); }catch(e){}
}

function initTheme(){
  function toggle(){
    setTheme(getTheme() === 'light' ? 'dark' : 'light');
  }
  document.getElementById('themeToggle')?.addEventListener('click', toggle);
  document.getElementById('themeToggleMenu')?.addEventListener('click', toggle);
}

function setLang(lang){
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-en]').forEach(el=>{
    const t = el.getAttribute('data-'+lang);
    if(!t) return;
    const tag = el.tagName;
    if(tag === 'INPUT' || tag === 'TEXTAREA'){
      if(el.hasAttribute('placeholder')) el.placeholder = t;
    }else if(tag === 'IMG'){
      el.alt = t;
    }else if(tag === 'OPTION'){
      el.textContent = t;
    }else{
      el.textContent = t;
    }
  });
  ['btn-en','btn-sq','btn-en-menu','btn-sq-menu'].forEach(id=>{
    const btn = document.getElementById(id);
    if(!btn) return;
    btn.classList.toggle('active', id.includes('en') ? lang === 'en' : lang === 'sq');
  });
  try{ localStorage.setItem('ij-lang', lang); }catch(e){}
  buildMarquees();
  if(typeof window.contactFormRefresh === 'function') window.contactFormRefresh();
  if(typeof window.reviewsRefreshLang === 'function') window.reviewsRefreshLang();
}
document.getElementById('btn-en').addEventListener('click', ()=> setLang('en'));
document.getElementById('btn-sq').addEventListener('click', ()=> setLang('sq'));

const headerEl = document.getElementById('header');
window.addEventListener('scroll',()=> headerEl.classList.toggle('scrolled', window.scrollY > 24), {passive:true});

const burger = document.getElementById('burger');
const mmenu = document.getElementById('mobileMenu');
burger.addEventListener('click', ()=>{
  const open = mmenu.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
  mmenu.setAttribute('aria-hidden', !open);
});
mmenu.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=>{
  mmenu.classList.remove('open');
  burger.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  mmenu.setAttribute('aria-hidden', 'true');
}));
function closeMobileMenu(){
  mmenu.classList.remove('open');
  burger.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  mmenu.setAttribute('aria-hidden', 'true');
}
document.getElementById('btn-en-menu')?.addEventListener('click', ()=>{ setLang('en'); closeMobileMenu(); });
document.getElementById('btn-sq-menu')?.addEventListener('click', ()=>{ setLang('sq'); closeMobileMenu(); });

const counterIO = new IntersectionObserver(es=>{
  es.forEach(en=>{
    if(!en.isIntersecting) return;
    const el = en.target;
    const target = +el.dataset.count;
    if(REDUCED){
      el.textContent = target + '+';
      counterIO.unobserve(el);
      return;
    }
    const t0 = performance.now();
    const dur = 1400;
    (function tick(t){
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * e) + (p === 1 ? '+' : '');
      if(p < 1) requestAnimationFrame(tick);
    })(t0);
    counterIO.unobserve(el);
  });
},{ threshold:.5 });
document.querySelectorAll('[data-count]').forEach(el=> counterIO.observe(el));

function buildMarquees(){
  const lang = document.documentElement.lang === 'sq' ? 'sq' : 'en';
  // Only the logo strip loops; client reviews are rendered once (no repeat) by reviews.js.
  [['strip',36]].forEach(([id,base])=>{
    const el = document.getElementById(id);
    if(!el) return;
    // remember the original single sequence once
    if(!el.dataset.orig) el.dataset.orig = el.innerHTML;
    const unit = el.dataset.orig;
    // repeat the sequence until one "half" comfortably exceeds the viewport,
    // so translateX(-50%) always loops with no empty gap
    const cw = el.parentElement ? el.parentElement.offsetWidth : window.innerWidth;
    let half = unit, copies = 1;
    el.innerHTML = half;
    while(el.scrollWidth < cw + 120 && copies < 40){
      half += unit; copies++;
      el.innerHTML = half;
    }
    // two identical halves = seamless loop; keep px/sec constant across screens
    el.innerHTML = half + half;
    el.style.animationDuration = (base * copies) + 's';
    // re-apply the active language to the freshly-built nodes
    el.querySelectorAll('[data-en]').forEach(n=>{
      const t = n.getAttribute('data-'+lang);
      if(t) n.innerHTML = t;
    });
  });
}
buildMarquees();
let marqueeResizeT;
window.addEventListener('resize', ()=>{
  clearTimeout(marqueeResizeT);
  marqueeResizeT = setTimeout(buildMarquees, 200);
}, {passive:true});

const io = new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
},{ threshold:.12, rootMargin:'0px 0px -40px 0px' });
function observeRevealElements(root){
  const scope = root || document;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  scope.querySelectorAll('.reveal:not(.in)').forEach(el=>{
    if(el.dataset.revealObserved) return;
    el.dataset.revealObserved = '1';
    io.observe(el);
    const rect = el.getBoundingClientRect();
    if(rect.top < vh * 0.88 && rect.bottom > 0){
      el.classList.add('in');
      io.unobserve(el);
    }
  });
}
document.querySelectorAll('.reveal').forEach(el=>{
  el.dataset.revealObserved = '1';
  io.observe(el);
});
document.addEventListener('ij-cms-ready', ()=> observeRevealElements());

const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
const sections = ['about','projects','work','clients','offers','contact'].map(id=> document.getElementById(id)).filter(Boolean);
function updateNavActive(){
  const y = window.scrollY + headerEl.offsetHeight + 80;
  let current = sections[0]?.id;
  sections.forEach(sec=>{
    if(sec.offsetTop <= y) current = sec.id;
  });
  navLinks.forEach(a=>{
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === '#'+current);
  });
}
window.addEventListener('scroll', updateNavActive, {passive:true});
updateNavActive();

/* Scroll-driven laptop: the lid opens (rotateX -90deg -> 0) as the work
   section rises into view. Desktop only; stays open for reduced motion. */
(function laptopOpen(){
  const laptop = document.querySelector('.laptop');
  if(!laptop) return;
  if(REDUCED){ laptop.style.setProperty('--lid','0deg'); return; }
  const CLOSED = -84;
  let ticking = false;
  function update(){
    ticking = false;
    if(isMobileDisplay()){ laptop.style.setProperty('--lid','0deg'); return; }
    const r = laptop.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // Anchor on the bottom edge (where the closed laptop sits): fully closed the
    // moment it enters at the viewport bottom, opening as it scrolls up over the
    // next ~40% of the viewport.
    const span = vh * 0.2;
    let p = (vh - r.bottom) / span;
    p = Math.max(0, Math.min(1, p));
    laptop.style.setProperty('--lid', (CLOSED * (1 - p)).toFixed(2) + 'deg');
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll, {passive:true});
  update();
})();

const wrap = document.getElementById('projects');
const ring = document.getElementById('ring');
const hint = document.getElementById('scrollHint');
let cardSlots = 0;
let cardStep = 360;
let ringTravel = 0;
let targetRot = 0, currentRot = 0, ticking = false;
let ringGlobeSync = 0;
let overhangRaf = 0;

function updateProjectsOverhang() {
  if (!isDesktopDisplay()) {
    document.documentElement.style.setProperty('--projects-overhang', '0px');
    return;
  }
  const stage = document.querySelector('.projects-stage');
  const scene = document.querySelector('.orbit-scene');
  const cards = document.querySelectorAll('.pcard');
  if (!stage || !scene || !cards.length) {
    document.documentElement.style.setProperty('--projects-overhang', '0px');
    return;
  }
  let maxCardHeight = 0;
  cards.forEach(card => {
    maxCardHeight = Math.max(maxCardHeight, card.offsetHeight);
  });
  const stageRect = stage.getBoundingClientRect();
  const sceneRect = scene.getBoundingClientRect();
  const ringCenterY = sceneRect.top + sceneRect.height / 2;
  const topOffset = Math.abs(parseFloat(getComputedStyle(cards[0]).top) || 110);
  const cardBottom = ringCenterY - topOffset + maxCardHeight;
  const overhang = Math.max(0, Math.ceil(cardBottom - stageRect.bottom + 16));
  document.documentElement.style.setProperty('--projects-overhang', overhang + 'px');
}

function scheduleProjectsOverhang() {
  if (overhangRaf) cancelAnimationFrame(overhangRaf);
  overhangRaf = requestAnimationFrame(() => {
    overhangRaf = requestAnimationFrame(updateProjectsOverhang);
  });
}

function bindCardOverhangWatchers() {
  document.querySelectorAll('.pcard img').forEach(el => {
    if (el.dataset.overhangBound) return;
    el.dataset.overhangBound = '1';
    el.addEventListener('load', scheduleProjectsOverhang);
  });
}

function syncRingLayout() {
  const cards = document.querySelectorAll('.pcard');
  cardSlots = cards.length;
  if (!cardSlots) {
    document.documentElement.style.setProperty('--projects-overhang', '0px');
    return;
  }
  cardStep = 360 / cardSlots;
  ringTravel = (cardSlots - 1) * cardStep;
  cards.forEach((card, i) => card.style.setProperty('--i', String(i)));
  updateRing();
  updateCardTransforms(currentRot);
  if (typeof setRadius === 'function') setRadius();
  bindCardOverhangWatchers();
  scheduleProjectsOverhang();
}
window.ijSyncRing = syncRingLayout;

function easeInOutCubic(t){
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateRing(){
  const rect = wrap.getBoundingClientRect();
  const total = Math.max(1, wrap.offsetHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, -rect.top / total));
  const eased = easeInOutCubic(progress);
  targetRot = -eased * ringTravel;
  hint.style.opacity = (progress > 0.03 && progress < 0.97) ? '0' : '1';
  ticking = false;
}

function updateCardTransforms(rot){
  document.querySelectorAll('.pcard').forEach(card=>{
    const i = parseInt(getComputedStyle(card).getPropertyValue('--i'), 10) || 0;
    const radiusPx = parseFloat(getComputedStyle(card).getPropertyValue('--radius')) || 420;
    const angle = i * cardStep + rot;
    const rad = angle * Math.PI / 180;
    const x = radiusPx * Math.sin(rad);
    const z = radiusPx * Math.cos(rad);

    card.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${-angle}deg)`;

    const behind = z < 40;
    card.classList.toggle('is-behind', behind);
  });
}

function animateRing(){
  currentRot += (targetRot - currentRot) * 0.065;
  updateCardTransforms(currentRot);
  ringGlobeSync = currentRot;
  requestAnimationFrame(animateRing);
}

if(isDesktopDisplay()){
  window.addEventListener('scroll', ()=>{
    if(!ticking){ requestAnimationFrame(updateRing); ticking = true; }
  },{ passive:true });
  syncRingLayout();
  updateRing();
  animateRing();

  function setRadius(){
    const w = window.innerWidth;
    const r = w <= 560 ? 240 : w <= 1020 ? 320 : 420;
    document.querySelectorAll('.pcard').forEach(c=> c.style.setProperty('--radius', r + 'px'));
    updateCardTransforms(currentRot);
    scheduleProjectsOverhang();
  }
  setRadius();
  updateCardTransforms(0);
  window.addEventListener('resize', setRadius);
  document.addEventListener('ij-cms-ready', syncRingLayout);
}

document.querySelector('.foot-call-mobile')?.addEventListener('click', ()=>{
  const msg = document.getElementById('cf-message');
  if(msg && !msg.value.trim()){
    msg.value = document.documentElement.lang === 'sq'
      ? 'Do të doja një telefonatë për të diskutuar projektin.'
      : 'I would like a call to discuss my project.';
  }
});

document.querySelectorAll('[data-plan]').forEach(link=>{
  link.addEventListener('click', ()=>{
    const plan = link.getAttribute('data-plan') || '';
    try{ sessionStorage.setItem('ij-plan', plan); }catch(e){}
  });
});

(function heroCardTilt(){
  if(REDUCED || isMobileDisplay()) return;
  const holder = document.getElementById('hero3d');
  if(!holder) return;
  const spring = {rx:0, ry:0, vx:0, vy:0, tx:0, ty:0, s:1, vs:0, ts:1};
  let hovering = false;
  holder.addEventListener('pointerenter', ()=>{ hovering = true; });
  holder.addEventListener('pointermove', e=>{
    const r = holder.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) - 0.5;
    const py = ((e.clientY - r.top) / r.height) - 0.5;
    spring.ty = px * 0.76;
    spring.tx = -py * 0.52;
    spring.ts = 1.03;
  });
  holder.addEventListener('pointerleave', ()=>{
    hovering = false;
    spring.tx = spring.ty = 0;
    spring.ts = 1;
  });
  const K = 0.07, D = 0.88;
  function frame(){
    requestAnimationFrame(frame);
    if(document.hidden && !hovering) return;
    spring.vx += (spring.tx - spring.rx) * K; spring.vx *= D; spring.rx += spring.vx;
    spring.vy += (spring.ty - spring.ry) * K; spring.vy *= D; spring.ry += spring.vy;
    spring.vs += (spring.ts - spring.s) * K; spring.vs *= D; spring.s += spring.vs;
    holder.style.transform =
      `perspective(900px) rotateX(${spring.rx}rad) rotateY(${spring.ry}rad) scale(${spring.s})`;
  }
  frame();
})();

function makeDotTexture(color){
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32,32,0,32,32,32);
  grd.addColorStop(0, color); grd.addColorStop(.35, color + 'AA'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
}

const CODE_WORDS=['const','let','=>','function(','return','if(','for(','await','async','fetch(','.then(','import','export','</div>','<nav>','useState(','.map(','&&','||','npm run build','git push','class=','display:flex','{ }','01101','render()','props.','.css','.tsx','SELECT *','while(','try{','catch(e)','new Promise','addEventListener','translate3d','requestAnimationFrame'];
function makeCodeTexture(w,h,fontSize,dense, cols, dimColor){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0,0,w,h);
  g.font = `600 ${fontSize}px "JetBrains Mono",monospace`;
  const lineH = fontSize * 1.7;
  const palette = cols || ['#00e8ff','#00ced1','#5eead4','#99f6ff','#c47a20'];
  const dim = dimColor || 'rgba(80,120,140,.35)';
  for(let y = lineH; y < h; y += lineH){
    let x = 8 + Math.random() * 30;
    while(x < w - 40){
      const word = CODE_WORDS[(Math.random()*CODE_WORDS.length)|0];
      const bright = Math.random() < (dense ? .3 : .18);
      g.fillStyle = bright ? palette[(Math.random()*palette.length)|0] : dim;
      g.fillText(word, x, y);
      x += g.measureText(word).width + fontSize * (1 + Math.random() * 1.6);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function loadThreeJs(done){
  if(REDUCED || isMobileDisplay()) return done();
  if(typeof THREE !== 'undefined') return done();
  var existing = document.getElementById('three-js');
  if(existing){
    if(typeof THREE !== 'undefined') return done();
    existing.addEventListener('load', done, {once:true});
    existing.addEventListener('error', done, {once:true});
    return;
  }
  var s = document.createElement('script');
  s.id = 'three-js';
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s.onload = done;
  s.onerror = done;
  document.head.appendChild(s);
}

function initThreeScenes(){
(function bgField(){
  if(REDUCED || isMobileDisplay() || typeof THREE === 'undefined') return;
  const canvas = document.getElementById('bgCanvas');
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:false, powerPreference:'low-power'});
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, 1, 1, 120);
  cam.position.z = 40;
  function size(){ renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth/innerHeight; cam.updateProjectionMatrix(); }
  size(); addEventListener('resize', size);

  const N = BUDGET.bgParticles;
  const pos = new Float32Array(N * 3);
  for(let i = 0; i < N; i++){
    pos[i*3]   = (Math.random() - .5) * 110;
    pos[i*3+1] = (Math.random() - .5) * 70;
    pos[i*3+2] = (Math.random() - .5) * 60;
  }
  const groups = [
    {color:'#00ced1', size: 1.7, count: .6},
    {color:'#00e8ff', size: 1.3, count: .4},
  ];
  const clouds = groups.map((gr, gi)=>{
    const start = gi === 0 ? 0 : Math.floor(N * groups[0].count);
    const end = gi === 0 ? Math.floor(N * groups[0].count) : N;
    const sub = new THREE.BufferGeometry();
    sub.setAttribute('position', new THREE.BufferAttribute(pos.slice(start*3, end*3), 3));
    const mat = new THREE.PointsMaterial({
      size: gr.size, map: makeDotTexture(gr.color), transparent: true, opacity: .65,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    const p = new THREE.Points(sub, mat); scene.add(p); return p;
  });

  let mx = 0, my = 0;
  addEventListener('pointermove', e=>{ mx = (e.clientX/innerWidth - .5); my = (e.clientY/innerHeight - .5); }, {passive:true});

  let t = 0;
  function frame(){
    requestAnimationFrame(frame);
    if(!visible.bg || document.hidden) return;
    t += 0.0012;
    clouds.forEach((c, i)=>{
      c.rotation.y = t * (i ? -.4 : .6);
      c.rotation.x = Math.sin(t * .7 + i) * 0.04;
    });
    cam.position.x += (mx * 3 - cam.position.x) * .025;
    cam.position.y += (-my * 2.5 - cam.position.y) * .025;
    cam.lookAt(0,0,0);
    renderer.render(scene, cam);
  }
  frame();
})();

(function codeGlobe(){
  if(isMobileDisplay() || typeof THREE === 'undefined') return;
  const stage = document.getElementById('orbitScene');
  const canvas = document.getElementById('globeCanvas');
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(45, 1, .1, 60);
  cam.position.z = 8.2;
  function size(){
    const r = stage.getBoundingClientRect();
    const s = Math.min(r.width, r.height) * 0.9;
    renderer.setSize(s, s, false);
    canvas.style.width = s + 'px'; canvas.style.height = s + 'px';
    cam.aspect = 1; cam.updateProjectionMatrix();
  }
  size(); addEventListener('resize', ()=>{ size(); setRadius(); });

  const R = 2.5;
  const globe = new THREE.Group();
  scene.add(globe);

  const GLOBE_PALETTES = {
    cyan: {
      shell: 0x0a1a2e, shellOpacity: 0.92,
      surfDot: '#00e8ff', wire: 0x00ced1, wireOpacity: 0.32,
      heart: '#00ced1', spark: '#00e8ff',
      codeCols: ['#00e8ff','#00ced1','#5eead4','#99f6ff','#c47a20'],
      codeDim: 'rgba(80,120,140,.35)',
    },
    white: {
      shell: 0xf2f5f9, shellOpacity: 0.95,
      surfDot: '#ffffff', wire: 0xffffff, wireOpacity: 0.4,
      heart: '#ffffff', spark: '#eef2f8',
      codeCols: ['#ffffff','#eef2f8','#dce4ee','#c8d4e4','#b0bcc8'],
      codeDim: 'rgba(150,165,185,.42)',
    },
  };

  const shellMat = new THREE.MeshBasicMaterial({
    color: GLOBE_PALETTES.cyan.shell,
    transparent: true,
    opacity: GLOBE_PALETTES.cyan.shellOpacity,
    depthWrite: true,
  });
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.94, 48, 32), shellMat));

  const N = BUDGET.globePoints;
  const sp = new Float32Array(N * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for(let i = 0; i < N; i++){
    const y = 1 - (i/(N-1)) * 2, rad = Math.sqrt(1 - y*y), th = golden * i;
    sp[i*3] = Math.cos(th)*rad*R; sp[i*3+1] = y*R; sp[i*3+2] = Math.sin(th)*rad*R;
  }
  const surfGeo = new THREE.BufferGeometry();
  surfGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const surfMat = new THREE.PointsMaterial({
    size: 1.85, map: makeDotTexture('#00e8ff'), transparent: true, opacity: .95,
    depthWrite: true, blending: THREE.NormalBlending, sizeAttenuation: false
  });
  globe.add(new THREE.Points(surfGeo, surfMat));

  const wireMat = new THREE.LineBasicMaterial({color: 0x00ced1, transparent: true, opacity: .32});
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.SphereGeometry(R * 0.995, 20, 14)),
    wireMat
  );
  globe.add(wire);

  let coreTex = makeCodeTexture(1024, 512, 22, true);
  coreTex.repeat.set(2, 1);
  const coreMat = new THREE.MeshBasicMaterial({map: coreTex, transparent: true, opacity: 1, depthWrite: true, blending: THREE.NormalBlending});
  const core = new THREE.Mesh(new THREE.SphereGeometry(R * 0.58, 40, 28), coreMat);
  globe.add(core);

  const heartMat = new THREE.SpriteMaterial({map: makeDotTexture('#00ced1'), transparent: true, blending: THREE.NormalBlending, depthWrite: true, opacity: .9});
  const heart = new THREE.Sprite(heartMat);
  heart.scale.setScalar(R * 1.7);
  globe.add(heart);

  const M = BUDGET.corePoints;
  const ip = new Float32Array(M * 3), iv = new Float32Array(M);
  for(let i = 0; i < M; i++){
    const r = R * (0.62 + Math.random() * 0.3), a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1);
    ip[i*3] = r*Math.sin(b)*Math.cos(a); ip[i*3+1] = r*Math.cos(b); ip[i*3+2] = r*Math.sin(b)*Math.sin(a);
    iv[i] = 0.15 + Math.random() * 0.5;
  }
  const inGeo = new THREE.BufferGeometry();
  inGeo.setAttribute('position', new THREE.BufferAttribute(ip, 3));
  const sparksMat = new THREE.PointsMaterial({
    size: 1.2, map: makeDotTexture('#00e8ff'), transparent: true, opacity: .82,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: false
  });
  globe.add(new THREE.Points(inGeo, sparksMat));

  let ringTexA = makeCodeTexture(2048, 96, 30, false);
  ringTexA.repeat.set(3, 1);
  let ringTexB = makeCodeTexture(2048, 72, 24, false);
  ringTexB.repeat.set(4, 1);
  function codeBand(radius, height, tex, tiltX, tiltZ){
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 72, 1, true),
      new THREE.MeshBasicMaterial({map: tex, transparent: true, opacity: .88, side: THREE.DoubleSide, blending: THREE.NormalBlending, depthWrite: true})
    );
    m.rotation.x = tiltX; m.rotation.z = tiltZ;
    return m;
  }
  const bandA = codeBand(R * 1.28, 0.34, ringTexA, 0.28, 0.10);
  const bandB = codeBand(R * 1.5, 0.24, ringTexB, -0.42, -0.16);
  scene.add(bandA, bandB);

  function applyGlobeTheme(){
    const p = getTheme() === 'dark' ? GLOBE_PALETTES.white : GLOBE_PALETTES.cyan;
    shellMat.color.setHex(p.shell);
    shellMat.opacity = p.shellOpacity;
    if(surfMat.map) surfMat.map.dispose();
    surfMat.map = makeDotTexture(p.surfDot);
    wireMat.color.setHex(p.wire);
    wireMat.opacity = p.wireOpacity;
    if(heartMat.map) heartMat.map.dispose();
    heartMat.map = makeDotTexture(p.heart);
    if(sparksMat.map) sparksMat.map.dispose();
    sparksMat.map = makeDotTexture(p.spark);
    coreTex.dispose();
    coreTex = makeCodeTexture(1024, 512, 22, true, p.codeCols, p.codeDim);
    coreTex.repeat.set(2, 1);
    coreMat.map = coreTex;
    ringTexA.dispose();
    ringTexB.dispose();
    ringTexA = makeCodeTexture(2048, 96, 30, false, p.codeCols, p.codeDim);
    ringTexA.repeat.set(3, 1);
    ringTexB = makeCodeTexture(2048, 72, 24, false, p.codeCols, p.codeDim);
    ringTexB.repeat.set(4, 1);
    bandA.material.map = ringTexA;
    bandB.material.map = ringTexB;
  }
  applyGlobeTheme();
  new MutationObserver(applyGlobeTheme).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});

  const activeIO = new IntersectionObserver(es=>{ es.forEach(e=> visible.globe = e.isIntersecting); }, {threshold:.02});
  activeIO.observe(stage);

  let t = 0, lastGlobeY = ringGlobeSync;
  function frame(){
    if(REDUCED){
      renderer.render(scene, cam);
      return;
    }
    requestAnimationFrame(frame);
    if(!visible.globe || document.hidden) return;
    t += 0.014;
    const ringDelta = ringGlobeSync - lastGlobeY;
    lastGlobeY = ringGlobeSync;
    const spin = 0.0012 + ringDelta * 0.00035;
    globe.rotation.y += spin;
    core.rotation.y -= spin * 1.6;
    coreTex.offset.y = (coreTex.offset.y + 0.0006) % 1;
    bandA.rotation.y += spin * 1.4;
    bandB.rotation.y -= spin * 1.1;
    ringTexA.offset.x = (ringTexA.offset.x + 0.0004) % 1;
    ringTexB.offset.x = (ringTexB.offset.x - 0.00035) % 1;
    heart.material.opacity = 0.72 + Math.sin(t * 1.2) * 0.18;
    const arr = inGeo.attributes.position.array;
    for(let i = 0; i < M; i++){
      arr[i*3+1] += iv[i] * 0.005;
      if(arr[i*3+1] > R * 0.92) arr[i*3+1] = -R * 0.92;
    }
    inGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, cam);
  }
  frame();
})();

}

loadThreeJs(initThreeScenes);

initTheme();
window.setLang = setLang;
window.ijRefreshCounters = function(){
  document.querySelectorAll('[data-count]').forEach(function(el){ counterIO.observe(el); });
};
try{
  if(localStorage.getItem('ij-lang') === 'sq') setLang('sq');
  else if(!localStorage.getItem('ij-lang') && isMobileDisplay() && navigator.language && navigator.language.toLowerCase().startsWith('sq')) setLang('sq');
}catch(e){}
