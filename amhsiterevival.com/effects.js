const perfReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
const perfFinePointer = window.matchMedia?.("(pointer: fine)")?.matches ?? true;
const perfMobile = window.matchMedia?.("(max-width: 760px)")?.matches ?? window.innerWidth < 760;
const perfSaveData = navigator.connection?.saveData === true;
const glareTargets = [
  ".experience-strip article",
  ".metrics div",
  ".command-panel",
  ".motion-lanes",
  ".demo-card",
  ".sample-grid article",
  ".work-grid article",
  ".work-track article",
  ".premium-cockpit",
  ".cockpit-grid article",
  ".custom-panel",
  ".help-card",
  ".showcase-visual",
  ".showcase-chip",
  ".value-grid article",
  ".steps article",
  ".auth-card",
  ".dash-card",
];

if (perfFinePointer && !perfReducedMotion) document.querySelectorAll(glareTargets.join(",")).forEach((el) => {
  el.classList.add("fx-glare");
  el.addEventListener("pointermove", (event) => {
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });
});

if (perfFinePointer && !perfReducedMotion) document.querySelectorAll(".button, .nav-button, nav a").forEach((el) => {
  el.addEventListener("pointermove", (event) => {
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });
});

if (perfFinePointer && !perfReducedMotion) document.querySelectorAll(".nav-install").forEach((el) => {
  el.addEventListener("pointermove", (event) => {
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });
});

const workRoll = document.querySelector(".work-roll");
const workTrack = document.querySelector(".work-track");
let workIndex = 0;
document.querySelectorAll("[data-work-arrow]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!workRoll || !workTrack) return;
    const cards = Array.from(workTrack.querySelectorAll("article:not([aria-hidden='true'])"));
    if (!cards.length) return;
    const direction = button.dataset.workArrow === "left" ? -1 : 1;
    workIndex = (workIndex + direction + cards.length) % cards.length;
    const first = cards[0];
    const gap = Number.parseFloat(getComputedStyle(workTrack).gap || "0");
    const step = first.getBoundingClientRect().width + gap;
    workTrack.classList.add("is-manual");
    workTrack.style.setProperty("--work-offset", `${Math.round(workIndex * step)}px`);
  });
});

function activateSpaceGame(game) {
  game.classList.add("is-active");
  const label = game.querySelector("em");
  if (label) label.textContent = "UFO field active";
}

document.querySelectorAll("[data-space-game]").forEach((game) => {
  game.addEventListener("click", () => activateSpaceGame(game));
  game.addEventListener("dblclick", () => activateSpaceGame(game));
  game.addEventListener("touchend", () => {
    const now = Date.now();
    const last = Number(game.dataset.lastTap || 0);
    game.dataset.lastTap = String(now);
    if (now - last < 360) activateSpaceGame(game);
  });
  game.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    activateSpaceGame(game);
  });
});

document.querySelectorAll("[data-space-game-button]").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".game-card");
    const game = card?.querySelector("[data-space-game]");
    if (game) activateSpaceGame(game);
  });
});

document.querySelectorAll("[data-card-link]").forEach((card) => {
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    openCardLink(card.dataset.cardLink || "");
  });
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openCardLink(card.dataset.cardLink || "");
  });
});

function openCardLink(url) {
  if (!url) return;
  if (url.startsWith("#") || url.startsWith("./") || url.startsWith("/")) {
    window.location.href = url;
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

const revealTargets = document.querySelectorAll("main > section, footer");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -10% 0px" },
  );
  revealTargets.forEach((el) => {
    el.classList.add("reveal-section");
    observer.observe(el);
  });
} else {
  revealTargets.forEach((el) => el.classList.add("is-visible"));
}

function alignHashTarget() {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  if (target) target.scrollIntoView({ block: "start" });
}

window.addEventListener("load", () => {
  window.setTimeout(alignHashTarget, 250);
  window.setTimeout(alignHashTarget, 900);
});

// Hero-title mouse drift + the standalone cursor glow removed — hero text stays static,
// and the only mouse effect is the SP-style cursor trail inside the hero canvas below.

