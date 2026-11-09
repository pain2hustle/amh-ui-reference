const CAPTURE_STORE = "amh-fieldproof-capture-v2";
const uploadApi = "/api/fieldscan-media";
const agentApi = "/api/fieldscan-agents";
const app = document.querySelector("[data-capture-app]");
const video = document.querySelector("[data-camera-video]");
const canvas = document.querySelector("[data-camera-canvas]");
const empty = document.querySelector("[data-camera-empty]");
const statusEl = document.querySelector("[data-capture-status]");
const releaseEl = document.querySelector("[data-tech-release]");
const matchGuide = document.querySelector("[data-match-guide]");
const guideEl = document.querySelector("[data-capture-guide]");
const cameraFrame = document.querySelector("[data-camera-frame]");
const verdictEl = document.querySelector("[data-camera-verdict]");
const recordingPreview = document.querySelector("[data-recording-preview]");
const recordingReview = document.querySelector("[data-recording-review]");
const managerThread = document.querySelector("[data-manager-thread]");
const previews = {
  before: document.querySelector('[data-shot-preview="before"]'),
  after: document.querySelector('[data-shot-preview="after"]'),
};
let stream;
let recorder;
let chunks = [];
const packet = loadPacket();
renderPacket();
bindManualAssist();
bindSiteAssist();

app?.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.matches("[data-camera-start]")) await startCamera();
  if (target.matches("[data-record-start]")) startRecording();
  if (target.matches("[data-record-stop]")) stopRecording();
  if (target.matches("[data-match-after]")) toggleMatchGuide();
  if (target.matches("[data-shot]")) takeShot(target.dataset.shot);
  if (target.matches("[data-clear-shots]")) clearShots();
  if (target.matches("[data-save-packet]")) savePacket();
  if (target.matches("[data-upload-packet]")) await uploadPacket();
  if (target.matches("[data-ask-manager]")) await uploadManagerHelp();
  if (target.matches("[data-check-manager]")) await checkManagerReplies();
});

function bindSiteAssist() {
  const root = document.querySelector("[data-site-assist]");
  const form = root?.querySelector("[data-site-assist-form]");
  const status = root?.querySelector("[data-site-assist-status]");
  const result = root?.querySelector("[data-site-assist-result]");
  if (!root || !form || !status || !result) return;
  const saved = packet.siteAssessment || {};
  for (const [name, value] of Object.entries(saved)) if (form.elements[name] && value) form.elements[name].value = value;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const site = Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [key, String(value || "").trim()]));
    packet.siteAssessment = site;
    packet.updatedAt = new Date().toISOString();
    localStorage.setItem(CAPTURE_STORE, JSON.stringify(serializablePacket()));
    status.dataset.tone = "busy";
    status.textContent = "Checking measured doorway facts against current verified rules...";
    result.innerHTML = "";
    const response = await fetch(agentApi, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ route: "site-guide", ...site }) }).catch(() => null);
    const payload = await response?.json?.().catch(() => ({}));
    if (!response?.ok) {
      status.dataset.tone = "hold";
      status.textContent = response?.status === 401 ? "Sign in to check the doorway. Your measurements remain saved." : payload.error || "Site check unavailable. Keep the packet held for manager review.";
      return;
    }
    renderSiteGuide(payload.guide || {}, status, result);
  });
  root.querySelector("[data-site-clear]")?.addEventListener("click", () => {
    form.reset();
    packet.siteAssessment = {};
    localStorage.setItem(CAPTURE_STORE, JSON.stringify(serializablePacket()));
    status.dataset.tone = "idle";
    status.textContent = "Start with the actual clear opening—not the nominal slab size.";
    result.innerHTML = "";
  });
}

