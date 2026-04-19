/* ── Particle Canvas ── */
(function(){
  const c=document.getElementById('particle-canvas');
  if(!c)return;
  const ctx=c.getContext('2d');
  let w,h,particles=[];
  function resize(){w=c.width=window.innerWidth;h=c.height=window.innerHeight}
  window.addEventListener('resize',resize);resize();
  class P{
    constructor(){this.reset()}
    reset(){this.x=Math.random()*w;this.y=Math.random()*h;this.r=Math.random()*1.5+.5;this.vx=(Math.random()-.5)*.3;this.vy=(Math.random()-.5)*.3;this.a=Math.random()*.4+.1}
    update(){this.x+=this.vx;this.y+=this.vy;if(this.x<0||this.x>w)this.vx*=-1;if(this.y<0||this.y>h)this.vy*=-1}
    draw(){ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fillStyle=`rgba(224,176,255,${this.a})`;ctx.fill()}
  }
  for(let i=0;i<60;i++)particles.push(new P());
  function loop(){ctx.clearRect(0,0,w,h);particles.forEach(p=>{p.update();p.draw()});
    for(let i=0;i<particles.length;i++)for(let j=i+1;j<particles.length;j++){
      const dx=particles[i].x-particles[j].x,dy=particles[i].y-particles[j].y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<120){ctx.beginPath();ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(224,176,255,${.06*(1-d/120)})`;ctx.stroke()}
    }
    requestAnimationFrame(loop)}
  loop();
})();

/* ── Nav Scroll ── */
const nav=document.getElementById('main-nav');
window.addEventListener('scroll',()=>{nav.classList.toggle('scrolled',window.scrollY>50)});

/* ── Mobile menu ── */
const burger=document.getElementById('nav-burger');
const mobileMenu=document.getElementById('mobile-menu');
if(burger)burger.addEventListener('click',()=>mobileMenu.classList.toggle('open'));
document.querySelectorAll('.mobile-menu__link').forEach(l=>l.addEventListener('click',()=>mobileMenu.classList.remove('open')));

/* ── Scroll Reveal ── */
const io=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}})},{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ── Counter Animation ── */
function animateCounters(){
  document.querySelectorAll('.hero__stat-number').forEach(el=>{
    const target=parseFloat(el.dataset.count);
    const isFloat=String(target).includes('.');
    const duration=2000;const start=performance.now();
    function tick(now){
      const p=Math.min((now-start)/duration,1);
      const eased=1-Math.pow(1-p,3);
      const val=eased*target;
      el.textContent=isFloat?val.toFixed(1):Math.floor(val).toLocaleString();
      if(p<1)requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

const heroObs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){animateCounters();heroObs.disconnect()}})},{threshold:.3});
const heroStats=document.querySelector('.hero__stats');
if(heroStats)heroObs.observe(heroStats);

/* ── Progress Bar Animation ── */
const barObs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){
  e.target.querySelectorAll('.milestone-bar__fill').forEach(bar=>{
    bar.style.setProperty('--target-width',bar.dataset.width+'%');
    bar.classList.add('animate');
  });barObs.unobserve(e.target)}})},{threshold:.3});
const bars=document.querySelector('.milestones__bars');
if(bars)barObs.observe(bars);

/* ── Smooth scroll for nav links ── */
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();const t=document.querySelector(a.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth'})})});

/* ── Active nav link on scroll ── */
const sections=document.querySelectorAll('section[id]');
window.addEventListener('scroll',()=>{
  const y=window.scrollY+200;
  sections.forEach(s=>{
    const top=s.offsetTop,h=s.offsetHeight,id=s.getAttribute('id');
    const link=document.querySelector(`.nav__link[href="#${id}"]`);
    if(link){if(y>=top&&y<top+h){link.classList.add('nav__link--active')}else{link.classList.remove('nav__link--active')}}
  });
});

/* ── CTA Button Wiring ── */
function goAuth() {
  const token = localStorage.getItem('syncup_token');
  window.location.href = token ? '/dashboard' : '/login';
}
['nav-cta','hero-cta-primary','final-cta-btn'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', goAuth);
});
const refBtn = document.getElementById('referral-btn');
if (refBtn) refBtn.addEventListener('click', goAuth);
const secBtn = document.getElementById('hero-cta-secondary');
if (secBtn) secBtn.addEventListener('click', () => document.getElementById('trust').scrollIntoView({ behavior: 'smooth' }));
