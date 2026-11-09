/* AMH page looks: a "✨ Look" tab under the header that swaps the page background.
   Page sets window.AMH_LOOKS = {key, def, looks:[{id, name, src?, srcPhone?, poster?, pos?, posPhone?}] (pos = object-position, where the crop should center), video?, hide?, before?}
   - video: selector of the page's own background <video>; without it one is made (fixed, cover).
   - hide: selectors hidden while a video look is on (poem: globe, sun, rocks).
   - before: selector the made video is inserted before (so it sits in the same stacking spot).
   Every visit opens on def (Austin 2026-10-17: no saved pick). ?look=<id> forces one.
   hold: seconds; the movie plays once, holds on that frame for `rest` seconds (default 5), then plays again. */
(function () {
  // 2026-10-22 (Austin): every page shows the SAME looks. Pages only set their default and their own built-in scene (looks:[...], listed first, same id wins).
  var ALL = [{"id":"blender","name":"Blender sky","src":"/poem/lab/media/look-lab-sky.mp4","poster":"/poem/lab/media/look-lab-sky.jpg"},{"id":"universe","name":"UFO → other universe","src":"https://media.amhagentbook.com/looks/universe-720.mp4","poster":"https://media.amhagentbook.com/looks/universe-720.jpg","hold":17.01},{"id":"shiprun","name":"Ship run → AMH","src":"https://media.amhagentbook.com/looks/ship-run-720.mp4","poster":"https://media.amhagentbook.com/looks/ship-run-720.jpg","hold":18.95},{"id":"ufo","name":"AMH UFO (full film)","src":"https://media.amhagentbook.com/looks/ufo-film4-720.mp4","poster":"https://media.amhagentbook.com/looks/ufo-film4-720.jpg","hold":50.7,"rest":20},{"id":"full2","name":"AMH full film 2","src":"https://media.amhagentbook.com/looks/full2-720.mp4","srcPhone":"https://media.amhagentbook.com/looks/full2-phone.mp4","poster":"https://media.amhagentbook.com/looks/full2-720.jpg","hold":61.88,"rest":30},{"id":"tusk","name":"In Tusk We Trust (full film)","src":"https://media.amhagentbook.com/looks/tusk-720.mp4","poster":"https://media.amhagentbook.com/looks/tusk-720.jpg","srcPhone":"/poem/lab/media/look-tusk-film3-phone.mp4","hold":41.88},{"id":"jubber","name":"Jubber & UFO","src":"/poem/lab/media/look-jubber-ufo.mp4","poster":"/poem/lab/media/look-jubber-ufo.jpg","posPhone":"62% 50%"},{"id":"video","name":"Austin's video","src":"/poem/lab/media/lab-bg-loop.mp4?v=3","srcPhone":"/poem/lab/media/lab-bg-loop-phone.mp4?v=3","poster":"/poem/lab/media/lab-bg-loop.jpg"},{"id":"infinity","name":"Infinity","src":"/poem/lab/media/gemini-infinity-2.mp4","poster":"/poem/lab/media/gemini-infinity-2.jpg"},{"id":"vortex","name":"Green vortex","src":"/poem/lab/media/look-green-vortex.mp4","poster":"/poem/lab/media/look-green-vortex.jpg"},{"id":"warp","name":"Warp to AMH","src":"/poem/lab/media/look-warp-amh.mp4","poster":"/poem/lab/media/look-warp-amh.jpg","hold":6.85},{"id":"arrive","name":"Jubber arrives","src":"/poem/lab/media/look-jubber-arrives.mp4","poster":"/poem/lab/media/look-jubber-arrives.jpg","hold":9.8},{"id":"hq","name":"Jubber HQ","src":"/poem/lab/media/look-jubber-hq.mp4","poster":"/poem/lab/media/look-jubber-hq.jpg","hold":9.8},{"id":"hole","name":"Black hole","src":"/poem/lab/media/look-black-hole.mp4","poster":"/poem/lab/media/look-black-hole.jpg","hold":9.8},{"id":"gate","name":"Asteroid gate","src":"/poem/lab/media/look-asteroid-gate.mp4","poster":"/poem/lab/media/look-asteroid-gate.jpg"}];
  var C = window.AMH_LOOKS; if (!C) return;
  var own = C.looks || [], seen = {}; own.forEach(function (l) { seen[l.id] = 1 });
  C.looks = own.concat(ALL.filter(function (l) { return !seen[l.id] }));
  var h = document.documentElement, byId = {};
  C.looks.forEach(function (l) { byId[l.id] = l });
  var q = location.search.match(/[?&]look=([\w-]+)/), L = null;
  L = q && q[1];
  if (!byId[L]) L = C.def;

  var css = document.createElement("style");
  css.textContent =
    "#amh-lookvid{position:fixed;inset:0;z-index:0;width:100%;height:100%;object-fit:cover;display:none;pointer-events:none;background:#03050c}" +
    "#amh-lookshade{position:fixed;inset:0;z-index:0;pointer-events:none;display:none;background:linear-gradient(180deg,#03050c88,#03050c33 30%,#03050c55 70%,#03050ccc)}" +
    "html[data-lookvid] #amh-lookvid,html[data-lookvid] #amh-lookshade{display:block}" +
    (C.hide ? "html[data-lookvid] :is(" + C.hide + "){display:none!important}" : "") +
    ".amh-looktab{position:fixed;z-index:6;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;transition:opacity .3s}" +
    ".amh-looktab>button{font:800 13px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.02em;padding:8px 15px 9px;border-radius:0 0 14px 14px;border:1.5px solid #8dff5a;border-top:0;background:linear-gradient(180deg,#0b2a14f2,#091a34f2);color:#d6ff8a;cursor:pointer;box-shadow:0 6px 22px #8dff5a55,0 0 0 1px #03050c;white-space:nowrap;animation:amhLookGlow 2.6s ease-in-out infinite}" +
    ".amh-looktab>button b{color:#fff}" +
    "@keyframes amhLookGlow{0%,100%{box-shadow:0 6px 18px #8dff5a44,0 0 0 1px #03050c}50%{box-shadow:0 6px 28px #8dff5aaa,0 0 0 1px #03050c}}" +
    ".amh-lookpick{display:none;gap:8px;margin-top:8px;padding:8px;border:1px solid #8dff5a88;border-radius:16px;background:#03050cf0;box-shadow:0 10px 30px #000a;max-width:calc(100vw - 24px);overflow-x:auto}" +
    ".amh-looktab.open .amh-lookpick{display:flex}" +
    ".amh-lookpick button{flex:0 0 auto;width:112px;padding:0 0 7px;border:1.5px solid #ffffff22;border-radius:12px;background:#091a34;color:#e6eef8;font:700 12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer;overflow:hidden;text-align:center}" +
    ".amh-lookpick button i{display:block;height:58px;margin-bottom:6px;background:#132042 center/cover no-repeat}" +
    ".amh-lookpick button[aria-pressed=true]{border-color:#8dff5a;color:#d6ff8a;box-shadow:0 0 12px #8dff5a66}" +
    "body.menu-open .amh-looktab,.amh-looktab.away{opacity:0;pointer-events:none}" +
    "@media (max-width:600px){.amh-looktab{left:auto;right:10px;transform:none;align-items:flex-end}.amh-looktab>button{font-size:11.5px;padding:5px 11px 6px;border-radius:0 0 12px 12px}}" +
    "@media (max-width:420px){.amh-lookpick button{width:96px}.amh-lookpick button i{height:50px}}" +
    "@media (prefers-reduced-motion:reduce){.amh-looktab>button{animation:none}}";
  document.head.appendChild(css);

  var v = C.video ? document.querySelector(C.video) : null;
  function made() {
    if (v) return;
    v = document.createElement("video"); v.id = "amh-lookvid";
    v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.setAttribute("muted", ""); v.preload = "auto";
    v.setAttribute("aria-hidden", "true");
    var sh = document.createElement("div"); sh.id = "amh-lookshade"; sh.setAttribute("aria-hidden", "true");
    var at = C.before && document.querySelector(C.before);
    if (at) { at.parentNode.insertBefore(v, at); at.parentNode.insertBefore(sh, at) } else { document.body.prepend(sh); document.body.prepend(v) }
  }
  // Keep the full available file on phones too; do not substitute a smaller encode.
  function pickSrc(l) { if (l.srcPhone && innerWidth <= 700 && innerHeight > innerWidth) return l.srcPhone; return l.srcOriginal || l.src }

  var fit = 'cover'; try { fit = localStorage.getItem(C.key + ':fit') === 'contain' ? 'contain' : 'cover' } catch(e) {}
  var extra = document.createElement('style'); extra.textContent = `
  .amh-looktab{z-index:20}.amh-looktab>button{min-height:44px}
  .amh-lookpick{display:none;flex-wrap:wrap;justify-content:center;box-sizing:border-box;width:max-content;max-height:calc(100dvh - var(--look-top,160px) - 68px);overflow-y:auto;overscroll-behavior:contain}
  .amh-looktools{flex:1 0 100%;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;border-top:1px solid #ffffff24;padding-top:8px}
  .amh-looktools button{width:auto;min-height:44px;padding:8px 12px;border-radius:10px}
  .amh-looktools button[aria-pressed=true]{background:#234b28}.amh-looktools small{flex:1 0 100%;font:12px/1.4 system-ui;color:#bccbb9;text-align:center}
  .amh-looktools[hidden]{display:none}
  .amh-film-dialog{width:min(1100px,calc(100vw - 24px));max-width:none;max-height:calc(100dvh - 32px);box-sizing:border-box;padding:12px;border:1px solid #8dff5a88;border-radius:18px;background:#071019;color:#edffe5;overflow:auto}
  .amh-film-dialog::backdrop{background:#02050bea;backdrop-filter:blur(6px)}
  .amh-film-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;font:700 16px/1.3 system-ui}
  .amh-film-head button{min-width:44px;min-height:44px;border-radius:50%;border:1px solid #8dff5a88;background:#102a20;color:white;font-size:24px;cursor:pointer}
  .amh-film-dialog video{display:block;width:100%;height:auto;max-height:calc(100dvh - 130px);object-fit:contain;background:#000;border-radius:10px}
  .amh-film-dialog p{font:12px/1.4 system-ui;color:#b8cabd;margin:10px 2px 0}
  @media(max-width:700px){.amh-looktab{left:auto;right:max(12px,env(safe-area-inset-right));transform:none;align-items:flex-end}.amh-looktab>button{font-size:12px;max-width:calc(100vw - 24px);padding:10px 14px;border-radius:0 0 13px 13px;overflow:hidden;text-overflow:ellipsis}
  .amh-lookpick{width:min(360px,calc(100vw - 24px));padding:10px;gap:8px;border-radius:16px}.amh-looktab.open .amh-lookpick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .amh-lookpick>button{width:100%;min-width:0;font-size:13px;padding-bottom:10px}.amh-lookpick>button i{height:auto;aspect-ratio:16/9;background-size:cover;margin-bottom:8px}
  .amh-looktools{grid-column:1/-1}.amh-looktools button{font-size:12px;flex:1 1 auto;min-width:0}.amh-film-dialog{padding:10px}}
  `; document.head.appendChild(extra);

  var tab = document.createElement("div"); tab.className = "amh-looktab";
  var btn = document.createElement("button"); btn.type = "button"; btn.setAttribute("aria-expanded", "false"); btn.title = "Change how this page looks";
  var pick = document.createElement("div"); pick.className = "amh-lookpick"; pick.setAttribute("role", "group"); pick.setAttribute("aria-label", "Page looks");
  C.looks.forEach(function (l) {
    var b = document.createElement("button"); b.type = "button"; b.dataset.look = l.id;
    var i = document.createElement("i"); if (l.poster) i.style.backgroundImage = "url(" + l.poster + ")";
    b.appendChild(i); b.appendChild(document.createTextNode(l.name));
    b.onclick = function () { set(l.id); open(false) };
    pick.appendChild(b);
  });
  var tools = document.createElement('div'); tools.className='amh-looktools';
  var fill = document.createElement('button'); fill.type='button'; fill.textContent='Fill screen';
  var full = document.createElement('button'); full.type='button'; full.textContent='Full scene';
  var watch = document.createElement('button'); watch.type='button'; watch.textContent='▶ Watch';
  var quality = document.createElement('small'); quality.setAttribute('aria-live','polite');
  tools.append(fill,full,watch,quality); pick.appendChild(tools);
  function framing(value){fit=value;try{localStorage.setItem(C.key+':fit',fit)}catch(e){} if(v){v.style.objectFit=fit;v.style.objectPosition=fit==='contain'?'50% 50%':((innerWidth<=700&&byId[L].posPhone)||byId[L].pos||'50% 50%')}fill.setAttribute('aria-pressed',fit==='cover');full.setAttribute('aria-pressed',fit==='contain')}
  fill.onclick=function(){framing('cover')};full.onclick=function(){framing('contain')};
  function showQuality(){quality.textContent=v&&v.videoWidth?'File: '+v.videoWidth+' × '+v.videoHeight+(v.videoWidth>=3840?' · 4K':''):'Loading movie…'}
  var dialog=document.createElement('dialog');dialog.className='amh-film-dialog';dialog.setAttribute('aria-label','Full movie');
  var head=document.createElement('div');head.className='amh-film-head';var title=document.createElement('span');var close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close movie');head.append(title,close);
  var film=document.createElement('video');film.controls=true;film.playsInline=true;film.setAttribute('playsinline','');film.loop=true;film.muted=true;film.preload='metadata';
  var hint=document.createElement('p');hint.textContent='Full scene, using the available file. Rotate your phone for a larger view.';dialog.append(head,film,hint);document.body.appendChild(dialog);
  close.onclick=function(){dialog.close()};dialog.addEventListener('click',function(e){if(e.target===dialog){var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
  dialog.addEventListener('close',function(){film.pause();film.removeAttribute('src');film.load();if(v&&byId[L].src&&!document.hidden){if(holding){clearTimeout(holdT);holdT=setTimeout(replay,(byId[L].rest||5)*1000)}else v.play().catch(function(){})}});
  watch.onclick=function(){var l=byId[L];if(!l.src)return;title.textContent=l.name;film.poster=l.poster||'';film.src=pickSrc(l);dialog.showModal();if(v)v.pause();film.play().catch(function(){});open(false)};
  tab.appendChild(btn); tab.appendChild(pick); document.body.appendChild(tab);
  function open(o) { tab.classList.toggle("open", o); btn.setAttribute("aria-expanded", o) }
  btn.onclick = function (e) { e.stopPropagation(); open(!tab.classList.contains("open")) };
  document.addEventListener("click", function (e) { if (!tab.contains(e.target)) open(false) });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") open(false) });

  // hold looks: play to the hold frame, freeze there, replay on a timer
  var holdT = null, holding = false;
  function freeze() { var l = byId[L]; if (!v || !l.hold || holding) return; holding = true; v.pause(); clearTimeout(holdT); holdT = setTimeout(replay, (l.rest || 5) * 1000); if (Math.abs(v.currentTime - l.hold) > .3) try { v.currentTime = l.hold } catch (e) {} }
  function watchFrames() { if (!v.requestVideoFrameCallback) return; v.requestVideoFrameCallback(function (now, md) { var l = byId[L]; if (!l.hold || holding) return; if (md.mediaTime >= l.hold - .02) freeze(); else watchFrames() }) }
  function replay() { var l = byId[L]; clearTimeout(holdT); if (!v || !l.hold || document.hidden || dialog.open) return; holding = false; try { v.currentTime = 0 } catch (e) {} v.play().catch(freeze); watchFrames() }
  function onTime() { var l = byId[L]; if (l.hold && !holding && v.currentTime >= l.hold) freeze() }

  function set(id) {
    var l = byId[id] || byId[C.def]; L = l.id;
    h.setAttribute("data-look", l.id);
    clearTimeout(holdT); holding = false;
    btn.innerHTML = "✨ Look: <b></b> ▾"; btn.querySelector("b").textContent = l.name;
    pick.querySelectorAll("button[data-look]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.look === l.id) });
    tools.hidden=!l.src;
    if (l.src) {
      made(); h.setAttribute("data-lookvid", "");
      v.onloadedmetadata=showQuality;
      var u = pickSrc(l);
      if (v.getAttribute("data-u") !== u) { v.setAttribute("data-u", u); if (l.poster) v.poster = l.poster; v.src = u }
      framing(fit); showQuality();
      v.loop = !l.hold; v.removeEventListener("timeupdate", onTime); v.removeEventListener("ended", freeze);
      if (l.hold) { v.addEventListener("timeupdate", onTime); v.addEventListener("ended", freeze); replay() }
      else v.play().catch(function () {});
    } else { h.removeAttribute("data-lookvid"); if (v) v.pause() }
    place();
  }

  // the tab hangs off the lowest top bar (header, or the Lab color bar under it)
  var anchors = (C.anchor || "header,#cbar").split(",");
  function place() {
    var y = 0;
    anchors.forEach(function (s) {
      var el = document.querySelector(s.trim()); if (!el) return;
      var r = el.getBoundingClientRect(), st = getComputedStyle(el);
      if (r.height && st.display !== "none" && st.visibility !== "hidden" && r.top < innerHeight * .4 && r.bottom > y) y = r.bottom;
    });
    tab.style.top = Math.max(0, Math.round(y)) + "px";
    tab.style.setProperty('--look-top',Math.max(0,Math.round(y))+'px');
    var away = scrollY > innerHeight * .6; tab.classList.toggle("away", away); if (away) open(false);
  }
  addEventListener("resize", function () { place(); var l = byId[L]; if (l.src && !l.hold) set(L); else if (l.src) framing(fit) });
  addEventListener("scroll", place, { passive: true });
  setInterval(place, 1200);
  document.addEventListener("visibilitychange", function () { if (document.hidden) film.pause(); if (!v || !byId[L].src) return; if (document.hidden||dialog.open) v.pause(); else if (byId[L].hold) { if (holding) { clearTimeout(holdT); holdT = setTimeout(replay, (byId[L].rest || 5) * 1000) } else v.play().catch(function () {}) } else v.play().catch(function () {}) });
  set(L);
})();
