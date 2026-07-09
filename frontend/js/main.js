const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_MOBILE = matchMedia('(max-width: 768px)').matches || navigator.maxTouchPoints > 1;
const DPR = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 1.75);
const BUDGET = {
  bgParticles : IS_MOBILE ? 400  : 900,
  globePoints : IS_MOBILE ? 650  : 1300,
  corePoints  : IS_MOBILE ? 80   : 160,
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
  const btn = document.getElementById('themeToggle');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    setTheme(getTheme() === 'light' ? 'dark' : 'light');
  });
}

function setLang(lang){
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-en]').forEach(el=>{
    const t = el.getAttribute('data-'+lang);
    if(t) el.innerHTML = t;
  });
  document.getElementById('btn-en').classList.toggle('active', lang==='en');
  document.getElementById('btn-sq').classList.toggle('active', lang==='sq');
  try{ localStorage.setItem('ij-lang', lang); }catch(e){}
  buildMarquees();
  if(typeof window.contactFormRefresh === 'function') window.contactFormRefresh();
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
  ['strip','marquee'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    if(!el.dataset.orig) el.dataset.orig = el.innerHTML;
    else el.innerHTML = el.dataset.orig;
    el.dataset.orig = el.innerHTML;
    el.innerHTML += el.innerHTML;
  });
}
buildMarquees();

