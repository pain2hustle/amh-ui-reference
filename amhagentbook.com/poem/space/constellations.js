// Poem-page port of Site Revival's revival/assets/constellations.js (+ Cassiopeia, fading figure lines, Polaris glow + label).
// Real sky over Austin's globe section (2026-10-12): Polaris, the Big Dipper and Orion's Belt
// (+ faint Betelgeuse / Rigel), plotted from J2000 RA/Dec with true relative positions + magnitudes.
// Dipper: azimuthal-equidistant projection about the north celestial pole, so Merak->Dubhe points at Polaris
// and the whole figure turns slowly around Polaris (sidereal sense, sped up ~1 turn / 40 min).
// Rendered as distant real stars (same small-core style as the starfield), gentle scintillation, near-invisible figure lines. No labels.
(function () {
  const sec = document.getElementById("space");
  if (!sec) return;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas");
  cv.className = "space-const"; cv.setAttribute("aria-hidden", "true");
  const sky = sec.querySelector(".space-sky");
  if (sky && sky.nextSibling) sec.insertBefore(cv, sky.nextSibling); else sec.insertBefore(cv, sec.firstChild);
  const x = cv.getContext("2d");
  const ra = (h, m) => (h + m / 60) * 15; // deg
  // [name, RA deg, Dec deg, mag, rgb]
  const POLARIS = ["Polaris", ra(2, 31.8), 89.264, 1.98, "255,244,222"];
  const DIPPER = [
    ["Dubhe", ra(11, 3.7), 61.751, 1.79, "255,214,160"],
    ["Merak", ra(11, 1.8), 56.382, 2.37, "232,240,255"],
    ["Phecda", ra(11, 53.8), 53.695, 2.44, "232,240,255"],
    ["Megrez", ra(12, 15.4), 57.033, 3.31, "236,242,255"],
    ["Alioth", ra(12, 54.0), 55.960, 1.77, "236,242,255"],
    ["Mizar", ra(13, 23.9), 54.925, 2.27, "236,242,255"],
    ["Alkaid", ra(13, 47.5), 49.313, 1.86, "220,232,255"],
  ];
  const DIPPER_LINES = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]];
  // Cassiopeia (J2000): the W on the far side of Polaris from the Dipper
  const CAS = [
    ["Caph", ra(0, 9.2), 59.150, 2.27, "255,244,222"],
    ["Schedar", ra(0, 40.5), 56.537, 2.24, "255,214,170"],
    ["Navi", ra(0, 56.7), 60.717, 2.15, "220,232,255"],
    ["Ruchbah", ra(1, 25.8), 60.235, 2.68, "232,240,255"],
    ["Segin", ra(1, 54.4), 63.670, 3.35, "220,232,255"],
  ];
  const ORION = [
    ["Alnitak", ra(5, 40.8), -1.943, 1.77, "214,226,255"],
    ["Alnilam", ra(5, 36.2), -1.202, 1.69, "214,226,255"],
    ["Mintaka", ra(5, 32.0), -0.299, 2.23, "214,226,255"],
    ["Betelgeuse", ra(5, 55.2), 7.407, 0.5, "255,178,122"],
    ["Rigel", ra(5, 14.5), -8.202, 0.13, "200,218,255"],
  ];
  // pole projection (deg from pole, angle = RA)
  const polar = (s, rot) => { const r = 90 - s[2], a = (s[1] * Math.PI) / 180 + rot; return [r * Math.cos(a), -r * Math.sin(a)]; };
  // local tangent projection around Alnilam (east to the left, as seen on the sky)
  const local = (s) => [-(s[1] - ORION[1][1]) * Math.cos((s[2] * Math.PI) / 180), -(s[2] - ORION[1][2])];

  let W = 0, H = 0, dpr = 1, phone = false;
  function size() {
    const r = sec.getBoundingClientRect(); W = r.width; H = r.height; phone = W < 700; dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  size(); new ResizeObserver(size).observe(sec);
  let vis = true; new IntersectionObserver((e) => { vis = e[0].isIntersecting; }, { rootMargin: "100px" }).observe(sec);

  // rendered like the rest of the starfield: a small hard core + a short soft halo; brightness from magnitude
  function star(px, py, mag, col, tw, spikes) {
    const core = Math.max(0.55, (3.3 - mag) * 0.42) * (phone ? 0.9 : 1);
    const a = Math.min(1, 0.45 + (3.3 - mag) * 0.2) * tw;
    const g = x.createRadialGradient(px, py, 0, px, py, core * 3.2);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.35, `rgba(${col},${a * 0.35})`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.beginPath(); x.arc(px, py, core * 3.2, 0, Math.PI * 2); x.fill();
    x.fillStyle = `rgba(255,255,255,${0.85 * tw})`; x.beginPath(); x.arc(px, py, core * 0.6, 0, Math.PI * 2); x.fill();
    if (spikes) { // tiny, faint diffraction cross only
      x.strokeStyle = `rgba(${col},${0.22 * tw})`; x.lineWidth = 0.6; x.beginPath();
      x.moveTo(px - spikes, py); x.lineTo(px + spikes, py); x.moveTo(px, py - spikes); x.lineTo(px, py + spikes); x.stroke();
    }
  }
  // gentle, uncorrelated scintillation per star (no sequence pulse)
  const tw = (t, seed, amt) => 1 - amt * (0.5 + 0.5 * Math.sin(t * (1.3 + seed * 0.7) + seed * 9.1) * Math.sin(t * (2.9 + seed * 0.3) + seed * 4.7));
  function draw(t) {
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    x.globalCompositeOperation = "lighter";
    // --- Polaris + Big Dipper (distant: ~3.9 px/deg desktop)
    const sc = phone ? 2.9 : 3.9;
    const P = phone ? [W * 0.3, 150] : [W * 0.3, 112];
    window.__polaris = P;
    const rot = -0.15 + (REDUCE ? 0 : t * ((Math.PI * 2) / 2400));
    const pp = polar(POLARIS, rot);
    const dp = DIPPER.map((s) => { const q = polar(s, rot); return [P[0] + (q[0] - pp[0]) * sc, P[1] + (q[1] - pp[1]) * sc]; });
    const fade = REDUCE ? 0.07 : 0.03 + 0.07 * (0.5 + 0.5 * Math.sin(t * 0.35));
    x.lineWidth = 0.6; x.strokeStyle = `rgba(190,215,255,${fade})`;
    x.beginPath(); for (const [a, b] of DIPPER_LINES) { x.moveTo(dp[a][0], dp[a][1]); x.lineTo(dp[b][0], dp[b][1]); } x.stroke();
    DIPPER.forEach((s, i) => star(dp[i][0], dp[i][1], s[3], s[4], tw(t, i + 1, 0.12), 0));
    const cp = CAS.map((s) => { const q = polar(s, rot); return [P[0] + (q[0] - pp[0]) * sc, P[1] + (q[1] - pp[1]) * sc]; });
    x.beginPath(); for (let i = 0; i < cp.length - 1; i++) { x.moveTo(cp[i][0], cp[i][1]); x.lineTo(cp[i + 1][0], cp[i + 1][1]); } x.stroke();
    CAS.forEach((s, i) => star(cp[i][0], cp[i][1], s[3], s[4], tw(t, 20 + i, 0.12), 0));
    // Polaris: soft glow so it reads as the clearest point in the figure
    { const gr = phone ? 10 : 13, g = x.createRadialGradient(P[0], P[1], 0, P[0], P[1], gr); g.addColorStop(0, "rgba(255,244,222,.32)"); g.addColorStop(1, "rgba(255,244,222,0)"); x.fillStyle = g; x.beginPath(); x.arc(P[0], P[1], gr, 0, Math.PI * 2); x.fill(); }
    // Polaris: only a touch brighter than its neighbours, subtle twinkle, tiny spikes
    star(P[0], P[1], 0.7, POLARIS[4], tw(t, 0.4, 0.1), phone ? 5 : 6);
    // --- Orion's Belt (+ faint Betelgeuse, Rigel)
    const os = phone ? 4.5 : 6.5;
    const O = phone ? [W * 0.14, H - 110] : [W * 0.055, H * 0.62];
    const op = ORION.map((s) => { const q = local(s); return [O[0] + q[0] * os, O[1] + q[1] * os]; });
    x.strokeStyle = `rgba(190,215,255,${fade})`; x.beginPath(); x.moveTo(op[0][0], op[0][1]); x.lineTo(op[1][0], op[1][1]); x.lineTo(op[2][0], op[2][1]); x.stroke();
    ORION.forEach((s, i) => star(op[i][0], op[i][1], i < 3 ? s[3] : s[3] + 0.6, s[4], tw(t, 10 + i, 0.12), 0));
    x.globalCompositeOperation = "source-over";
  }
  const lab = document.createElement("span"); lab.className = "ns-label"; lab.textContent = "North Star"; lab.setAttribute("aria-hidden", "true"); sec.appendChild(lab);
  let labT = 0;
  function near(px, py) { const P = window.__polaris; return P && Math.hypot(px - P[0], py - P[1]) < 22; }
  function show() { const P = window.__polaris; if (!P) return; lab.style.left = P[0] + 12 + "px"; lab.style.top = P[1] - 22 + "px"; lab.classList.add("on"); clearTimeout(labT); labT = setTimeout(() => lab.classList.remove("on"), 2600); }
  addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" && near(e.clientX, e.clientY)) show(); }, { passive: true });
  addEventListener("pointerdown", (e) => { if (!e.target.closest("a,button,input,textarea,select,label,.card,.chat,.pmodal") && near(e.clientX, e.clientY)) show(); }, { passive: true });
  const t0 = performance.now();
  function loop(now) { requestAnimationFrame(loop); if (!vis || document.hidden) return; draw((now - t0) / 1000); }
  if (REDUCE) { draw(0); new ResizeObserver(() => draw(0)).observe(sec); } else requestAnimationFrame(loop);
})();