function renderSiteGuide(guide, status, result) {
  packet.siteGuide = guide;
  const held = guide.status !== "measurement-review-ready";
  status.dataset.tone = held ? "hold" : "verified";
  status.textContent = held ? "HOLD — evidence or qualified review is still required." : "Measurements captured. Manager/designer review still controls the alteration.";
  const checks = (guide.checks || []).map((check) => `<article><strong>${escapeAssist(check.label)}</strong><span>${check.measured == null ? "Not captured" : `${escapeAssist(check.measured)} ${escapeAssist(check.unit)}`} · ${escapeAssist(check.required)}</span><small>${escapeAssist(check.status)} · ${escapeAssist(check.source)}</small>${check.note ? `<em>${escapeAssist(check.note)}</em>` : ""}</article>`).join("");
  const holds = [...(guide.requiredCapture || []).map((item) => `Capture: ${item}`), ...(guide.stopConditions || [])];
  const links = (guide.sources || []).map((source) => `<a href="${escapeAssistUrl(source.url)}" target="_blank" rel="noopener noreferrer">${escapeAssist(source.authority)} — ${escapeAssist(source.label)} ↗</a>`).join("");
  result.innerHTML = `<section class="manual-${held ? "hold" : "verified"}"><div class="manual-match-head"><div><span>Door / wall evidence</span><h3>${held ? "Do not cut yet" : "Measurement review ready"}</h3></div><b>${escapeAssist(guide.confidence?.siteCondition || "held")}</b></div>${checks ? `<section class="manual-guide-section"><h4>Measured checks</h4>${checks}</section>` : ""}${holds.length ? `<div class="manual-safety"><strong>Required before proceeding</strong>${holds.map((item) => `<span>${escapeAssist(item)}</span>`).join("")}</div>` : ""}<div class="manual-proof-line">${links}</div><small>Plan record: ${escapeAssist(guide.planLookup?.recordStatus || "unverified")}. ${escapeAssist(guide.planLookup?.permitTeamPhone || "")} ${escapeAssist(guide.planLookup?.permitTeamEmail || "")}</small></section>`;
}
function bindManualAssist() {
  const root = document.querySelector("[data-manual-assist]");
  const form = root?.querySelector("[data-manual-assist-form]");
  const status = root?.querySelector("[data-manual-assist-status]");
  const result = root?.querySelector("[data-manual-assist-result]");
  if (!root || !form || !status || !result) return;
  const saved = packet.equipmentIdentity || {};
  for (const name of ["manufacturer", "model", "serialNumber", "boardPart", "boardRevision", "supplyVoltage", "supplyPhase", "applicationClass", "jurisdiction", "installationEnvironment", "framingMaterial", "wiringMethod", "issueSymptom", "serviceAction", "emergencyState", "qualificationState", "licenseState", "task"]) if (saved[name] && form.elements[name]) form.elements[name].value = saved[name];
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const identity = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value || "").trim()]));
    identity.trade = document.querySelector("[data-capture-trade]")?.value || "Garage Doors";
    packet.equipmentIdentity = identity;
    localStorage.setItem(CAPTURE_STORE, JSON.stringify(serializablePacket()));
    if (identity.emergencyState === "present") {
      status.dataset.tone = "hold";
      status.textContent = "EMERGENCY HOLD - stop work and use the company emergency/escalation procedure. Diagnostic and service steps remain hidden.";
      result.innerHTML = `<section class="manual-hold"><strong>Stop work</strong><p>Do not deconstruct, energize, test, install, or reassemble while an active or suspected emergency is present.</p><small>Send the observed facts and media to the manager; this screen does not replace emergency services or the site emergency plan.</small></section>`;
      return;
    }
    status.dataset.tone = "busy";
    status.textContent = "Checking verified manufacturer manuals...";
    result.innerHTML = "";
    const response = await fetch(agentApi, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ route: "manual-guide", ...identity }) }).catch(() => null);
    const payload = await response?.json?.().catch(() => ({}));
    if (!response?.ok) {
      status.dataset.tone = "hold";
      status.textContent = response?.status === 401 ? "Sign in to use verified equipment assistance. Your scan packet remains saved." : payload.error || "Manual service unavailable. Do not guess; capture labels and continue the evidence packet.";
      return;
    }
    renderManualGuide(payload, status, result, identity);
  });
  root.querySelector("[data-manual-clear]")?.addEventListener("click", () => {
    form.reset(); packet.equipmentIdentity = {};
    localStorage.setItem(CAPTURE_STORE, JSON.stringify(serializablePacket()));
    status.dataset.tone = "idle"; status.textContent = "Enter the exact manufacturer, model, and board part or revision."; result.innerHTML = "";
  });
}

