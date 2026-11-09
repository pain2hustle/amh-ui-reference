
// Shared beam artwork; unique gradient IDs keep the intro and footer independent.
function amhMountEyeBeam(b,key){b.insertAdjacentHTML('beforeend',('<svg class="eye-beam" viewBox="0 0 600 120" aria-hidden="true" focusable="false">'+
    '<defs><linearGradient id="amhEyeBeamColor"><stop offset="0" stop-color="#f4fff8"/><stop offset=".12" stop-color="#afffd0" stop-opacity=".9"/><stop offset=".6" stop-color="#39ff88" stop-opacity=".55"/><stop offset="1" stop-color="#39ff88" stop-opacity="0"/></linearGradient>'+
    '<linearGradient id="amhEyeBeamCore"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#eafff2"/><stop offset=".78" stop-color="#91ffb9" stop-opacity=".8"/><stop offset="1" stop-color="#91ffb9" stop-opacity="0"/></linearGradient></defs>'+
    '<path class="beam-haze" d="M0 60L600 5L600 115Z" fill="url(#amhEyeBeamColor)"/>'+
    '<path class="beam-body" d="M0 57L600 42L600 78L0 63Z" fill="url(#amhEyeBeamColor)"/>'+
    '<path class="beam-core" d="M0 59L600 56L600 64L0 61Z" fill="url(#amhEyeBeamCore)"/>'+
    '<path class="beam-thread" d="M0 60L65 56L104 63L155 53L186 60L254 46L301 59L365 42L410 57L482 40L600 54M0 60L84 66L125 60L193 73L236 62L312 75L357 63L426 81L479 64L600 76" fill="none" stroke="url(#amhEyeBeamColor)" stroke-width="1.4"/>'+
    '<ellipse class="beam-source" cx="4" cy="60" rx="8" ry="7" fill="#f4fff8"/></svg>').replace(/amhEyeBeam/g,key))}
(function () {
  var R = document.documentElement, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* nav */
  var nav = document.getElementById("nav"), burger = document.getElementById("burger"), mm = document.getElementById("mmenu");
  addEventListener("scroll", function () { nav.classList.toggle("solid", scrollY > 40); }, { passive: true });
  if (burger) {
    burger.addEventListener("click", function () { var o = mm.classList.toggle("open"); burger.classList.toggle("open", o); burger.setAttribute("aria-expanded", o); });
    mm.addEventListener("click", function (e) { if (e.target.closest("a")) { mm.classList.remove("open"); burger.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); } });
  }

  /* work reel arrows */
  var reel = document.getElementById("reel");
  document.querySelectorAll("[data-reel]").forEach(function (b) {
    b.addEventListener("click", function () { reel.scrollBy({ left: (+b.dataset.reel) * reel.clientWidth * 0.8, behavior: "smooth" }); });
  });

  /* reveal on scroll */
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -10% 0px" });
    document.querySelectorAll(".head,.steps li,.card,.phone,.tier,.qs details,.space-copy").forEach(function (el) { el.classList.add("rv"); io.observe(el); });
  }

  /* ---------- sky: stars + real shooting stars ----------
     A meteor is light, not a ball: a thin white-blue streak whose head brightens as it hits thicker air,
     flares once, shifts to a real flame colour (orange-red, never yellow), sheds a few glowing fragments,
     and burns out leaving a faint fading train. */
  function sky(canvas, opts) {
    if (!canvas) return;
    var mctx = null; if (opts.met) mctx = opts.met.getContext("2d");
    var ctx = canvas.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2), W = 0, H = 0, stars = [], mets = [], next = 1.2, on = true;
    function size() {
      var r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (opts.met) { opts.met.width = W * dpr; opts.met.height = H * dpr; mctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      stars = []; var n = Math.round(W * H / (opts.density || 3800));
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * (opts.band || 1), r: Math.random() < .06 ? 1.3 + Math.random() : .35 + Math.random() * .7, p: Math.random() * 6.3, s: .5 + Math.random() * 1.6, c: Math.random() < .12 ? "200,220,255" : Math.random() < .08 ? "255,214,180" : "255,250,240" });
    }
    function spawn() {
      var fromLeft = Math.random() < .5, ang = (fromLeft ? 1 : -1) * (0.38 + Math.random() * 0.3);
      var sp = W * (0.55 + Math.random() * 0.45);
      mets.push({ x: (opts.at ? opts.at.x : (fromLeft ? Math.random() * W * .55 : W * .45 + Math.random() * W * .55)), y: (opts.at ? opts.at.y : Math.random() * H * .18),
        vx: Math.sin(ang) * sp, vy: Math.cos(Math.abs(ang)) * sp * .55, life: 0, dur: .9 + Math.random() * .9, len: 90 + Math.random() * 140,
        flareAt: .62 + Math.random() * .16, sparks: [], train: [] });
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      var t = performance.now() / 1000;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], a = .45 + .55 * Math.sin(t * s.s + s.p) * .5 + .25;
        ctx.fillStyle = "rgba(" + s.c + "," + Math.max(0, Math.min(1, a)) + ")";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      next -= dt; if (next <= 0 && !reduce) { spawn(); if (Math.random() < .35) spawn(); next = (opts.every || 4) * (.4 + Math.random() * .8); }
      var sctx = ctx; if (mctx) { mctx.clearRect(0, 0, W, H); ctx = mctx; }
      ctx.globalCompositeOperation = "lighter";
      for (var m = mets.length - 1; m >= 0; m--) {
        var M = mets[m]; M.life += dt; var p = M.life / M.dur;
        if (p > 1.6) { mets.splice(m, 1); continue; }
        if (p <= 1) { M.x += M.vx * dt; M.y += M.vy * dt; M.train.push({ x: M.x, y: M.y, a: 1 }); }
        // brightness curve: faint entry -> builds -> one flare -> burn-out
        var b = p < M.flareAt ? lerp(.25, .85, p / M.flareAt) : p < M.flareAt + .08 ? 1.6 : p <= 1 ? lerp(1, 0, (p - M.flareAt - .08) / (1 - M.flareAt - .08)) : 0;
        // colour: white-blue (hot) -> orange-red flame at the flare -> deep red ember as it dies
        var hot = p < M.flareAt ? 0 : Math.min(1, (p - M.flareAt) / .25);
        var cr = Math.round(lerp(225, 255, hot)), cg = Math.round(lerp(238, 96, hot)), cb = Math.round(lerp(255, 40, hot));
        var vlen = Math.hypot(M.vx, M.vy), ux = M.vx / vlen, uy = M.vy / vlen, L = M.len * (p <= 1 ? Math.min(1, p * 3) : 0);
        if (b > 0) {
          var g = ctx.createLinearGradient(M.x, M.y, M.x - ux * L, M.y - uy * L);
          g.addColorStop(0, "rgba(" + cr + "," + cg + "," + cb + "," + Math.min(1, b) + ")");
          g.addColorStop(.25, "rgba(" + cr + "," + Math.round(cg * .8) + "," + Math.round(cb * .7) + "," + (b * .35) + ")");
          g.addColorStop(1, "rgba(120,140,200,0)");
          ctx.strokeStyle = g; ctx.lineWidth = 1.2 + b * 1.1; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(M.x, M.y); ctx.lineTo(M.x - ux * L, M.y - uy * L); ctx.stroke();
          var hr = 1.2 + b * (p > M.flareAt && p < M.flareAt + .1 ? 7 : 2.2), hg = ctx.createRadialGradient(M.x, M.y, 0, M.x, M.y, hr * 3);
          hg.addColorStop(0, "rgba(255,255,255," + Math.min(1, b) + ")"); hg.addColorStop(.3, "rgba(" + cr + "," + cg + "," + cb + "," + (b * .5) + ")"); hg.addColorStop(1, "rgba(" + cr + "," + cg + "," + cb + ",0)");
          ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(M.x, M.y, hr * 3, 0, 6.283); ctx.fill();
        }
        // fragments shed at the flare
        if (p > M.flareAt && !M.shed) { M.shed = 1; for (var k = 0; k < 5 + (Math.random() * 4 | 0); k++) M.sparks.push({ x: M.x, y: M.y, vx: M.vx * (.25 + Math.random() * .35) + (Math.random() - .5) * 60, vy: M.vy * (.25 + Math.random() * .35) + (Math.random() - .5) * 60, l: 0, d: .25 + Math.random() * .45 }); }
        for (var q = M.sparks.length - 1; q >= 0; q--) {
          var S = M.sparks[q]; S.l += dt; if (S.l > S.d) { M.sparks.splice(q, 1); continue; }
          S.x += S.vx * dt; S.y += S.vy * dt; var sa = 1 - S.l / S.d;
          ctx.fillStyle = "rgba(255," + Math.round(lerp(150, 60, 1 - sa)) + ",40," + sa + ")"; ctx.beginPath(); ctx.arc(S.x, S.y, .6 + sa, 0, 6.283); ctx.fill();
        }
        // faint persistent train (ionized air) that fades after the burn-out
        ctx.strokeStyle = "rgba(140,170,255,.05)"; ctx.lineWidth = 1;
        if (M.train.length > 2) { ctx.beginPath(); ctx.moveTo(M.train[0].x, M.train[0].y); for (var z = 1; z < M.train.length; z++) ctx.lineTo(M.train[z].x, M.train[z].y); ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p - .9) * 1.4); ctx.stroke(); ctx.globalAlpha = 1; }
      }
      ctx.globalCompositeOperation = "source-over"; ctx = sctx;
    }
    size(); addEventListener("resize", size);
    if (opts.clickHost) opts.clickHost.addEventListener("click", function (e) {
      if (e.target.closest("a,button,input,textarea,iframe")) return;
      var r = canvas.getBoundingClientRect(); opts.at = { x: e.clientX - r.left, y: e.clientY - r.top }; spawn(); opts.at = null; });
    new IntersectionObserver(function (e) { on = e[0].isIntersecting; }).observe(canvas);
    var last = performance.now();
    (function loop(now) { requestAnimationFrame(loop); var dt = Math.min(.05, (now - last) / 1000); last = now; if (on) draw(dt); })(last);
  }
  /* sky + streaks now come from /revival/space/space-kit.js (shared AMH space kit) */

  /* easter egg (kept from the old site): tap the logo 5x */
  var taps = 0, tt = 0, brand = document.querySelector(".brand");
  if (brand) brand.addEventListener("click", function () {
    clearTimeout(tt); taps++; tt = setTimeout(function () { taps = 0; }, 900);
    if (taps >= 5) { taps = 0; var d = document.createElement("div"); d.className = "egg"; d.textContent = "Happiest place in the US. Founded in Fremont, CA."; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3200); }
  });
})();
/* footer: sharpen the photo only when you're almost at the bottom */
(function(){var f=document.querySelector('.footer');if(!f)return;var raf=0;
function t(){raf=0;var left=document.documentElement.scrollHeight-(scrollY+innerHeight);f.classList.toggle('sharp',left<160)}
addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(t)},{passive:true});addEventListener('resize',t);t()})();
/* showcase viewer: tap a phone -> big phone frame with the live, scrollable site (or a scroll-through video
   for sites that block embedding) + Visit site. No AI anywhere, just the real pages. */