// --- Premium polish pack: hero parallax + aurora, button shine/lift, card hover, reveal stagger ---
(function () {
  const css = document.createElement("style");
  css.textContent =
    ".button{position:relative;overflow:hidden;transition:transform .2s ease,box-shadow .25s ease;}" +
    ".button:hover{transform:translateY(-2px);}" +
    ".button.primary:hover{box-shadow:0 14px 34px -10px rgba(62,242,162,.55);}" +
    ".button::after{content:'';position:absolute;top:0;left:-120%;width:55%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.26),transparent);transform:skewX(-18deg);transition:left .6s ease;pointer-events:none;}" +
    ".button:hover::after{left:150%;}" +
    ".work-roll article{transition:transform .25s ease,box-shadow .3s ease,border-color .3s ease;}" +
    ".work-roll article:hover{transform:translateY(-6px);box-shadow:0 26px 60px -22px rgba(62,242,162,.4);border-color:rgba(62,242,162,.45);}" +
    ".amh-aurora{position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(38% 46% at 28% 32%,rgba(62,242,162,.16),transparent 62%),radial-gradient(40% 48% at 74% 42%,rgba(96,165,250,.14),transparent 62%);filter:blur(22px);animation:amhAurora 16s ease-in-out infinite alternate;}" +
    ".hero .hero-inner{position:relative;z-index:2;}" +
    ".hero .hero-inner,.hero .hero-inner *{animation:none!important;}" +
    "@keyframes amhAurora{0%{transform:translate3d(-3%,-2%,0) scale(1.05);}50%{transform:translate3d(4%,3%,0) scale(1.12);}100%{transform:translate3d(-2%,4%,0) scale(1.06);}}" +
    ".reveal-section.is-visible>*{animation:amhRise .6s cubic-bezier(.2,.7,.2,1) both;}" +
    ".reveal-section.is-visible>*:nth-child(1){animation-delay:.04s;}" +
    ".reveal-section.is-visible>*:nth-child(2){animation-delay:.12s;}" +
    ".reveal-section.is-visible>*:nth-child(3){animation-delay:.2s;}" +
    ".reveal-section.is-visible>*:nth-child(4){animation-delay:.28s;}" +
    ".reveal-section.is-visible>*:nth-child(n+5){animation-delay:.34s;}" +
    "@keyframes amhRise{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:none;}}" +
    "@media (prefers-reduced-motion:reduce){.amh-aurora{animation:none;}.reveal-section.is-visible>*{animation:none;}.hero .hero-bg{transform:none;}}";
  document.head.appendChild(css);

})();