const io = new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
},{ threshold:.12, rootMargin:'0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el=> io.observe(el));

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

const wrap = document.getElementById('projects');
const ring = document.getElementById('ring');
const hint = document.getElementById('scrollHint');
const CARD_SLOTS = document.querySelectorAll('.pcard').length || 6;
const CARD_STEP = 360 / CARD_SLOTS;
const RING_TRAVEL = (CARD_SLOTS - 1) * CARD_STEP;
let targetRot = 0, currentRot = 0, ticking = false;
let ringGlobeSync = 0;

function easeInOutCubic(t){
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateRing(){
  const rect = wrap.getBoundingClientRect();
  const total = Math.max(1, wrap.offsetHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, -rect.top / total));
  const eased = easeInOutCubic(progress);
  targetRot = -eased * RING_TRAVEL;
  hint.style.opacity = (progress > 0.03 && progress < 0.97) ? '0' : '1';
  ticking = false;
}

function updateCardTransforms(rot){
  document.querySelectorAll('.pcard').forEach(card=>{
    const i = parseInt(getComputedStyle(card).getPropertyValue('--i'), 10) || 0;
    const radiusPx = parseFloat(getComputedStyle(card).getPropertyValue('--radius')) || 420;
    const angle = i * CARD_STEP + rot;
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

window.addEventListener('scroll', ()=>{
  if(!ticking){ requestAnimationFrame(updateRing); ticking = true; }
},{ passive:true });
updateRing();
animateRing();

function setRadius(){
  const w = window.innerWidth;
  const r = w <= 560 ? 240 : w <= 1020 ? 320 : 420;
  document.querySelectorAll('.pcard').forEach(c=> c.style.setProperty('--radius', r + 'px'));
  updateCardTransforms(currentRot);
}
setRadius();
updateCardTransforms(0);
window.addEventListener('resize', setRadius);

document.querySelectorAll('[data-plan]').forEach(link=>{
  link.addEventListener('click', ()=>{
    const plan = link.getAttribute('data-plan') || '';
    try{ sessionStorage.setItem('ij-plan', plan); }catch(e){}
  });
});

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

(function bgField(){
  if(REDUCED) return;
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
    {color:'#00ced1', size: IS_MOBILE ? 1.4 : 1.7, count: .6},
    {color:'#00e8ff', size: IS_MOBILE ? 1.1 : 1.3, count: .4},
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

(function heroCard(){
  if(REDUCED) return;
  const holder = document.getElementById('hero3d');
  const canvas = document.getElementById('cardCanvas');
  const overlay = document.getElementById('cardOverlay');
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(38, 1, .1, 50);
  cam.position.z = 6.4;
  function size(){
    const r = holder.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width/r.height; cam.updateProjectionMatrix();
  }
  size(); addEventListener('resize', size);

  const vert = `
    uniform float uTime;
    varying vec2 vUv;
    varying float vWave;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);
      f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
                 mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
    }
    void main(){
      vUv=uv;
      vec3 p=position;
      float n=noise(uv*3.0+uTime*0.2)+0.5*noise(uv*7.0-uTime*0.28);
      float wave=sin(uv.x*6.283+uTime*0.75)*0.05+n*0.12;
      p.z+=wave;
      vWave=wave;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
    }`;
  const frag = `
    precision mediump float;
    uniform float uTime;
    uniform vec2 uMouse;
    varying vec2 vUv;
    varying float vWave;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);
      f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
                 mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
    }
    float fbm(vec2 p){
      float v=0.0,a=0.5;
      for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=0.5;}
      return v;
    }
    float roundRect(vec2 uv, vec2 halfSize, float r){
      vec2 d=abs(uv-0.5)-halfSize+vec2(r);
      return length(max(d,0.0))+min(max(d.x,d.y),0.0)-r;
    }
    void main(){
      vec2 uv=vUv;
      vec2 flow=uv*3.0+vec2(uTime*0.1,-uTime*0.07)+uMouse*0.28;
      float n=fbm(flow);
      float n2=fbm(flow*1.8+n*1.5);
      vec3 cDeep=vec3(0.02,0.06,0.12);
      vec3 cGreen=vec3(0.0,0.35,0.45);
      vec3 cTeal=vec3(0.0,0.65,0.75);
      vec3 cLight=vec3(0.35,0.92,1.0);
      vec3 col=mix(cDeep,cGreen,smoothstep(0.25,0.75,n));
      col=mix(col,cTeal,smoothstep(0.5,0.95,n2)*0.75);
      float streak=pow(abs(sin((uv.x+uv.y)*7.0+n*8.0-uTime*0.6)),28.0);
      col+=cLight*streak*0.45;
      col+=cLight*smoothstep(0.1,0.18,vWave)*0.35;
      float edge=smoothstep(0.32,0.5,distance(uv,vec2(0.5)));
      col+=mix(cTeal,cLight,uv.y)*edge*0.35;
      float d=roundRect(uv,vec2(0.46,0.44),0.09);
      float alpha=1.0-smoothstep(0.0,0.012,d);
      col+=cTeal*smoothstep(0.014,0.0,abs(d))*0.5;
      gl_FragColor=vec4(col,alpha*0.94);
    }`;
  const cardMat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, transparent: true,
    uniforms: { uTime: {value:0}, uMouse: {value: new THREE.Vector2(0,0)} },
    side: THREE.DoubleSide
  });
  const seg = IS_MOBILE ? [64,40] : [110,70];
  const card = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.15, seg[0], seg[1]), cardMat);
  const cardGroup = new THREE.Group();
  cardGroup.add(card);
  scene.add(cardGroup);

  const orbTex = makeDotTexture('#00e8ff');
  const orbs = [];
  [[-2.1,1.1,.6,.09],[2.2,-.9,.4,.12],[1.6,1.4,-.5,.07],[-1.8,-1.3,.3,.1]].forEach(([x,y,z,s])=>{
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({map:orbTex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, opacity:.75}));
    spr.position.set(x,y,z); spr.scale.setScalar(s*6);
    spr.userData = {x,y,z, ph: Math.random()*6.28};
    scene.add(spr); orbs.push(spr);
  });

  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const spring = {rx:0, ry:0, vx:0, vy:0, tx:0, ty:0, s:1, vs:0, ts:1};
  let hovering = false;
  holder.addEventListener('pointermove', e=>{
    const r = holder.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left)/r.width)*2 - 1;
    pointer.y = -(((e.clientY - r.top)/r.height)*2 - 1);
    spring.ty = pointer.x * 0.38;
    spring.tx = -pointer.y * 0.26;
    cardMat.uniforms.uMouse.value.set(pointer.x, pointer.y);
    ray.setFromCamera(pointer, cam);
    hovering = ray.intersectObject(card).length > 0;
    spring.ts = hovering ? 1.04 : 1.0;
  });
  holder.addEventListener('pointerleave', ()=>{ spring.tx = spring.ty = 0; spring.ts = 1; hovering = false; });

  const activeIO = new IntersectionObserver(es=>{ es.forEach(e=> visible.card = e.isIntersecting); }, {threshold:.05});
  activeIO.observe(holder);

  const K = 0.07, D = 0.88;
  let t = 0;
  function frame(){
    requestAnimationFrame(frame);
    if(!visible.card || document.hidden) return;
    t += 0.014;
    cardMat.uniforms.uTime.value = t;
    spring.vx += (spring.tx - spring.rx) * K; spring.vx *= D; spring.rx += spring.vx;
    spring.vy += (spring.ty - spring.ry) * K; spring.vy *= D; spring.ry += spring.vy;
    spring.vs += (spring.ts - spring.s) * K; spring.vs *= D; spring.s += spring.vs;
    cardGroup.rotation.x = spring.rx;
    cardGroup.rotation.y = spring.ry;
    cardGroup.scale.setScalar(spring.s);
    cardGroup.position.y = Math.sin(t * 0.75) * 0.06;
    cardGroup.rotation.z = Math.sin(t * 0.45) * 0.015;
    overlay.style.transform =
      `translate(-50%,-50%) perspective(900px) rotateX(${spring.rx*57.3*0.85}deg) rotateY(${spring.ry*57.3*0.85}deg) translateY(${Math.sin(t*0.75)*5}px) scale(${spring.s})`;
    orbs.forEach(o=>{
      const u = o.userData;
      o.position.y = u.y + Math.sin(t * 0.85 + u.ph) * 0.18;
      o.position.x = u.x + Math.cos(t * 0.55 + u.ph) * 0.12;
    });
    renderer.render(scene, cam);
  }
  frame();
})();

(function codeGlobe(){
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
    size: IS_MOBILE ? 1.55 : 1.85, map: makeDotTexture('#00e8ff'), transparent: true, opacity: .95,
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

initTheme();
try{ if(localStorage.getItem('ij-lang') === 'sq') setLang('sq'); }catch(e){}