(function(){var v=document.getElementById('viewer');if(!v)return;var scr=document.getElementById('vScreen'),T=document.getElementById('vT'),M=document.getElementById('vMode'),Hn=document.getElementById('vHint'),Vi=document.getElementById('vVisit');
function close(){v.hidden=true;scr.innerHTML='';document.body.classList.remove('modal-open')}
document.querySelectorAll('.phone[data-site]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();
  var live=a.dataset.mode==='live';T.textContent=a.dataset.name;Vi.href=a.dataset.site;M.textContent=live?'Live site':'Scroll-through';Hn.textContent=live?'Scroll right inside the phone, tap anything.':'This site plays its own scroll-through here. Visit to use it.';
  scr.innerHTML=live?'<iframe src="'+a.dataset.site+'" title="'+a.dataset.name+'" loading="eager"></iframe>':'<video src="'+a.dataset.video+'" autoplay muted loop playsinline></video>';
  v.hidden=false;document.body.classList.add('modal-open')})});
v.addEventListener('click',function(e){if(e.target===v||e.target.closest('.viewer-x'))close()});addEventListener('keydown',function(e){if(e.key==='Escape'&&!v.hidden)close()})})();
/* scale the 390px live site to the phone frame */
(function(){function fit(){var s=document.getElementById('vScreen');if(!s)return;document.documentElement.style.setProperty('--vs',(s.clientWidth/390).toFixed(4))}addEventListener('resize',fit);new MutationObserver(fit).observe(document.getElementById('viewer')||document.body,{attributes:true});fit()})();

/* Jubber for Site Revival: scripted helper (no AI). Booking a talk sends a real request to AMH through /api/intake
   and offers a Google Calendar link; nothing else touches the network. Floats anywhere on the page. */
