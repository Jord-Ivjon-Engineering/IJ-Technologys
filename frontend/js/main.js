/* ===================== SHARED SETUP & PERF BUDGET ===================== */
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_MOBILE = matchMedia('(max-width: 768px)').matches || navigator.maxTouchPoints > 1;
const DPR = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 1.75);
/* particle budget scales down on mobile to hold 60fps */
const BUDGET = {
  bgParticles : IS_MOBILE ? 550  : 1400,
  globePoints : IS_MOBILE ? 650  : 1300,
  corePoints  : IS_MOBILE ? 80   : 160,
};
const visible = { bg:true, card:false, globe:false };
document.addEventListener('visibilitychange',()=>{ visible.bg = !document.hidden; });

/* ===================== UI LOGIC (lang, menu, reveal, counters) ===================== */
function setLang(lang){
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-en]').forEach(el=>{
    const t = el.getAttribute('data-'+lang);
    if(t) el.innerHTML = t;
  });
  document.getElementById('btn-en').classList.toggle('active', lang==='en');
  document.getElementById('btn-sq').classList.toggle('active', lang==='sq');
  try{localStorage.setItem('ij-lang',lang)}catch(e){}
  buildMarquees();
}
const headerEl = document.getElementById('header');
window.addEventListener('scroll',()=>headerEl.classList.toggle('scrolled',window.scrollY>30),{passive:true});
const burger=document.getElementById('burger'), mmenu=document.getElementById('mobileMenu');
burger.addEventListener('click',()=>{
  const open=mmenu.classList.toggle('open');
  burger.classList.toggle('open',open);burger.setAttribute('aria-expanded',open);
});
mmenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mmenu.classList.remove('open');burger.classList.remove('open');}));

const counterIO=new IntersectionObserver(es=>{es.forEach(en=>{
  if(!en.isIntersecting)return;
  const el=en.target,target=+el.dataset.count,t0=performance.now(),dur=1600;
  (function tick(t){const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);
    el.textContent=Math.round(target*e)+(p===1?'+':'');
    if(p<1)requestAnimationFrame(tick);})(t0);
  counterIO.unobserve(el);
});},{threshold:.6});
document.querySelectorAll('[data-count]').forEach(el=>counterIO.observe(el));

function buildMarquees(){
  ['strip','marquee'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    if(!el.dataset.orig)el.dataset.orig=el.innerHTML;else el.innerHTML=el.dataset.orig;
    el.dataset.orig=el.innerHTML;el.innerHTML+=el.innerHTML;
  });
}
buildMarquees();

const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ===================== SCROLL-DRIVEN PROJECT RING ===================== */
const wrap=document.getElementById('projects'),ring=document.getElementById('ring'),hint=document.getElementById('scrollHint');
let ticking=false, globeSpeedBoost=0;
function updateRing(){
  const rect=wrap.getBoundingClientRect();
  const total=wrap.offsetHeight-window.innerHeight;
  const progress=Math.min(1,Math.max(0,-rect.top/total));
  ring.style.setProperty('--rot',(-progress*720)+'deg');
  hint.style.opacity=(progress>0.05&&progress<0.97)?'0':'1';
  ticking=false;
}
window.addEventListener('scroll',()=>{
  if(!ticking){requestAnimationFrame(updateRing);ticking=true;}
  globeSpeedBoost=0.05;
},{passive:true});
updateRing();
function setRadius(){
  const w=window.innerWidth;
  const r=w<=560?260:w<=1020?330:470;
  document.querySelectorAll('.pcard').forEach(c=>c.style.setProperty('--radius',r+'px'));
}
setRadius();