function renderManualGuide(payload, status, result, suppliedIdentity = {}) {
  const guide = payload.guide || {}; const match = guide.match || {};
  if (match.status !== "verified-manual-match") {
    const missing = [...new Set([...(match.missingIdentity || []), ...(payload.requiredCapture || [])])];
    status.dataset.tone = "hold"; status.textContent = "HOLD - identity is not proven. Wiring and programming details are hidden.";
    const candidates = (payload.candidates || []).slice(0, 4);
    result.innerHTML = `<section class="manual-hold"><strong>Scan this next</strong><ul>${(missing.length ? missing : ["exact model", "board part/revision", "manual label"]).map((item) => `<li>${escapeAssist(item)}</li>`).join("")}</ul>${candidates.length ? `<p>Possible manuals only - not approved matches:</p>${candidates.map((item) => `<span>${escapeAssist(item.manufacturer)} ${escapeAssist(item.modelPattern)}</span>`).join("")}` : ""}<small>Manager review is required before any candidate can be treated as an exact match. Never infer voltage, amps, terminal function, jumper, compatibility, procedure, or code approval from appearance.</small></section>`;
    return;
  }
  status.dataset.tone = "verified"; status.textContent = "Verified manufacturer-manual match. Use only the cited items below.";
  const task = String(guide.task || "").toLowerCase();
  const terminals = filterAssistRows(guide.terminals || [], task, ["terminal_label", "terminal_function", "terminal_group", "connection_notes"]);
  const parameters = filterAssistRows(guide.parameters || [], task, ["parameter_code", "parameter_name", "applies_to"]);
  const compatibility = filterAssistRows(guide.compatibility || [], task, ["accessory_category", "accessory_model", "requirements_text"]);
  const identity = suppliedIdentity || guide.identity || packet.equipmentIdentity || {};
  const steps = citedDiagnosticSteps(guide, parameters);
  const manualActionGate = /deconstruction|installation|reassembly/.test(String(identity.serviceAction || ""));
  const exactPage = guide.manual?.sourcePage || steps[0]?.sourcePage || "";
  const emergencyHold = guide.emergencyHold === true || guide.emergencyHold?.active === true;
  const qualificationHold = (manualActionGate || guide.qualifiedPersonnelRequired === true) && identity.qualificationState !== "verified";
  const licenseHold = guide.licensedPersonnelRequired === true && identity.licenseState !== "verified";
  const manualPageHold = manualActionGate && !exactPage;
  const managerHold = match.managerApprovalRequired === true || guide.managerApprovalRequired === true;
  const held = emergencyHold || qualificationHold || licenseHold || manualPageHold || managerHold;
  const holdReasons = [
    emergencyHold && "Emergency condition remains active in the verified response.",
    qualificationHold && "Qualified technician authorization is not verified for this scope.",
    licenseHold && "The required license is not verified for this scope.",
    manualPageHold && "No exact deconstruction / installation / reassembly manual page was supplied.",
    managerHold && "Manager approval is still required."
  ].filter(Boolean);
  if (held) {
    status.dataset.tone = "hold";
    status.textContent = "HOLD - evidence is read-only; restricted work is not released.";
  }
  result.innerHTML = `<section class="manual-verified"><div class="manual-match-head"><div><span>Exact manual</span><h3>${escapeAssist(guide.manual?.title || "Verified manual")}</h3></div><b>${escapeAssist(match.confidence || "high")}</b></div><div class="manual-proof-line"><span>Version: ${escapeAssist(guide.manual?.version || "recorded")}</span><code>SHA-256 ${escapeAssist(guide.manual?.checksumSha256 || "recorded in database")}</code><a href="${escapeAssistUrl(guide.manual?.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open manual ↗</a></div>${assistSection("Terminals / controls", terminals, assistTerminalCard)}${assistSection("Settings / procedure", parameters, assistParameterCard)}${assistSection("Compatible accessories", compatibility, assistCompatibilityCard)}<div class="manual-safety"><strong>Before touching it</strong>${(guide.match?.rules || []).map((rule) => `<span>${escapeAssist(rule)}</span>`).join("")}<span>${escapeAssist(guide.guidance || "")}</span></div></section>`;
  result.insertAdjacentHTML("beforeend", `${holdReasons.length ? `<div class="manual-safety"><strong>Technician hold</strong>${holdReasons.map((reason) => `<span>${escapeAssist(reason)}</span>`).join("")}</div>` : ""}${exactPage ? `<div class="manual-proof-line"><a href="${manualPageUrl(guide.manual?.sourceUrl, exactPage)}" target="_blank" rel="noopener noreferrer">Open exact manual page ${escapeAssist(exactPage)}</a></div>` : ""}${diagnosticRundown(steps, guide.manual, held)}${partsSection(guide.parts || guide.partOptions || [])}${communityExamplesSection(guide.communityExamples || payload.communityExamples || [])}`);
}