// --- SP-style galactic hero canvas: starfield + shooting stars + cursor trail + hover sparks (top section only) ---
(function () {
  const section = document.querySelector(".hero");
  if (!section) return;
  if (perfReducedMotion || perfMobile || perfSaveData) return;
  const style = document.createElement("style");
  style.textContent = ".hero{position:relative;}.amh-hero-canvas{position:absolute;inset:0;z-index:1;pointer-events:none;}";
  document.head.appendChild(style);
  const canvas = document.createElement("canvas");
  canvas.className = "amh-hero-canvas";
  canvas.setAttribute("aria-hidden", "true");
  section.insertBefore(canvas, section.firstChild);
  const ctx = canvas.getContext("2d");
  const COUNT = 120;
  const st = { running: false, raf: null, t0: 0, stars: [], shoot: [], sparks: [], trail: [], mouse: { x: -9999, y: -9999, lastTrailT: 0 }, nextShoot: 0, w: 1, h: 1 };
  const pickColor = () => { const r = Math.random(); if (r < 0.5) return "255,255,255"; if (r < 0.75) return "235,255,245"; if (r < 0.87) return "200,230,255"; if (r < 0.95) return "125,255,190"; return "160,255,210"; };
  const pickSize = () => { const r = Math.random(); if (r < 0.5) return 0.5 + Math.random() * 0.5; if (r < 0.75) return 1 + Math.random() * 0.5; if (r < 0.9) return 1.5 + Math.random(); if (r < 0.97) return 2.5 + Math.random(); return 3.5 + Math.random() * 1.5; };
  const pickDepth = () => { const r = Math.random(); if (r < 0.5) return 0.2; if (r < 0.85) return 0.6; return 1; };
  const resize = () => { const dpr = Math.min(window.devicePixelRatio || 1, 1.5); const rect = section.getBoundingClientRect(); st.w = Math.max(1, rect.width); st.h = Math.max(1, rect.height); canvas.width = Math.round(st.w * dpr); canvas.height = Math.round(st.h * dpr); canvas.style.width = st.w + "px"; canvas.style.height = st.h + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const init = () => { st.stars = Array.from({ length: COUNT }, () => ({ x: Math.random() * st.w * 0.52, y: Math.random() * st.h, r: pickSize(), c: pickColor(), depth: pickDepth(), phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.7, flare: 0, sparkedThisHover: false })); st.shoot = []; st.sparks = []; st.trail = []; st.nextShoot = performance.now() + 5000 + Math.random() * 4000; };
  const onMove = (e) => { const rect = section.getBoundingClientRect(); st.mouse.x = e.clientX - rect.left; st.mouse.y = e.clientY - rect.top; const t = performance.now(); if (t - st.mouse.lastTrailT > 50) { st.trail.push({ x: st.mouse.x, y: st.mouse.y, life: 1 }); st.mouse.lastTrailT = t; if (st.trail.length > 18) st.trail.shift(); } };
  const onLeave = () => { st.mouse.x = -9999; st.mouse.y = -9999; };
  const spawnShoot = () => { const type = Math.floor(Math.random() * 3); const fromTop = Math.random() < 0.5; const sx = Math.random() * st.w * 0.46; const sy = fromTop ? -10 : st.h + 10; const angle = (fromTop ? 1 : -1) * (Math.PI / 6 + Math.random() * Math.PI / 6); let speed, decay, headR; if (type === 0) { speed = 600; decay = 0.6; headR = 6; } else if (type === 1) { speed = 320; decay = 0.36; headR = 8; } else { speed = 1100; decay = 1.2; headR = 5; } st.shoot.push({ x: sx, y: sy, vx: Math.cos(angle) * speed, vy: (fromTop ? 1 : -1) * Math.abs(Math.sin(angle) * speed) + (fromTop ? 100 : -100), life: 1, decay, headR, type, trail: [] }); };
  const spawnSparks = (cx, cy, c) => { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.random() * 0.4; const v = 100 + Math.random() * 80; st.sparks.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c }); } };
  const tick = (t) => {
    const rect = { width: st.w, height: st.h };
    const dt = Math.min(0.05, (t - st.t0) / 1000); st.t0 = t;
    ctx.clearRect(0, 0, rect.width, rect.height);
    const ps = st.stars, mx = st.mouse.x, my = st.mouse.y;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, rect.width * 0.54, rect.height); ctx.clip();
    ctx.lineWidth = 0.4;
    for (let i = 0; i < ps.length; i++) { if (ps[i].depth < 0.5) continue; for (let j = i + 1; j < ps.length; j++) { if (ps[j].depth < 0.5) continue; const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y, d2 = dx * dx + dy * dy; if (d2 < 10000) { ctx.strokeStyle = `rgba(62,242,162,${(1 - d2 / 10000) * 0.12})`; ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.stroke(); } } }
    for (const s of ps) { s.phase += dt * s.speed; const tw = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(s.phase));
      if (s.r > 3.5 && mx > -1000) { const dx = s.x - mx, dy = s.y - my, d2 = dx * dx + dy * dy; if (d2 < 900) { if (!s.sparkedThisHover) { spawnSparks(s.x, s.y, s.c); s.sparkedThisHover = true; } s.flare = Math.min(1, s.flare + dt * 5); } else if (d2 < 6400) { s.flare = Math.min(1, s.flare + dt * 3); if (d2 > 1500) s.sparkedThisHover = false; } else { s.flare = Math.max(0, s.flare - dt * 2); s.sparkedThisHover = false; } } else { s.flare = Math.max(0, s.flare - dt * 2); }
      let alpha = Math.min(1, tw + s.flare * 0.5) * (0.5 + s.depth * 0.5);
      if (s.x < rect.width * 0.5 && s.y < rect.height * 0.52) alpha *= 0.3;
      if (s.r > 1.5) { const glow = s.r * (3 + s.flare * 6);
        if (s.r > 3.5) { let g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glow * 0.5); g.addColorStop(0, `rgba(255,255,255,${alpha * 0.7})`); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, glow * 0.5, 0, Math.PI * 2); ctx.fill();
          g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glow); g.addColorStop(0, `rgba(${s.c},${alpha * 0.4})`); g.addColorStop(0.5, `rgba(${s.c},${alpha * 0.1})`); g.addColorStop(1, `rgba(${s.c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, glow, 0, Math.PI * 2); ctx.fill();
          g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glow * 1.6); g.addColorStop(0, `rgba(30,120,90,${alpha * 0.25})`); g.addColorStop(1, "rgba(30,120,90,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, glow * 1.6, 0, Math.PI * 2); ctx.fill();
        } else { const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glow); g.addColorStop(0, `rgba(${s.c},${alpha * 0.5})`); g.addColorStop(0.5, `rgba(${s.c},${alpha * 0.1})`); g.addColorStop(1, `rgba(${s.c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, glow, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.fillStyle = `rgba(${s.c},${alpha})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    if (t > st.nextShoot) { spawnShoot(); st.nextShoot = t + 2600 + Math.random() * 2400; }
    for (let i = st.shoot.length - 1; i >= 0; i--) { const ss = st.shoot[i]; ss.x += ss.vx * dt; ss.y += ss.vy * dt; ss.life -= dt * ss.decay; ss.trail.push({ x: ss.x, y: ss.y }); const mt = ss.type === 1 ? 22 : ss.type === 2 ? 8 : 14; if (ss.trail.length > mt) ss.trail.shift();
      for (let k = 1; k < ss.trail.length; k++) { ctx.strokeStyle = `rgba(125,255,190,${(k / ss.trail.length) * ss.life * 0.7})`; ctx.lineWidth = 1.5 * (k / ss.trail.length); ctx.beginPath(); ctx.moveTo(ss.trail[k - 1].x, ss.trail[k - 1].y); ctx.lineTo(ss.trail[k].x, ss.trail[k].y); ctx.stroke(); }
      if (ss.life > 0) { const g = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, ss.headR); g.addColorStop(0, `rgba(255,255,255,${ss.life})`); g.addColorStop(0.5, `rgba(125,255,190,${ss.life * 0.6})`); g.addColorStop(1, "rgba(125,255,190,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ss.x, ss.y, ss.headR, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = `rgba(255,255,255,${ss.life})`; ctx.beginPath(); ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2); ctx.fill(); }
      if (ss.life <= 0 || ss.x < -50 || ss.x > rect.width + 50 || ss.y > rect.height + 50 || ss.y < -50) st.shoot.splice(i, 1);
    }
    for (let i = st.sparks.length - 1; i >= 0; i--) { const sp = st.sparks[i]; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vx *= 0.92; sp.vy *= 0.92; sp.life -= dt * 1.6; if (sp.life <= 0) { st.sparks.splice(i, 1); continue; } ctx.fillStyle = `rgba(${sp.c},${sp.life})`; ctx.beginPath(); ctx.arc(sp.x, sp.y, 1.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    for (let i = st.trail.length - 1; i >= 0; i--) { const tr = st.trail[i]; tr.life -= dt * 1.5; if (tr.life <= 0) { st.trail.splice(i, 1); continue; } ctx.fillStyle = `rgba(62,242,162,${tr.life * 0.35})`; ctx.beginPath(); ctx.arc(tr.x, tr.y, 2, 0, Math.PI * 2); ctx.fill(); }
    st.raf = requestAnimationFrame(tick);
  };
  const start = () => { if (st.running) return; st.running = true; resize(); init(); window.addEventListener("mousemove", onMove); window.addEventListener("mouseleave", onLeave); window.addEventListener("resize", resize); st.t0 = performance.now(); st.raf = requestAnimationFrame(tick); };
  const stop = () => { if (!st.running) return; st.running = false; cancelAnimationFrame(st.raf); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseleave", onLeave); window.removeEventListener("resize", resize); ctx.clearRect(0, 0, canvas.width, canvas.height); };
  new IntersectionObserver((entries) => { for (const e of entries) e.isIntersecting ? start() : stop(); }, { threshold: 0.02 }).observe(section);
})();

let brandTaps = 0;
let brandTimer = 0;
document.querySelector(".brand")?.addEventListener("click", (event) => {
  brandTaps += 1;
  window.clearTimeout(brandTimer);
  brandTimer = window.setTimeout(() => {
    brandTaps = 0;
  }, 900);
  if (brandTaps < 3) return;
  event.preventDefault();
  brandTaps = 0;
  const toast = document.querySelector(".egg-toast");
  if (!toast) return;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 4200);
});