/* ===================== HELPERS: textures ===================== */
/* soft round sprite for glowing particles */
function makeDotTexture(color){
  const c=document.createElement('canvas');c.width=c.height=64;
  const g=c.getContext('2d');
  const grd=g.createRadialGradient(32,32,0,32,32,32);
  grd.addColorStop(0,color);grd.addColorStop(.35,color+'AA');grd.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grd;g.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
}
/* scrolling "source code" texture for the globe's core & rings */
const CODE_WORDS=['const','let','=>','function(','return','if(','for(','await','async','fetch(','.then(','import','export','</div>','<nav>','useState(','.map(','&&','||','npm run build','git push','class=','display:flex','{ }','01101','render()','props.','.css','.tsx','SELECT *','while(','try{','catch(e)','new Promise','addEventListener','translate3d','requestAnimationFrame'];
function makeCodeTexture(w,h,fontSize,dense){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d');
  g.clearRect(0,0,w,h);
  g.font=`600 ${fontSize}px "JetBrains Mono",monospace`;
  const lineH=fontSize*1.7, cols=['#4BD8FF','#6C7BFF','#A06BFF','#7FE8C1','#FFB65C'];
  for(let y=lineH;y<h;y+=lineH){
    let x=8+Math.random()*30;
    while(x<w-40){
      const word=CODE_WORDS[(Math.random()*CODE_WORDS.length)|0];
      const bright=Math.random()<(dense?.3:.18);
      g.fillStyle=bright?cols[(Math.random()*cols.length)|0]:'rgba(120,140,220,.42)';
      g.fillText(word,x,y);
      x+=g.measureText(word).width+fontSize*(1+Math.random()*1.6);
    }
  }
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  return t;
}

/* ===================== SCENE 1: DRIFTING PARTICLE FIELD (background) ===================== */
(function bgField(){
  const canvas=document.getElementById('bgCanvas');
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});
  renderer.setPixelRatio(DPR);
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(60,1,1,120);
  cam.position.z=40;
  function size(){renderer.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();}
  size();addEventListener('resize',size);

  const N=BUDGET.bgParticles;
  const pos=new Float32Array(N*3), phase=new Float32Array(N);
  for(let i=0;i<N;i++){
    pos[i*3]  =(Math.random()-.5)*110;
    pos[i*3+1]=(Math.random()-.5)*70;
    pos[i*3+2]=(Math.random()-.5)*60;
    phase[i]=Math.random()*Math.PI*2;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const groups=[
    {color:'#6C7BFF',size:IS_MOBILE?1.6:1.9,count:.6},
    {color:'#4BD8FF',size:IS_MOBILE?1.2:1.4,count:.4},
  ];
  /* two point clouds sharing geometry ranges for two glow colors */
  const clouds=groups.map((gr,gi)=>{
    const start=gi===0?0:Math.floor(N*groups[0].count);
    const end=gi===0?Math.floor(N*groups[0].count):N;
    const sub=new THREE.BufferGeometry();
    sub.setAttribute('position',new THREE.BufferAttribute(pos.slice(start*3,end*3),3));
    const mat=new THREE.PointsMaterial({
      size:gr.size,map:makeDotTexture(gr.color),transparent:true,opacity:.8,
      depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true
    });
    const p=new THREE.Points(sub,mat);scene.add(p);return p;
  });

  let mx=0,my=0;
  addEventListener('pointermove',e=>{mx=(e.clientX/innerWidth-.5);my=(e.clientY/innerHeight-.5);},{passive:true});

  let t=0;
  function frame(){
    if(REDUCED){renderer.render(scene,cam);return;} /* single static frame */
    requestAnimationFrame(frame);
    if(!visible.bg)return;
    t+=0.0016;
    clouds.forEach((c,i)=>{
      c.rotation.y=t*(i?-.5:.8);
      c.rotation.x=Math.sin(t*.7+i)*0.06;
    });
    /* gentle camera parallax toward the mouse */
    cam.position.x+=(mx*4-cam.position.x)*.03;
    cam.position.y+=(-my*3-cam.position.y)*.03;
    cam.lookAt(0,0,0);
    renderer.render(scene,cam);
  }
  frame();
})();