function filterAssistRows(rows, task, fields) {
  if (!task) return rows.slice(0, 12);
  const keywords = { timer:["timer","ttc","quick close","anti-tail"], "vehicle loop":["loop","exit","shadow","interrupt","anti-tail"], "relay or access control":["relay","lock","sbc","button","open","close","stop","fire","access"], "safety sensor or edge":["eye","photo","edge","entrapment","interrupt"], "remote pairing":["remote","security+","learn"], keypad:["keypad","keyless","kpw"], limits:["limit","force","obstruction"], power:["power","voltage","vac","vdc","battery","solar","amp"], "fault diagnosis":["fault","fail","diagnostic","loop","battery"], "rough-in wiring route":["power","voltage","disconnect","wiring","conduit","junction"], "receptacle layout":["receptacle","outlet","power","branch"], "lighting layout":["light","lighting","power","branch","control"] }[task] || task.split(/\W+/).filter(Boolean);
  const matches = rows.filter((row) => keywords.some((word) => fields.some((field) => String(row[field] || "").toLowerCase().includes(word))));
  return (matches.length ? matches : rows).slice(0, 12);
}
function assistSection(title, rows, renderer) { return rows.length ? `<section class="manual-guide-section"><h4>${escapeAssist(title)}</h4>${rows.map(renderer).join("")}</section>` : ""; }
function assistTerminalCard(row) { return `<article><strong>${escapeAssist(row.terminal_label)}</strong><span>${escapeAssist(row.terminal_function)}</span><small>${escapeAssist(row.electrical_rating_text || row.signal_type || "Manual-defined control")} · Page ${escapeAssist(row.source_page)}</small>${row.connection_notes ? `<em>${escapeAssist(row.connection_notes)}</em>` : ""}</article>`; }
function assistParameterCard(row) { return `<article><strong>${escapeAssist(row.parameter_code)} · ${escapeAssist(row.parameter_name)}</strong><span>${escapeAssist(row.applies_to || "Exact matched equipment")}</span><small>Allowed: ${escapeAssist(formatAssistJson(row.allowed_values_json))} · Page ${escapeAssist(row.source_page)}</small>${formatAssistJson(row.tech_steps_json) ? `<em>${escapeAssist(formatAssistJson(row.tech_steps_json))}</em>` : ""}</article>`; }
function assistCompatibilityCard(row) { return `<article><strong>${escapeAssist(row.accessory_model)}</strong><span>${escapeAssist(row.accessory_category)} · ${escapeAssist(row.compatibility_status)}</span><small>${escapeAssist(row.requirements_text)} · Page ${escapeAssist(row.source_page)}</small></article>`; }
function formatAssistJson(value) { try { const parsed=JSON.parse(value || ""); return Array.isArray(parsed) ? parsed.join(" → ") : Object.entries(parsed).map(([k,v]) => `${k}: ${v}`).join("; "); } catch { return String(value || ""); } }
function citedDiagnosticSteps(guide, parameters) {
  const direct = [...(guide.diagnosticSteps || []), ...(guide.diagnosticRundown || [])].map((row, index) => ({ order: Number(row.order || row.stepNumber || index + 1), text: row.instruction || row.text || row.step || "", evidence: row.evidenceRequired || row.evidence || "", expected: row.expectedResult || row.expected || "", sourcePage: row.sourcePage || row.source_page || row.page || "" }));
  const parameterSteps = parameters.flatMap((row) => {
    let parsed = [];
    try { parsed = JSON.parse(row.tech_steps_json || "[]"); } catch {}
    return Array.isArray(parsed) ? parsed.map((text, index) => ({ order: index + 1, text, evidence: "", expected: "", sourcePage: row.source_page || "" })) : [];
  });
  return [...direct, ...parameterSteps].filter((step) => step.text && step.sourcePage).sort((a, b) => a.order - b.order).slice(0, 20);
}
function diagnosticRundown(steps, manual, held) {
  if (!steps.length) return '<section class="manual-guide-section"><h4>Diagnostic rundown</h4><p class="manual-empty-evidence">No page-cited diagnostic steps were supplied. Do not invent a sequence; ask the manager for matched evidence.</p></section>';
  return `<section class="manual-guide-section manual-rundown"><h4>Safe ordered diagnostic rundown</h4><ol>${steps.map((step) => `<li><div><strong>${escapeAssist(step.text)}</strong><a href="${manualPageUrl(manual?.sourceUrl, step.sourcePage)}" target="_blank" rel="noopener noreferrer">Manual page ${escapeAssist(step.sourcePage)}</a></div>${step.expected ? `<small>Expected from cited evidence: ${escapeAssist(step.expected)}</small>` : ""}<label>Step result<select data-manual-step-result ${held ? "disabled" : ""}><option>Not run</option><option>Matches cited result</option><option>Does not match</option><option>Blocked / unsafe</option></select></label><label>Observed evidence<textarea data-manual-step-evidence rows="2" ${held ? "disabled" : ""} placeholder="${escapeAssist(step.evidence || "Record the observed value, photo, or instrument result.")}"></textarea></label></li>`).join("")}</ol></section>`;
}
function partsSection(parts) {
  const rows = parts.filter((part) => part.partNumber || part.part_number).slice(0, 12);
  if (!rows.length) return "";
  return `<section class="manual-guide-section manual-parts"><h4>Matched parts</h4>${rows.map((part) => {
    const number = part.partNumber || part.part_number;
    const date = part.priceAsOf || part.availabilityAsOf || part.checkedAt || part.checked_at;
    const source = part.provenance || part.priceSource || part.availabilitySource || part.vendor;
    const volatile = date && source && (part.price || part.availability) ? `<small>Volatile price / availability: ${escapeAssist(part.price || "price not supplied")} - ${escapeAssist(part.availability || "availability not supplied")} - checked ${escapeAssist(date)} - source ${escapeAssist(source)}</small>` : "";
    return `<article><strong>Part ${escapeAssist(number)}</strong>${part.url ? `<a href="${escapeAssistUrl(part.url)}" target="_blank" rel="noopener noreferrer">Open supplied part link</a>` : ""}${volatile}</article>`;
  }).join("")}</section>`;
}
function communityExamplesSection(examples) {
  if (!examples.length) return "";
  const allowed = new Set(["approved", "consented", "licensed", "public-domain", "company-owned"]);
  const rows = examples.filter((item) => allowed.has(String(item.permissionStatus || item.rightsStatus || "").toLowerCase()) && item.sourceUrl).slice(0, 8);
  if (!rows.length) return '<section class="manual-community"><strong>Community before / after examples withheld</strong><span>Reuse permission and provenance were not supplied.</span></section>';
  return `<section class="manual-community"><strong>Community before / after - non-authoritative</strong><span>Examples are visual context only. They do not identify the appliance, prove a diagnosis, authorize work, or override the matched manual or manager.</span>${rows.map((item) => `<article><a href="${escapeAssistUrl(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeAssist(item.title || "Community example")}</a><small>${escapeAssist(item.sourcePlatform || "Community source")} - ${escapeAssist(item.author || "author not supplied")} - ${escapeAssist(item.publishedAt || item.capturedAt || "date not supplied")} - reuse ${escapeAssist(item.permissionStatus || item.rightsStatus)}</small></article>`).join("")}</section>`;
}
function manualPageUrl(sourceUrl, page) {
  try {
    const url = new URL(String(sourceUrl || ""), location.origin);
    if (url.protocol !== "https:") return "#";
    const pageNumber = String(page || "").match(/\d+/)?.[0];
    if (!pageNumber) return escapeAssist(url.href);
    url.hash = `page=${pageNumber}`;
    return escapeAssist(url.href);
  } catch { return "#"; }
}
function escapeAssist(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char])); }
function escapeAssistUrl(value) { try { const url=new URL(String(value || ""), location.origin); return url.protocol === "https:" ? escapeAssist(url.href) : "#"; } catch { return "#"; } }
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: true });
    video.srcObject = stream;
    empty.hidden = true;
    updateCaptureGuide("Camera ready. Take before, use Match before, then take after.", "yellow");
  } catch {
    setStatus("Camera permission is blocked or unavailable on this browser.");
  }
}