(function () {
  'use strict';
  var root = document.getElementById('jd'), list = document.getElementById('jdList');
  if (!root || !list) return;
  var state = { topic: '', jokes: 0, booked: null };
  var foot = document.getElementById('jdFoot'), chips = document.getElementById('jdChips');
  var actions = ['Plan a site or app', 'Book a talk', 'Prices', 'Free preview', 'Ask me a joke', 'Hours'];
  var jokes = ['Why did the website go to therapy? Too many unresolved issues… and a 404 in its past.', 'My code and I have a deal: it works on Fridays, I don’t touch it on Fridays.', 'Why was the button so calm? It had great padding.', 'A designer walks into a bar. Moves it two pixels left.'];
  var HOURS = { weekday: [9, 19], weekend: [11, 18] }; // Pacific time; Mon–Fri 9–7, Sat–Sun 11–6
  var TZ = 'America/Los_Angeles';
  var css = document.createElement('style');
  css.textContent = '#jd{max-width:100%;min-width:0}#jd .jd-chiprow{display:flex;flex-wrap:wrap;gap:6px;overflow:visible;white-space:normal;mask-image:none;-webkit-mask-image:none}' +
    '#jd .jd-chiprow button,#jd .jd-options button,#jd .jd-options a{font:inherit;white-space:nowrap;color:inherit;background:#182c26;border:1px solid #456651;border-radius:999px;padding:8px 11px;cursor:pointer;min-height:40px;text-decoration:none;display:inline-flex;align-items:center}' +
    '#jd button:focus-visible,#jd input:focus-visible,#jd select:focus-visible,#jd a:focus-visible{outline:2px solid #c9f05a;outline-offset:2px}#jd .jd-chiprow button.hot{border-color:#c9f05a;box-shadow:0 0 0 1px #c9f05a inset}' +
    '#jd .jd-options{display:flex;flex-wrap:wrap;gap:6px;padding:6px 12px}#jd .jd-msg{white-space:pre-line}' +
    '#jd .jd-form{display:grid;gap:7px;width:100%;padding:10px;border:1px solid #456651;border-radius:14px;background:#10201b}#jd .jd-form label{display:grid;gap:3px;font-size:12px;color:#b9d6c4}' +
    '#jd .jd-form input,#jd .jd-form select{font:inherit;font-size:15px;color:#eaffef;background:#0b1713;border:1px solid #3c5a48;border-radius:10px;padding:9px 10px;min-height:42px;width:100%;box-sizing:border-box}' +
    '#jd .jd-form .row{display:grid;grid-template-columns:1fr 1fr;gap:7px}#jd .jd-form button[type=submit]{background:#c9f05a;color:#0b1408;border:0;font-weight:800;justify-content:center}#jd .jd-form .err{color:#ffb4a2;font-size:13px;min-height:1em}' +
    '#jd a.jd-cal{background:#c9f05a;color:#0b1408;border:0;font-weight:800}' +
    '#jd.jd-float{position:fixed;right:18px;bottom:18px;z-index:2147483000;width:min(390px,calc(100vw - 24px));max-height:min(78vh,720px);overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.6);margin:0}' +
    '@media(max-width:720px){#jd.jd-float{left:8px;right:8px;width:auto;bottom:86px;max-height:72vh}}' +
    '.jd-fab{position:fixed;right:14px;bottom:14px;z-index:2147482999;width:78px;height:78px;border:0;background:none;padding:0;cursor:grab;display:none;touch-action:none;-webkit-tap-highlight-color:transparent}' +
    '.jd-fab.show{display:block}.jd-fab img{width:78px;height:78px;object-fit:contain;animation:jubBob 3.2s ease-in-out infinite;pointer-events:none}.jd-fab.drag{cursor:grabbing}.jd-fab.drag img{animation:none}' +
    '.jd-fab span{position:absolute;right:84px;top:26px;white-space:nowrap;font:700 12px/1 system-ui;color:#eaffef;background:#0b1713e6;border:1px solid #456651;border-radius:999px;padding:7px 10px;pointer-events:none}' +
    '@media(max-width:720px){.jd-fab{bottom:82px;right:10px;width:66px;height:66px}.jd-fab img{width:66px;height:66px}.jd-fab span{display:none}}@media(prefers-reduced-motion:reduce){.jd-fab img{animation:none}}';
  document.head.appendChild(css);
  root.removeAttribute('role');
  list.setAttribute('role', 'log'); list.setAttribute('aria-live', 'polite'); list.setAttribute('aria-label', 'Chat with Jubber');
  var sub = root.querySelector('.jd-top small'); if (sub) sub.textContent = 'Site Revival helper · replies instantly';
  var proof = root.querySelector('.jd-proof'); if (proof) proof.textContent = 'Plan a build, see prices, or book a talk with Austin';
  var fakeTs = root.querySelector('.jd-ts'); if (fakeTs) fakeTs.remove();
  // Topic dots: one per top button; the lit dot follows the topic you are on.
  var dots = document.getElementById('jdDots');
  if (dots) { dots.replaceChildren(); dots.setAttribute('aria-hidden', 'true'); for (var di = 0; di < 6; di++) dots.appendChild(document.createElement('i')); }
  function mark(k) { if (dots) Array.prototype.forEach.call(dots.children, function (x, j) { x.classList.toggle('on', j === k); }); }
  var oldField = root.querySelector('.jd-field'), input = document.createElement('input');
  input.className = 'jd-field'; input.placeholder = 'Ask about a site, app, price or a time…'; input.maxLength = 300;
  input.setAttribute('aria-label', 'Message Jubber'); if (oldField) oldField.replaceWith(input);
  var close = document.createElement('button'); close.type = 'button'; close.className = 'jd-x'; close.textContent = '×'; close.setAttribute('aria-label', 'Close chat');
  var oldX = root.querySelector('.jd-x'); if (oldX) oldX.replaceWith(close);
  var launcher = document.getElementById('jubReplay');
  var talk = document.getElementById('jdTalk'); if (talk) talk.textContent = 'Send';
  var options = document.createElement('div'); options.className = 'jd-options'; list.after(options);

  // Floating bubble: available anywhere on the page; opens the same chat as a floating panel.
  var fab = document.createElement('button'); fab.type = 'button'; fab.className = 'jd-fab'; fab.setAttribute('aria-label', 'Chat with Jubber');
  fab.innerHTML = '<img src="/revival/assets/jubber.webp?v=2" alt=""><span>Chat with Jubber</span>';
  document.body.appendChild(fab);
  var home = document.getElementById('jubber') || root.parentElement, inView = false;
  function syncFab() { fab.classList.toggle('show', !inView && !(root.classList.contains('jd-float') && !root.hidden)); }
  if ('IntersectionObserver' in window && home) new IntersectionObserver(function (e) { inView = e[0].isIntersecting; if (inView && root.classList.contains('jd-float')) { root.classList.remove('jd-float'); } syncFab(); }, { threshold: 0.15 }).observe(home);
  else { inView = false; syncFab(); }
  function openFloat() { root.classList.add('jd-float'); root.hidden = false; syncFab(); input.focus({ preventScroll: true }); }
  // Drag him anywhere (he stays there for this visit). One tap opens the chat, two = flip, three = rush around.
  var drag = null, taps = 0, tapTimer = 0, rushing = false;
  fab.addEventListener('pointerdown', function (e) { if (rushing) return; var r = fab.getBoundingClientRect(); drag = { x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false }; fab.setPointerCapture(e.pointerId); });
  fab.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    drag.moved = true; fab.classList.add('drag');
    var w = fab.offsetWidth, h = fab.offsetHeight, x = Math.min(Math.max(4, e.clientX - drag.dx), innerWidth - w - 4), y = Math.min(Math.max(60, e.clientY - drag.dy), innerHeight - h - 4);
    fab.style.left = x + 'px'; fab.style.top = y + 'px'; fab.style.right = 'auto'; fab.style.bottom = 'auto';
  });
  fab.addEventListener('pointerup', function () {
    if (!drag) return; var moved = drag.moved; drag = null; fab.classList.remove('drag');
    if (moved) return;
    taps++; clearTimeout(tapTimer);
    if (taps >= 3) { taps = 0; rush(); return; }
    tapTimer = setTimeout(function () { var n = taps; taps = 0; if (n === 2) flip(); else if (n === 1) openFloat(); }, 320);
  });
  fab.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFloat(); } });
  // Moves reused from Austin's Jubber UI v5 (code/amh-hive/assets/jubber-ue/jubber-ui-v5.js):
  // double tap = his rotateY flip; triple tap = his lap of the screen corners, then the 720° spin home.
  var FLIP = [
    { transform: 'translateY(0) rotateY(0) scale(1)' },
    { transform: 'translateY(4px) rotateY(0) scale(1.08,.9)', offset: .15 },
    { transform: 'translateY(-15px) rotateY(180deg) scale(.94,1.08)', offset: .48 },
    { transform: 'translateY(1px) rotateY(360deg) scale(1.04,.96)', offset: .82 },
    { transform: 'translateY(0) rotateY(360deg) scale(1)' }];
  function still() { return rushing || matchMedia('(prefers-reduced-motion: reduce)').matches || !fab.animate; }
  function flip() { if (still()) return; rushing = true; fab.animate(FLIP, { duration: 1800, easing: 'ease-in-out' }).onfinish = function () { rushing = false; }; }
  function rush() {
    if (still()) return;
    rushing = true;
    var r = fab.getBoundingClientRect(), x0 = 4 - r.left, x1 = innerWidth - r.width - 4 - r.left, y0 = 64 - r.top, y1 = innerHeight - r.height - 4 - r.top;
    var tl = [x0, y0], tr = [x1, y0], br = [x1, y1], bl = [x0, y1], pts = [[0, 0], tl, tr, br, bl, tl, bl, br, tr, tl, [0, 0]];
    var dur = [240, 230, 250, 230, 250, 210, 230, 250, 230, 250], total = dur.reduce(function (a, b) { return a + b; }, 0), t = 0, frames = [];
    pts.forEach(function (pt, i) { frames.push({ transform: 'translate(' + pt[0] + 'px,' + pt[1] + 'px)', offset: Math.min(1, t / total) }); if (i < dur.length) t += dur[i]; });
    fab.animate(frames, { duration: total, easing: 'linear' }).onfinish = function () {
      fab.animate([
        { transform: 'scale(1) rotate(0)' },
        { transform: 'scale(1.12,.86) rotate(-14deg)', offset: .18 },
        { transform: 'translateY(-14px) scale(.9,1.12) rotate(360deg)', offset: .62 },
        { transform: 'scale(1) rotate(720deg)' }], { duration: 850, easing: 'cubic-bezier(.22,.78,.25,1)' }).onfinish = function () { rushing = false; };
    };
  }

  close.onclick = function () { var wasFloat = root.classList.contains('jd-float'); root.classList.remove('jd-float'); if (wasFloat) { syncFab(); fab.focus(); } else { root.hidden = true; if (launcher) launcher.focus(); } };
  if (launcher) { launcher.setAttribute('aria-label', 'Open Jubber chat'); launcher.setAttribute('aria-controls', 'jd'); launcher.onclick = function () { root.hidden = false; input.focus(); }; }

  function message(who, text) { var el = document.createElement('div'); el.className = 'jd-msg ' + who; el.textContent = text; list.appendChild(el); while (list.children.length > 60) list.firstElementChild.remove(); list.scrollTop = list.scrollHeight; }
  function choices(items) { options.replaceChildren(); items.forEach(function (it) { var b; if (typeof it === 'string' && actions.indexOf(it) !== -1) return; if (typeof it === 'string') { b = document.createElement('button'); b.type = 'button'; b.textContent = it; b.onclick = function () { respond(it); }; } else { b = it; } options.appendChild(b); }); }
  function linkBtn(label, href, cls) { var a = document.createElement('a'); a.href = href; a.textContent = label; if (cls) a.className = cls; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; } return a; }
  function goTo(id) { var el = document.getElementById(id); if (el) { root.classList.remove('jd-float'); syncFab(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
  function jumpBtn(label, id) { var b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = function () { goTo(id); }; return b; }

  // Pacific-time helpers for the booking form.
  function ptParts(d) { var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; }); return p; }
  function todayPT() { var p = ptParts(new Date()); return p.year + '-' + p.month + '-' + p.day; }
  function dayHours(iso) { var wd = new Date(iso + 'T12:00:00Z').getUTCDay(); return wd === 0 || wd === 6 ? HOURS.weekend : HOURS.weekday; }
  function fmtTime(h, m) { var ap = h >= 12 ? 'PM' : 'AM', hh = h % 12 || 12; return hh + ':' + (m < 10 ? '0' : '') + m + ' ' + ap; }
  function slotsFor(iso) {
    var hrs = dayHours(iso), out = [], now = ptParts(new Date()), isToday = iso === todayPT(), nowMin = (+now.hour) * 60 + (+now.minute);
    for (var t = hrs[0] * 60; t + 30 <= hrs[1] * 60; t += 30) if (!isToday || t >= nowMin + 60) out.push(t);
    return out;
  }
  function openNow() { var p = ptParts(new Date()), wd = p.weekday, hrs = (wd === 'Sat' || wd === 'Sun') ? HOURS.weekend : HOURS.weekday, m = (+p.hour) * 60 + (+p.minute); return m >= hrs[0] * 60 && m < hrs[1] * 60; }
  // Google Calendar wants UTC times; convert a Pacific wall-clock time with the zone offset of that day.
  function ptToUtc(iso, minutes) {
    var guess = new Date(iso + 'T' + String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0') + ':00Z');
    var p = ptParts(guess), asPT = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    return new Date(guess.getTime() + (guess.getTime() - asPT));
  }
  function gcalStamp(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }

  function bookingForm() {
    var f = document.createElement('form'); f.className = 'jd-form'; f.noValidate = true;
    var minD = todayPT(), maxD = new Date(Date.now() + 45 * 864e5).toISOString().slice(0, 10);
    f.innerHTML = '<label>Your name<input name="name" autocomplete="name" required maxlength="80"></label>' +
      '<label>Email<input name="email" type="email" autocomplete="email" required maxlength="120"></label>' +
      '<div class="row"><label>Business or project<input name="company" autocomplete="organization" required maxlength="100"></label>' +
      '<label>Phone (optional)<input name="phone" type="tel" autocomplete="tel" maxlength="30"></label></div>' +
      '<label>Current site (optional)<input name="website" inputmode="url" placeholder="yoursite.com" maxlength="200"></label>' +
      '<label>Talk about<select name="topic"><option>A new website</option><option>A web app</option><option>Redesign my current site</option><option>A game or something else</option></select></label>' +
      '<div class="row"><label>Day<input name="day" type="date" min="' + minD + '" max="' + maxD + '" required></label><label>Time (Pacific)<select name="time" required></select></label></div>' +
      '<p class="err" aria-live="assertive"></p><button type="submit">Send request to Austin</button>';
    var day = f.elements.day, time = f.elements.time, err = f.querySelector('.err');
    if (state.topic) Array.prototype.forEach.call(f.elements.topic.options, function (o) { if (o.textContent === state.topic) o.selected = true; });
    function fillTimes() {
      time.replaceChildren();
      var s = day.value ? slotsFor(day.value) : [];
      if (!day.value) { time.add(new Option('Pick a day first', '')); return; }
      if (!s.length) { time.add(new Option('No times left that day', '')); return; }
      s.forEach(function (t) { time.add(new Option(fmtTime(Math.floor(t / 60), t % 60), String(t))); });
    }
    day.addEventListener('change', fillTimes);
    var first = minD; if (!slotsFor(first).length) first = new Date(new Date(minD + 'T12:00:00Z').getTime() + 864e5).toISOString().slice(0, 10);
    day.value = first; fillTimes();
    f.addEventListener('submit', async function (e) {
      e.preventDefault(); err.textContent = '';
      var v = Object.fromEntries(new FormData(f).entries());
      if (!v.name.trim() || !v.company.trim()) { err.textContent = 'Add your name and business or project.'; return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) { err.textContent = 'That email doesn’t look right.'; return; }
      if (!v.day || !v.time) { err.textContent = 'Pick a day and a time.'; return; }
      var mins = +v.time, when = new Date(v.day + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }) + ' at ' + fmtTime(Math.floor(mins / 60), mins % 60) + ' Pacific';
      var btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Sending…';
      try {
        var res = await fetch('/api/intake', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
          company: v.company.trim(), website: v.website.trim() || 'No site yet', email: v.email.trim(), phone: v.phone.trim(),
          message: 'Jubber call request\nTopic: ' + v.topic + '\nWhen: ' + when + ' (30 min)\nName: ' + v.name.trim() + '\nBooked from the Jubber chat on amhsiterevival.com' }) });
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok || !data.ok) throw new Error(data.error || 'send failed');
        var start = ptToUtc(v.day, mins), end = new Date(start.getTime() + 30 * 60000);
        var cal = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Talk with Austin · AMH Site Revival') +
          '&dates=' + gcalStamp(start) + '/' + gcalStamp(end) + '&ctz=' + encodeURIComponent(TZ) +
          '&details=' + encodeURIComponent('Topic: ' + v.topic + '\nAustin will reach you at ' + v.email.trim() + (v.phone.trim() ? ' or ' + v.phone.trim() : '') + ' to confirm.\nhttps://www.amhsiterevival.com/') + '&location=' + encodeURIComponent('Phone or video call');
        state.booked = { when: when, topic: v.topic, cal: cal };
        message('bot', 'Sent! Austin has your request for ' + when + ' about ' + v.topic.toLowerCase() + '. He’ll email ' + v.email.trim() + ' to confirm.\nAdd it to your Google Calendar so you don’t miss it:');
        choices([linkBtn('Add to Google Calendar', cal, 'jd-cal'), 'Prices', 'Free preview']);
      } catch (x) {
        btn.disabled = false; btn.textContent = 'Send request to Austin';
        err.textContent = 'Couldn’t send just now. Email amh@artificialmindhive.com and Austin will set it up.';
      }
    });
    return f;
  }

  // Checked first: monthly hosting / updates questions (answered under Prices, so the Prices dot lights).
  var MONTHLY = /monthly|hosting|maintain|maintenance|updates?\b|own \.?com|domain/;
  var TOPICS = [/plan|site or app|build|website|web app|app\b|redesign|game/, /book|talk|call|schedule|appointment|meet/, /price|cost|how much|\$|basic|premium/, /preview|free/, /joke/, /hours|open|time/];
  function respond(raw) {
    var text = String(raw).trim(); if (!text) return;
    message('me', text); input.value = ''; var q = text.toLowerCase();
    chips.querySelectorAll('button').forEach(function (b) { b.classList.toggle('hot', b.textContent === text); });
    choices([]);
    var k = -1; if (MONTHLY.test(q)) k = 6; else for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].test(q)) { k = i; break; }
    if (/^(a new website|a web app|redesign my current site|a game or something else)$/.test(q)) k = -2;
    if (k >= 0) mark(k === 6 ? 2 : k);
    if (k === -2) { state.topic = text; mark(0); message('bot', text + ' — got it. Austin builds it, you see a private preview first, and you only pay when you want it live. Want to talk it through?'); choices(['Book a talk', 'Prices', 'Free preview']); }
    else if (k === 1) { message('bot', state.booked ? 'You already asked for ' + state.booked.when + '. Want another time? Fill this in again.' : 'Let’s set up a 30-minute talk with Austin. Pick a time that works (Mon–Fri 9–7, Sat–Sun 11–6 Pacific):'); choices([bookingForm()]); }
    else if (k === 0) { message('bot', 'What are you thinking about building?'); choices(['A new website', 'A web app', 'Redesign my current site', 'A game or something else']); }
    else if (k === 2) { message('bot', 'Two tiers, and you pay only when it’s ready:\n• Basic $499: a sharper rebuild of your pages, phone-first with a call/map bar and SEO basics.\n• Premium $999: everything in Basic plus new pages, clearer packages and scroll/film-style motion.\nApps and bigger builds are quoted after a quick talk.\nMonthly plans keep it live and updated: $99/month on an AMH address, or $159/month on your own .com.'); choices(['Monthly plans', 'Book a talk', 'Free preview', jumpBtn('See pricing', 'pricing')]); }
    else if (k === 6) { message('bot', 'Monthly hosting and updates:\n• $99/month: your site live on an AMH address.\n• $159/month: live on your own .com.\nBoth include updates whenever you want them: tell us here, or email the changes and pictures. Your email gets read, the AI drafts the change, and the team checks it and puts it live.'); choices(['Book a talk', 'Prices', 'Free preview']); }
    else if (k === 3) { message('bot', 'Send your current site and the changes you want. Austin builds a private preview first, so you see the better version before paying anything. No card needed.'); choices([jumpBtn('Send my site', 'submit'), 'Book a talk']); }
    else if (k === 4) { message('bot', jokes[state.jokes++ % jokes.length] + ' 😄'); choices(['Ask me a joke', 'Plan a site or app', 'Book a talk']); }
    else if (k === 5) { message('bot', 'Austin takes calls Mon–Fri 9 AM–7 PM and Sat–Sun 11 AM–6 PM (Pacific). ' + (openNow() ? 'He’s in right now.' : 'He’s out right now, but you can book a time.') + ' I’m here any time.'); choices(['Book a talk', 'Plan a site or app']); }
    else { message('bot', 'I can help you plan a website or app, show prices, start a free preview, or book a talk with Austin.'); choices(['Plan a site or app', 'Book a talk', 'Prices']); }
    if (foot) foot.textContent = 'Booking sends your request to Austin · nothing is charged';
  }
  chips.replaceChildren(); actions.forEach(function (label) { var b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = function () { respond(label); }; chips.appendChild(b); });
  if (talk) talk.onclick = function () { respond(input.value); };
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); respond(input.value); } });
  // Phones: the site's fixed bottom bar can cover the input; bring it into clear view when typing starts.
  input.addEventListener('focus', function () { if (root.classList.contains('jd-float')) return; var r = input.getBoundingClientRect(); if (r.bottom > innerHeight - 96 || r.top < 80) input.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape') close.click(); });
  var reset = document.createElement('button'); reset.type = 'button'; reset.className = 'jd-reset'; reset.textContent = 'Start over'; root.appendChild(reset);
  function start() { state = { topic: '', jokes: 0, booked: null }; mark(0); list.replaceChildren(); choices([]); input.value = ''; if (foot) foot.textContent = 'Booking sends your request to Austin · nothing is charged'; chips.querySelectorAll('button').forEach(function (b) { b.classList.remove('hot'); }); message('bot', 'Hey! I’m Jubber from AMH Site Revival. Want to plan a website or app, see prices, or book a talk with Austin?'); choices(['Plan a site or app', 'Book a talk', 'Prices']); }

  // Color picker: same Jubber and UI, recolored by shifting hue (default green, then blue, red, yellow).
  // Matched chat palettes per color (green = the original look, so no overrides).
  var THEMES = {
    blue: { a1: '#6fc3ff', a2: '#2f8cff', chip: '#13233a', line: '#35577e', h1: '#0d1c30', h2: '#08111d', me1: '#a8dcff', me2: '#4aa8ff', bot: '#14223a', sub: '#9db8d6' },
    orange: { a1: '#ffb45a', a2: '#ff8a1f', chip: '#2b1d11', line: '#6b4a2c', h1: '#2a1808', h2: '#170d05', me1: '#ffd6a0', me2: '#ffa04a', bot: '#2a1a0d', sub: '#d6b48f' },
    red: { a1: '#ff7a7a', a2: '#ff3d3d', chip: '#2c1414', line: '#6b3434', h1: '#2a0c0c', h2: '#170606', me1: '#ffb8b8', me2: '#ff5c5c', bot: '#2a1212', sub: '#d69a9a' },
    grey: { a1: '#d6dbe0', a2: '#9aa3ab', chip: '#1f2326', line: '#4a5056', h1: '#1b1e21', h2: '#101214', me1: '#eef1f3', me2: '#b9c1c8', bot: '#202427', sub: '#b0b7bd' },
    yellow: { a1: '#ffe066', a2: '#ffc929', chip: '#29240f', line: '#6b5f2c', h1: '#2a250a', h2: '#171405', me1: '#fff1a8', me2: '#ffd84a', bot: '#29240e', sub: '#d6cc92' }
  };
  var COLORS = [['green', 'Green', 0, '#7dff6a'], ['blue', 'Blue', 128, '#4f8dff'], ['orange', 'Orange', -55, '#ff9a3d'], ['red', 'Red', -82, '#ff4d4d'], ['grey', 'Grey', 'grey', '#a9b0b6'], ['yellow', 'Yellow', -28, '#ffd23f']];
  var picker = document.createElement('div'); picker.className = 'jd-colors'; picker.setAttribute('role', 'radiogroup'); picker.setAttribute('aria-label', 'Jubber color');
  picker.setAttribute('data-open', 'false');
  var themeCss = document.createElement('style'); document.head.appendChild(themeCss);
  function applyColor(key) {
    var c = COLORS.filter(function (x) { return x[0] === key; })[0] || COLORS[0], f = c[2] === 'grey' ? 'grayscale(1) brightness(1.08)' : c[2] ? 'hue-rotate(' + c[2] + 'deg)' : 'none';
    root.setAttribute('data-jc', c[0]);
    // Jubber's picture keeps its see-through jelly look (hue shift only on the image); the chat gets a matched palette.
    var t = THEMES[c[0]], g = f === 'none' ? '' : ' ' + f, css = '#jd img:not(.jd-colors img){filter:' + f + '}.jd-fab img{filter:drop-shadow(0 10px 14px rgba(0,0,0,.5))' + g + '}#jubReplay .jub-img,.jub-img{filter:drop-shadow(0 22px 26px rgba(0,0,0,.55))' + g + '}.jub-glow{filter:blur(6px)' + g + '}';
    if (t) css += '#jd{border-color:' + t.line + '}#jd .jd-top{background:linear-gradient(135deg,' + t.h1 + ',' + t.h2 + ');border-bottom-color:' + t.line + '}' +
      '#jd .jd-top small,#jd .jd-foot,#jd .jd-x{color:' + t.sub + '}#jd .jd-foot,#jd .jd-input{border-top-color:' + t.line + '}' +
      '#jd .jd-msg.bot{background:' + t.bot + '}#jd .jd-msg.me{background:linear-gradient(135deg,' + t.me1 + ',' + t.me2 + ');color:#07090b}' +
      '#jd .jd-talk,#jd .jd-form button[type=submit],#jd a.jd-cal{background:linear-gradient(135deg,' + t.a1 + ',' + t.a2 + ');color:#0a0a0a;box-shadow:0 6px 18px ' + t.a1 + '4d}' +
      '#jd .jd-chiprow button,#jd .jd-options button,#jd .jd-options a{background:' + t.chip + ';border-color:' + t.line + '}' +
      '#jd .jd-chiprow button.hot{border-color:' + t.a1 + ';box-shadow:0 0 0 1px ' + t.a1 + ' inset}#jd .jd-dots i{background:' + t.a1 + '40}#jd .jd-dots i.on{background:' + t.a1 + '}' +
      '#jd .jd-field,#jd .jd-form,#jd .jd-form input,#jd .jd-form select{border-color:' + t.line + '}#jd .jd-colors[data-open=true]{background:' + t.h1 + '}' +
      '.jd-fab{border-color:' + t.a1 + '66;box-shadow:0 0 22px ' + t.a1 + '55,0 10px 30px rgba(0,0,0,.5)}';
    themeCss.textContent = css;
    Array.prototype.forEach.call(picker.querySelectorAll('button'), function (b) { b.setAttribute('aria-checked', String(b.dataset.c === c[0])); });
    picker.setAttribute('data-open', 'false');
  }
  COLORS.forEach(function (c) { var b = document.createElement('button'); b.type = 'button'; b.dataset.c = c[0]; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', c[1] + ' Jubber (tap to change color)'); b.title = c[1] + ' Jubber'; var im = document.createElement('img'); im.src = '/revival/assets/jubber.webp?v=2'; im.alt = ''; im.style.filter = c[2] === 'grey' ? 'grayscale(1) brightness(1.08)' : c[2] ? 'hue-rotate(' + c[2] + 'deg)' : 'none'; b.appendChild(im); b.onclick = function (e) { e.stopPropagation(); if (picker.getAttribute('data-open') !== 'true') { picker.setAttribute('data-open', 'true'); return; } applyColor(c[0]); }; picker.appendChild(b); });
  document.addEventListener('click', function (e) { if (!picker.contains(e.target)) picker.setAttribute('data-open', 'false'); });
  root.appendChild(picker);
  var cssColors = document.createElement('style');
  cssColors.textContent = '#jd .jd-arw{display:none}#jd:not(.jd-float){position:relative}' +
    '#jd .jd-colors{position:absolute;top:17px;right:44px;z-index:3;display:flex;flex-direction:row-reverse;gap:6px;padding:3px;border-radius:999px;transition:background .2s}' +
    '#jd .jd-colors[data-open=true]{left:58px;justify-content:flex-start;background:#121d0b;border-radius:12px;padding:6px 8px;top:10px}' +
    '#jd .jd-colors button{width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.18);padding:2px;cursor:pointer;flex:none;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.18),rgba(255,255,255,.03) 60%);display:grid;place-items:center}' +
    '#jd .jd-colors button img{width:24px;height:24px;object-fit:contain;opacity:.92;filter:none;pointer-events:none}' +
    '#jd .jd-colors[data-open=false] button[aria-checked=false]{display:none}' +
    '#jd .jd-colors button[aria-checked=true]{border-color:rgba(255,255,255,.75);box-shadow:0 0 10px rgba(255,255,255,.25)}' +
    '#jd .jd-dots i{width:9px;height:9px;opacity:.55;box-shadow:inset 0 -2px 3px rgba(0,0,0,.35),inset 0 2px 2px rgba(255,255,255,.55);transition:all .3s}' +
    '#jd .jd-dots i.on{width:22px;opacity:.95;box-shadow:inset 0 -2px 3px rgba(0,0,0,.3),inset 0 2px 3px rgba(255,255,255,.7),0 0 10px currentColor}';
  document.head.appendChild(cssColors);
  applyColor('green'); // every visit starts green; nothing is stored on the device
  reset.onclick = start; start(); syncFab();
})();

/* "Double-tap to play" button: one tap starts the game too */
(function(){var b=document.getElementById('playGame'),f=document.querySelector('.interstellar-frame');if(!b||!f)return;
b.addEventListener('click',function(){var w=f.contentWindow;f.scrollIntoView({behavior:'smooth',block:'end'});
  try{if(w&&w.__startGameAt&&!(w.__isGameActive&&w.__isGameActive()))w.__startGameAt(w.innerWidth/2,w.innerHeight*.7)}catch(e){}})})();
/* AMH badge power-up: header once on load (after a mid-screen intro on first visit), footer on first view + every 30s */
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var WT=[[24.2,18.3,-18],[75,17.1,18],[42.2,12.2,0],[58.5,12.2,0]];
  function kit(b){if(b.__kit)return;b.__kit=1;
    b.querySelectorAll('.tw').forEach(function(t,i){t.style.setProperty('--i',i);var d=Math.hypot(parseFloat(t.style.left)-50.9,parseFloat(t.style.top)-47.3);t.style.setProperty('--d',(d*.022).toFixed(2)+'s')});
    var h='<i class="eye"></i><i class="sw"></i>';
    WT.forEach(function(w){h+='<i class="wt" style="left:'+w[0]+'%;top:'+w[1]+'%;rotate:'+w[2]+'deg"></i>'});
    for(var k=0;k<12;k++)h+='<i class="sk" style="--a:'+(k*30+15)+'deg"></i>';
    b.insertAdjacentHTML('beforeend',h);var im=b.querySelector('img');if(im)im.insertAdjacentHTML('afterend','<i class="dk"></i><i class="fl"></i>');
    // v4 eye layers (badge-fx.css): outline + eyeball light passes, pupil glow, ring + eye-shield chase, electric arcs
    b.insertAdjacentHTML('beforeend','<i class="fx-dt"></i><i class="fx-ol"></i><i class="fx-ey"></i><i class="fx-pu"></i><svg class="fx-svg" viewBox="0 0 720 720" aria-hidden="true" focusable="false">'+
      '<circle class="fx-ring t" cx="360" cy="360" r="353" pathLength="100" transform="rotate(-90 360 360)"/><circle class="fx-ring" cx="360" cy="360" r="353" pathLength="100" transform="rotate(-90 360 360)"/>'+
      '<path class="fx-idl" d="'+SH+'" pathLength="100"/><path class="fx-idl a" d="'+AL+'" pathLength="100"/>'+
      '<path class="fx-sh" d="'+SH+'" pathLength="100"/><path class="fx-sh b" d="'+SH+'" pathLength="100"/><path class="fx-al" d="'+AL+'" pathLength="100"/><path class="fx-al b" d="'+AL+'" pathLength="100"/><g class="fx-arcs">'+new Array(9).join('<path/>')+'</g></svg>');
    b.__sh=b.querySelector('.fx-sh');
    // v5: the crisp beam is back (fires from the pupil after pulse 2) - not on the tiny header badge
    if(!b.classList.contains('sm'))amhMountEyeBeam(b,'amhBeam'+(++beamN))}
  var beamN=0;
  // eye shield outline (720px badge coords, traced off the pic)
  var SH='M366 282C370 292 375 300 380 307C393 313 405 322 406 336C407 355 396 371 386 385C377 397 370 408 366 417C362 408 355 397 346 385C336 371 325 355 326 336C327 322 339 313 352 307C357 300 362 292 366 282Z';
  var AL='M333 346Q366 310 399 346Q366 384 333 346Z'; // the almond eye
  function Q(x,y){return x.toFixed(1)+' '+y.toFixed(1)}
  // thin arcs that crawl along the eye shield (and now and then the outer ring); jagged, short-lived
  function shieldArc(b){var p=b.__sh,L=b.__shL||(b.__shL=p.getTotalLength()),s=Math.random()*L,len=L*(.08+Math.random()*.12),d='';
    for(var k=0;k<=8;k++){var q=p.getPointAtLength((s+len*k/8)%L),dx=q.x-366,dy=q.y-348,n=Math.hypot(dx,dy)||1,o=(k%8?(Math.random()*14-3):0)+3;d+=(k?'L':'M')+Q(q.x+dx/n*o,q.y+dy/n*o)}return d}
  function ringArc(){var a=Math.random()*6.283,len=.25+Math.random()*.45,d='';
    for(var k=0;k<=8;k++){var aa=a+len*k/8,r=353+(k%8?(Math.random()-.5)*22:0);d+=(k?'L':'M')+Q(360+Math.cos(aa)*r,360+Math.sin(aa)*r)}return d}
  function arcsAt(b,f){var g=b.querySelector('.fx-arcs');if(!g)return;
    var k=f<.08?0:f<.2?(f-.08)/.12:f<.42?1:f<.5?1-(f-.42)/.08:0;g.style.opacity=k>0?(k*(.65+Math.random()*.35)).toFixed(2):0;if(k<=0)return;
    [].forEach.call(g.children,function(p,i){var on=Math.random()<k*.85;p.setAttribute('class',i<6?'g':'');p.setAttribute('d',on?(i<6?shieldArc(b):ringArc()):'')})}
  window.__amhArcsAt=arcsAt;
  function arcs(b){var t0=performance.now(),last=0;(function f(now){var x=(now-t0)/6400;if(x>1||!b.classList.contains('pw')){arcsAt(b,1);return}
    requestAnimationFrame(f);if(now-last<55)return;last=now;arcsAt(b,x)})(t0)}
  function power(b){kit(b);b.classList.remove('pw','pw2');void b.offsetWidth;b.classList.add('pw');arcs(b);
    clearTimeout(b.__t);b.__t=setTimeout(function(){b.classList.remove('pw')},6500)}
  var head=document.querySelector('.brand .amh-badge'),foot=document.querySelector('.f-brand .amh-badge');
  var first=true; // every visit and every reload
  if(head)kit(head);
  if(head&&first){
    var o=document.createElement('div');o.id='amhIntro';o.setAttribute('aria-hidden','true');
    var tws=[].map.call(head.querySelectorAll('.tw'),function(t){return t.outerHTML}).join('');
    o.innerHTML='<span class="amh-badge"><img src="/revival/assets/amh-badge.webp?v=2" alt="">'+tws+'</span><small>Artificial Mind Hive<i>scroll or tap to enter</i></small>';
    document.body.appendChild(o);var big=o.querySelector('.amh-badge');head.style.visibility='hidden';
    var done=false;function land(){if(done)return;done=true;
      var a=big.getBoundingClientRect(),z=head.getBoundingClientRect();
      big.style.transform='translate('+(z.left+z.width/2-a.left-a.width/2)+'px,'+(z.top+z.height/2-a.top-a.height/2)+'px) scale('+(z.width/a.width)+')';
      o.classList.add('out');o.querySelector('small').style.opacity='0';
      setTimeout(function(){head.style.visibility='';o.remove()},780)}
    o.addEventListener('click',land);
    function start(){if(done)return;power(big);
    // plays the full power-up, then holds on the logo until the visitor moves (scroll, swipe, mouse, key)
    setTimeout(function(){if(done)return;o.classList.add('hold');var x0=null,y0=null;
      function go(){['wheel','scroll','touchmove','touchstart','keydown','pointermove'].forEach(function(t){removeEventListener(t,h,true)});land()}
      function h(e){if(e.type==='pointermove'&&e.pointerType==='mouse'){if(x0===null){x0=e.clientX;y0=e.clientY;return}if(Math.hypot(e.clientX-x0,e.clientY-y0)<30)return}go()}
      ['wheel','scroll','touchmove','touchstart','keydown','pointermove'].forEach(function(t){addEventListener(t,h,{capture:true,passive:true})})},6400)}
    var introImage=big.querySelector('img');
    if(introImage.complete)requestAnimationFrame(start);
    else{introImage.addEventListener('load',start,{once:true});introImage.addEventListener('error',start,{once:true})}
  }else if(head){setTimeout(function(){power(head)},350)}
  if(foot){kit(foot);var vis=false,seen=false;
    var replay=document.createElement('button');replay.type='button';replay.className='amh-replay';replay.textContent='Replay the eye';
    replay.setAttribute('aria-label','Replay the AMH third-eye animation');
    foot.parentNode.insertAdjacentElement('afterend',replay);replay.addEventListener('click',function(){power(foot)});
    new IntersectionObserver(function(e){vis=e[0].isIntersecting;if(vis&&!seen){seen=true;power(foot)}},{threshold:.5}).observe(foot);
    /* idle: the gentle 15s eye pulse lives in badge-fx.css; the full power-up is first view + Replay only */}
})();
/* footer AMH badge, live: 3D sway + tilt toward the pointer */
(function(){
  var b=document.querySelector('.f-brand .amh-badge');if(!b||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var host=b.parentNode;host.classList.add('amh-live');
  var gl=document.createElement("i");gl.className="gl";b.appendChild(gl);
  // (v4: the eye beam, white burst, rays, lens streak and spark sprays are retired - the electric arcs + chase now live in kit() above)
  // live 3D: idle sway like a turning globe, plus tilt toward the pointer
  var tx=0,ty=0,cx=0,cy=0,vis=false;new IntersectionObserver(function(e){vis=e[0].isIntersecting;if(vis)requestAnimationFrame(loop)}).observe(b);
  addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/r.width));ty=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/r.height))},{passive:true});
  function loop(now){if(!vis)return;requestAnimationFrame(loop);var s=now/1000;cx+=(tx-cx)*.06;cy+=(ty-cy)*.06;
    host.style.setProperty('--ry',(Math.sin(s*.5)*9+cx*16).toFixed(2)+'deg');host.style.setProperty('--rx',(Math.cos(s*.37)*5-cy*12).toFixed(2)+'deg');
    host.style.setProperty('--gx',(50+Math.sin(s*.5)*18+cx*25).toFixed(1)+'%')}
})();