/* ===================== SCENE 2: LIQUID-METAL HERO CARD ===================== */
(function heroCard(){
  const holder=document.getElementById('hero3d');
  const canvas=document.getElementById('cardCanvas');
  const overlay=document.getElementById('cardOverlay');
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(DPR);
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(38,1,.1,50);
  cam.position.z=6.4;
  function size(){
    const r=holder.getBoundingClientRect();
    renderer.setSize(r.width,r.height,false);
    cam.aspect=r.width/r.height;cam.updateProjectionMatrix();
  }
  size();addEventListener('resize',size);

  /* ---- custom liquid-metal shaders ---- */
  const vert=`
    uniform float uTime;
    varying vec2 vUv;
    varying float vWave;
    // cheap value noise
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
      float n=noise(uv*3.0+uTime*0.25)+0.5*noise(uv*7.0-uTime*0.35);
      float wave=sin(uv.x*6.283+uTime*0.9)*0.06+n*0.16;
      p.z+=wave;
      vWave=wave;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
    }`;
  const frag=`
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
    // rounded-rectangle mask so the plane looks like a card
    float roundRect(vec2 uv, vec2 halfSize, float r){
      vec2 d=abs(uv-0.5)-halfSize+vec2(r);
      return length(max(d,0.0))+min(max(d.x,d.y),0.0)-r;
    }
    void main(){
      vec2 uv=vUv;
      // flowing liquid field, biased slightly toward the cursor
      vec2 flow=uv*3.0+vec2(uTime*0.12,-uTime*0.09)+uMouse*0.35;
      float n=fbm(flow);
      float n2=fbm(flow*1.8+n*1.5);
      // liquid-metal palette: deep indigo -> periwinkle -> violet -> cyan sheen
      vec3 cDeep  =vec3(0.055,0.07,0.20);
      vec3 cIndigo=vec3(0.26,0.32,0.90);
      vec3 cViolet=vec3(0.55,0.36,0.95);
      vec3 cCyan  =vec3(0.29,0.85,1.00);
      vec3 col=mix(cDeep,cIndigo,smoothstep(0.25,0.75,n));
      col=mix(col,cViolet,smoothstep(0.5,0.95,n2)*0.8);
      // metallic specular streaks that slide with the flow
      float streak=pow(abs(sin((uv.x+uv.y)*7.0+n*8.0-uTime*0.7)),24.0);
      col+=cCyan*streak*0.6;
      // wave highlight from vertex displacement
      col+=cCyan*smoothstep(0.12,0.2,vWave)*0.5;
      // iridescent edge (fresnel-like from uv distance)
      float edge=smoothstep(0.32,0.5,distance(uv,vec2(0.5)));
      col+=mix(cViolet,cCyan,uv.y)*edge*0.55;
      // rounded card mask with soft antialiased border glow
      float d=roundRect(uv,vec2(0.46,0.44),0.09);
      float alpha=1.0-smoothstep(0.0,0.012,d);
      col+=cCyan*smoothstep(0.014,0.0,abs(d))*0.8; // glowing card border
      gl_FragColor=vec4(col,alpha*0.96);
    }`;
  const cardMat=new THREE.ShaderMaterial({
    vertexShader:vert,fragmentShader:frag,transparent:true,
    uniforms:{uTime:{value:0},uMouse:{value:new THREE.Vector2(0,0)}},
    side:THREE.DoubleSide
  });
  /* modest segment count keeps mobile at 60fps while waves stay smooth */
  const seg=IS_MOBILE?[64,40]:[110,70];
  const card=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.15,seg[0],seg[1]),cardMat);
  const cardGroup=new THREE.Group();
  cardGroup.add(card);
  scene.add(cardGroup);

  /* floating glow orbs around the card */
  const orbTex=makeDotTexture('#4BD8FF');
  const orbs=[];
  const orbData=[[-2.1,1.1,.6,.09],[2.2,-.9,.4,.12],[1.6,1.4,-.5,.07],[-1.8,-1.3,.3,.1]];
  orbData.forEach(([x,y,z,s])=>{
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:orbTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.9}));
    spr.position.set(x,y,z);spr.scale.setScalar(s*6);
    spr.userData={x,y,z,ph:Math.random()*6.28};
    scene.add(spr);orbs.push(spr);
  });

  /* ---- raycasting pointer handler + spring physics tilt ---- */
  const ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
  const spring={rx:0,ry:0,vx:0,vy:0,tx:0,ty:0,s:1,vs:0,ts:1};
  let hovering=false;
  holder.addEventListener('pointermove',e=>{
    const r=holder.getBoundingClientRect();
    pointer.x=((e.clientX-r.left)/r.width)*2-1;
    pointer.y=-(((e.clientY-r.top)/r.height)*2-1);
    /* tilt targets: card leans toward the cursor */
    spring.ty=pointer.x*0.42;
    spring.tx=-pointer.y*0.3;
    cardMat.uniforms.uMouse.value.set(pointer.x,pointer.y);
    /* raycast: grow slightly when the cursor is actually over the card */
    ray.setFromCamera(pointer,cam);
    hovering=ray.intersectObject(card).length>0;
    spring.ts=hovering?1.05:1.0;
  });
  holder.addEventListener('pointerleave',()=>{spring.tx=spring.ty=0;spring.ts=1;hovering=false;});

  const activeIO=new IntersectionObserver(es=>{es.forEach(e=>visible.card=e.isIntersecting);},{threshold:.05});
  activeIO.observe(holder);

  const K=0.075, D=0.86; /* spring stiffness + damping */
  let t=0;
  function frame(){
    if(REDUCED){renderer.render(scene,cam);return;}
    requestAnimationFrame(frame);
    if(!visible.card||document.hidden)return;
    t+=0.016;
    cardMat.uniforms.uTime.value=t;
    /* spring integrate */
    spring.vx+=(spring.tx-spring.rx)*K; spring.vx*=D; spring.rx+=spring.vx;
    spring.vy+=(spring.ty-spring.ry)*K; spring.vy*=D; spring.ry+=spring.vy;
    spring.vs+=(spring.ts-spring.s)*K;  spring.vs*=D; spring.s +=spring.vs;
    cardGroup.rotation.x=spring.rx;
    cardGroup.rotation.y=spring.ry;
    cardGroup.scale.setScalar(spring.s);
    /* idle float */
    cardGroup.position.y=Math.sin(t*0.8)*0.08;
    cardGroup.rotation.z=Math.sin(t*0.5)*0.02;
    /* overlay text mirrors the card's tilt (CSS 3D) */
    overlay.style.transform=
      `translate(-50%,-50%) perspective(900px) rotateX(${spring.rx*57.3*0.9}deg) rotateY(${spring.ry*57.3*0.9}deg) translateY(${Math.sin(t*0.8)*6}px) scale(${spring.s})`;
    orbs.forEach(o=>{
      const u=o.userData;
      o.position.y=u.y+Math.sin(t*0.9+u.ph)*0.22;
      o.position.x=u.x+Math.cos(t*0.6+u.ph)*0.14;
    });
    renderer.render(scene,cam);
  }
  frame();
})();