function startRecording() {
  if (!stream) {
    setStatus("Start the camera first.");
    return;
  }
  if (!window.MediaRecorder) {
    setStatus("This browser cannot record video here. Use before/after frames for now.");
    return;
  }
  chunks = [];
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
  recorder = new MediaRecorder(stream, { mimeType });
  recorder.ondataavailable = (event) => {
    if (event.data?.size) chunks.push(event.data);
  };
  recorder.onstop = () => {
    packet.videoBlob = new Blob(chunks, { type: mimeType });
    packet.videoName = `fieldscan-${Date.now()}.webm`;
    packet.updatedAt = new Date().toISOString();
    if (recordingPreview && recordingReview) {
      if (recordingPreview.src?.startsWith("blob:")) URL.revokeObjectURL(recordingPreview.src);
      recordingPreview.src = URL.createObjectURL(packet.videoBlob);
      recordingReview.hidden = false;
    }
    setStatus(`Video ready: ${(packet.videoBlob.size / 1024 / 1024).toFixed(2)} MB. Review it, then upload or ask the manager.`);
  };
  recorder.start(1000);
  updateCaptureGuide("Recording. Move slow: wide, problem, hardware, safety test, after cleanup.", "yellow");
}

function stopRecording() {
  if (!recorder || recorder.state === "inactive") {
    setStatus("No active recording.");
    return;
  }
  recorder.stop();
}

function takeShot(kind) {
  if (!stream || !video.videoWidth) {
    setStatus("Start the camera first.");
    return;
  }
  const maxWidth = 1280;
  const ratio = Math.min(1, maxWidth / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * ratio);
  canvas.height = Math.round(video.videoHeight * ratio);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  packet[kind] = canvas.toDataURL("image/jpeg", 0.82);
  if (kind === "before") setMatchGuide(false);
  if (kind === "after") setMatchGuide(false);
  packet.updatedAt = new Date().toISOString();
  localStorage.setItem(CAPTURE_STORE, JSON.stringify(serializablePacket()));
  renderPacket();
  updateCaptureGuide(kind === "before" ? "Before saved. Tap Match before while taking after." : "Good - before/after pair is ready for manager review.", packet.before && packet.after ? "green" : "yellow");
}

function clearShots() {
  packet.before = "";
  packet.after = "";
  packet.videoBlob = null;
  if (recordingPreview?.src?.startsWith("blob:")) URL.revokeObjectURL(recordingPreview.src);
  if (recordingPreview) recordingPreview.removeAttribute("src");
  if (recordingReview) recordingReview.hidden = true;
  setMatchGuide(false);
  packet.updatedAt = new Date().toISOString();
  localStorage.setItem(CAPTURE_STORE, JSON.stringify(serializablePacket()));
  renderPacket();
  updateCaptureGuide("Packet cleared. Take before first.", "yellow");
}

function savePacket() {
  hydrateMeta();
  localStorage.setItem(CAPTURE_STORE, JSON.stringify(serializablePacket()));
  updateCaptureGuide("Draft saved on this phone/browser.", packet.before && packet.after ? "green" : "yellow");
}

async function uploadManagerHelp() {
  hydrateMeta();
  const question = String(document.querySelector("[data-manager-help-question]")?.value || "").trim();
  if (!question) {
    updateCaptureGuide("Write the exact private question you need the manager to answer.", "red");
    return;
  }
  if (!packet.videoBlob && !packet.before && !packet.after) {
    updateCaptureGuide("Record a help video or capture at least one useful frame first.", "red");
    return;
  }
  const captureMeta = { kind: "manager-help", question, siteAssessment: packet.siteAssessment || {}, siteGuide: packet.siteGuide || {}, equipmentIdentity: packet.equipmentIdentity || {} };
  const views = ["Technician private help request", "AI advice is advisory only", ...(packet.siteGuide?.requiredCapture || []).map((item) => `AI requests: ${item}`)];
  const uploads = [];
  if (packet.videoBlob) uploads.push(() => uploadFile(packet.videoBlob, packet.videoName || "manager-help.webm", "video", "Manager help request video", { managerReviewRequired: true, captureMeta, views }));
  if (packet.before) uploads.push(() => uploadFile(dataUrlToBlob(packet.before), "help-context.jpg", "frame", "Help context frame", { managerReviewRequired: true, captureMeta, views }));
  if (packet.after) uploads.push(() => uploadFile(dataUrlToBlob(packet.after), "help-detail.jpg", "frame", "Help detail frame", { managerReviewRequired: true, captureMeta, views }));
  updateCaptureGuide("Sending the private help request to the manager review desk...", "yellow");
  const results = [];
  for (const upload of uploads) results.push(await upload());
  if (results.some((item) => !item.ok)) {
    updateCaptureGuide(results.some((item) => item.response?.status === 401) ? "Sign in, then retry. The recording remains on this device." : "Help upload failed. The recording remains on this device; check signal and retry.", "red");
    return;
  }
  const messageResponse = await fetch("/api/fieldproof", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "help-request", jobId: packet.jobId, subject: `Private help request: ${packet.jobId}`, message: question, aiStatus: packet.siteGuide?.status || "not run" })
  }).catch(() => null);
  renderTechStatus([...results].reverse().find((item) => item.techStatus)?.techStatus);
  updateCaptureGuide(messageResponse?.ok ? "Private help request sent. Stay in a safe state and check here for the manager reply." : "Video reached manager review; the question notification may be delayed.", messageResponse?.ok ? "green" : "yellow");
  await checkManagerReplies();
}