/* ===================== SCENE 3: CODE-CORE TECH GLOBE ===================== */
(function codeGlobe(){
  const stage=document.getElementById('orbitScene');
  const canvas=document.getElementById('globeCanvas');
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(DPR);
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(45,1,.1,60);
  cam.position.z=8.2;
  function size(){
    const r=stage.getBoundingClientRect();
    const s=Math.min(r.width,r.height)*0.9;
    renderer.setSize(s,s,false);
    canvas.style.width=s+'px';canvas.style.height=s+'px';
    cam.aspect=1;cam.updateProjectionMatrix();
  }
  size();addEventListener('resize',()=>{size();setRadius();});

  const R=2.5;
  const globe=new THREE.Group();
  scene.add(globe);

  /* 1) surface: glowing points on a fibonacci sphere */
  const N=BUDGET.globePoints;
  const sp=new Float32Array(N*3);
  const golden=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<N;i++){
    const y=1-(i/(N-1))*2, rad=Math.sqrt(1-y*y), th=golden*i;
    sp[i*3]=Math.cos(th)*rad*R; sp[i*3+1]=y*R; sp[i*3+2]=Math.sin(th)*rad*R;
  }
  const surfGeo=new THREE.BufferGeometry();
  surfGeo.setAttribute('position',new THREE.BufferAttribute(sp,3));
  globe.add(new THREE.Points(surfGeo,new THREE.PointsMaterial({
    size:IS_MOBILE?1.6:1.9,map:makeDotTexture('#4BD8FF'),transparent:true,opacity:.85,
    depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:false
  })));

  /* faint structural wireframe */
  const wire=new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.SphereGeometry(R*0.995,20,14)),
    new THREE.LineBasicMaterial({color:0x39418f,transparent:true,opacity:.16})
  );
  globe.add(wire);

  /* 2) THE CORE: a sphere wrapped in scrolling source code -- technology at the center */
  const coreTex=makeCodeTexture(1024,512,22,true);
  coreTex.repeat.set(2,1);
  const core=new THREE.Mesh(
    new THREE.SphereGeometry(R*0.58,40,28),
    new THREE.MeshBasicMaterial({map:coreTex,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false})
  );
  globe.add(core);
  /* inner heartbeat glow */
  const heart=new THREE.Sprite(new THREE.SpriteMaterial({map:makeDotTexture('#6C7BFF'),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.8}));
  heart.scale.setScalar(R*1.7);
  globe.add(heart);
  /* rising binary sparks inside the shell */
  const M=BUDGET.corePoints;
  const ip=new Float32Array(M*3), iv=new Float32Array(M);
  for(let i=0;i<M;i++){
    const r=R*(0.62+Math.random()*0.3), a=Math.random()*6.283, b=Math.acos(2*Math.random()-1);
    ip[i*3]=r*Math.sin(b)*Math.cos(a); ip[i*3+1]=r*Math.cos(b); ip[i*3+2]=r*Math.sin(b)*Math.sin(a);
    iv[i]=0.15+Math.random()*0.5;
  }
  const inGeo=new THREE.BufferGeometry();
  inGeo.setAttribute('position',new THREE.BufferAttribute(ip,3));
  const sparks=new THREE.Points(inGeo,new THREE.PointsMaterial({
    size:1.3,map:makeDotTexture('#A06BFF'),transparent:true,opacity:.7,
    depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:false
  }));
  globe.add(sparks);

  /* 3) holographic code rings orbiting the sphere */
  const ringTexA=makeCodeTexture(2048,96,30,false);
  ringTexA.repeat.set(3,1);
  const ringTexB=makeCodeTexture(2048,72,24,false);
  ringTexB.repeat.set(4,1);
  function codeBand(radius,height,tex,tiltX,tiltZ){
    const m=new THREE.Mesh(
      new THREE.CylinderGeometry(radius,radius,height,72,1,true),
      new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.8,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false})
    );
    m.rotation.x=tiltX;m.rotation.z=tiltZ;
    return m;
  }
  const bandA=codeBand(R*1.28,0.34,ringTexA, 0.28, 0.10);
  const bandB=codeBand(R*1.5 ,0.24,ringTexB,-0.42,-0.16);
  scene.add(bandA,bandB);

  /* activity: render only while the section is on screen */
  const activeIO=new IntersectionObserver(es=>{es.forEach(e=>visible.globe=e.isIntersecting);},{threshold:.02});
  activeIO.observe(stage);

  let t=0;
  function frame(){
    if(REDUCED){renderer.render(scene,cam);return;}
    requestAnimationFrame(frame);
    if(!visible.globe||document.hidden)return;
    t+=0.016;
    const spin=0.0035+globeSpeedBoost;
    globeSpeedBoost*=0.94;
    globe.rotation.y+=spin;
    core.rotation.y-=spin*2.2;               /* code core counter-rotates */
    coreTex.offset.y=(coreTex.offset.y+0.0007)%1; /* code scrolls upward forever */
    bandA.rotation.y+=spin*1.6;
    bandB.rotation.y-=spin*1.2;
    ringTexA.offset.x=(ringTexA.offset.x+0.0005)%1;
    ringTexB.offset.x=(ringTexB.offset.x-0.0004)%1;
    heart.material.opacity=0.55+Math.sin(t*1.4)*0.25; /* heartbeat */
    /* sparks drift upward and respawn at the bottom */
    const arr=inGeo.attributes.position.array;
    for(let i=0;i<M;i++){
      arr[i*3+1]+=iv[i]*0.006;
      if(arr[i*3+1]>R*0.92)arr[i*3+1]=-R*0.92;
    }
    inGeo.attributes.position.needsUpdate=true;
    renderer.render(scene,cam);
  }
  frame();
})();

/* restore saved language last, after all dynamic DOM is ready */
try{ if(localStorage.getItem('ij-lang')==='sq') setLang('sq'); }catch(e){}