async function checkManagerReplies() {
  hydrateMeta();
  if (!packet.jobId || !managerThread) return;
  managerThread.hidden = false;
  managerThread.innerHTML = "<strong>Checking private manager thread...</strong>";
  const day = new Date().toISOString().slice(0, 10);
  const response = await fetch(`/api/fieldproof?day=${encodeURIComponent(day)}&bucket=all&minScore=0`, { cache: "no-store" }).catch(() => null);
  const payload = await response?.json?.().catch(() => ({}));
  if (!response?.ok) {
    managerThread.innerHTML = `<strong>Manager thread unavailable</strong><span>${response?.status === 401 ? "Sign in to check replies." : "Your sent packet is still stored for manager review."}</span>`;
    return;
  }
  const messages = (payload.inbox || []).filter((item) => item.related_job_id === packet.jobId).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  managerThread.innerHTML = `<strong>Private manager thread</strong>${messages.length ? messages.map((item) => `<article><b>${escapeAssist(item.sender_role || "team")}</b><span>${escapeAssist(item.body)}</span><small>${escapeAssist(item.created_at || "")}</small></article>`).join("") : "<span>No reply yet. Stay in the safe state shown in your packet.</span>"}`;
}
async function uploadPacket() {
  hydrateMeta();
  if (!packet.before || !packet.after) {
    updateCaptureGuide("Before and after frames are required before upload.", "red");
    return;
  }
  const uploads = [
    () => uploadFile(dataUrlToBlob(packet.before), "before.jpg", "frame", "Before frame"),
    () => uploadFile(dataUrlToBlob(packet.after), "after.jpg", "frame", "After frame"),
  ];
  if (packet.videoBlob) {
    uploads.push(() => uploadFile(packet.videoBlob, packet.videoName || "fieldscan.webm", "video", "Phone scan video"));
  }
  updateCaptureGuide("Uploading packet to manager review...", "yellow");
  const results = [];
  for (const upload of uploads) results.push(await upload());
  const failed = results.filter((item) => !item.ok);
  if (failed.length) {
    const unauthorized = failed.some((item) => item.response?.status === 401);
    updateCaptureGuide(unauthorized ? "Login required before upload. Open Login, then return to this saved packet." : "Upload failed. Check signal or reduce video length, then retry.", "red");
    return;
  }
  const techStatus = [...results].reverse().find((item) => item.techStatus)?.techStatus;
  renderTechStatus(techStatus);
  updateCaptureGuide("Good - uploaded. Manager can compare before/after in the dash now.", "green");
  localStorage.setItem(CAPTURE_STORE, JSON.stringify(serializablePacket()));
}

async function uploadFile(blob, name, assetType, label, options = {}) {
  const form = new FormData();
  form.set("jobId", packet.jobId || `job-upload-${Date.now()}`);
  form.set("trade", packet.trade || "Garage Doors");
  form.set("client", packet.client || "Field upload");
  form.set("tech", packet.tech || "Field tech");
  form.set("assetType", assetType);
  form.set("label", label);
  form.set("note", packet.note || "");
  form.set("managerReviewRequired", options.managerReviewRequired ? "true" : "false");
  form.set("captureMeta", JSON.stringify(options.captureMeta || {}));
  form.set("views", JSON.stringify([
    ...(packet.checks || []).filter((item) => item.checked).map((item) => item.label),
    "Same angle matched angle before after direct comparison",
    assetType === "video" ? "Walk video" : label,
    ...(options.views || []),
  ]));
  form.set("file", blob, name);
  const response = await fetch(uploadApi, { method: "POST", body: form }).catch(() => null);
  const data = await response?.json?.().catch(() => ({}));
  return { ok: Boolean(response?.ok), response, techStatus: data?.techStatus };
}

function hydrateMeta() {
  packet.jobId = document.querySelector("[data-capture-job]")?.value.trim() || packet.jobId || `job-upload-${Date.now()}`;
  packet.trade = document.querySelector("[data-capture-trade]")?.value.trim() || packet.trade || "Garage Doors";
  packet.client = document.querySelector("[data-capture-client]")?.value.trim() || packet.client || "Field upload";
  packet.tech = document.querySelector("[data-capture-tech]")?.value.trim() || packet.tech || "Field tech";
  packet.note = document.querySelector("[data-capture-note]")?.value || "";
  packet.checks = [...document.querySelectorAll(".capture-checklist input[type='checkbox']")].map((input, index) => ({
    index,
    label: input.value || input.closest("label")?.textContent.trim() || "Checklist item",
    checked: input.checked,
  }));
  packet.updatedAt = new Date().toISOString();
}

function renderPacket() {
  const savedFields = {
    "[data-capture-job]": packet.jobId,
    "[data-capture-client]": packet.client,
    "[data-capture-tech]": packet.tech,
    "[data-capture-note]": packet.note,
  };
  for (const [selector, value] of Object.entries(savedFields)) {
    const field = document.querySelector(selector);
    if (field && value && !field.value) field.value = value;
  }
  const tradeSelect = document.querySelector("[data-capture-trade]");
  if (tradeSelect && packet.trade) tradeSelect.value = packet.trade;
  for (const [index, input] of [...document.querySelectorAll(".capture-checklist input[type='checkbox']")].entries()) {
    const saved = (packet.checks || []).find((item) => item.index === index || item.label === input.value);
    if (saved) input.checked = Boolean(saved.checked);
  }
  setMatchGuide(false);
  updateCaptureGuide(captureGuidance().message, captureGuidance().tone);
  for (const key of ["before", "after"]) {
    previews[key].src = packet[key] || "";
    previews[key].toggleAttribute("hidden", !packet[key]);
  }
}

function toggleMatchGuide() {
  if (!packet.before) {
    setStatus("Take the before shot first, then tap Match before while lining up the after shot.");
    return;
  }
  setMatchGuide(matchGuide?.hidden !== false);
}

function setMatchGuide(visible) {
  if (!matchGuide) return;
  if (!visible || !packet.before) {
    matchGuide.hidden = true;
    matchGuide.removeAttribute("src");
    return;
  }
  matchGuide.src = packet.before;
  matchGuide.hidden = false;
  updateCaptureGuide("Before shot is overlaid. Line up the same angle, then take after.", "yellow");
}
function captureGuidance() {
  if (packet.before && packet.after) return { tone: "green", message: "Good - before and after shots are ready. Upload packet." };
  if (packet.before) return { tone: "yellow", message: "Before saved. Tap Match before, line up the same angle, then take after." };
  return { tone: "yellow", message: "AI guide: take a clear before shot first. Same angle will be used for after." };
}

function updateCaptureGuide(message, tone = "yellow") {
  if (guideEl) {
    guideEl.className = `capture-ai-guide ${tone}`;
    guideEl.innerHTML = `<strong>${tone === "green" ? "Good" : tone === "red" ? "Needs shot" : "AI capture guide"}</strong><span>${message}</span>`;
  }
  if (cameraFrame) cameraFrame.className = `camera-frame ${tone}`;
  if (verdictEl) {
    verdictEl.className = `camera-verdict ${tone}`;
    verdictEl.textContent = tone === "green" ? "Good - snap/upload ready" : tone === "red" ? "Needs required shot" : message;
  }
  setStatus(message);
}
function dataUrlToBlob(dataUrl) {
  const [meta, data] = dataUrl.split(",");
  const type = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type });
}

function serializablePacket() {
  return { ...packet, videoBlob: undefined };
}

function loadPacket() {
  try {
    return JSON.parse(localStorage.getItem(CAPTURE_STORE) || "{}") || {};
  } catch {
    return {};
  }
}

function renderTechStatus(info) {
  if (!releaseEl) return;
  if (!info) { releaseEl.hidden = true; return; }
  const hold = info.status === "hold";
  releaseEl.hidden = false;
  releaseEl.className = `capture-release ${hold ? "hold" : "released"}`;
  const scoreLine = info.showScores === false ? "Score hidden by manager." : `Current packet score line: ${info.score ?? "pending"}`;
  releaseEl.innerHTML = `<strong>${hold ? "Hold on site" : "Approved - you are released"}</strong><span>${info.message || "Manager review pending."}</span><small>${scoreLine}</small>`;
  if (!hold) setTimeout(() => { releaseEl.hidden = true; }, 6000);
}

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}
