const FIELD_SCAN_STORAGE = "amh-fieldscan-review-v2";
const api = "/api/fieldscan";
const agentApi = "/api/fieldscan-agents";

const seedJobs = [
  {
    id: "job-gd-1047",
    date: todayKey(0),
    tech: "M. Rivera",
    client: "Smith Garage Door",
    type: "Garage Doors",
    status: "ready-review",
    priority: "urgent",
    score: 88,
    confidence: 92,
    summary: "Good coverage. Needs spring/cable close-up before final approval.",
    views: ["Wide opening", "Before condition", "Tracks", "Springs", "After run test"],
    safety: false,
    safetyNotes: "",
    notes: [],
  },
  {
    id: "job-gd-1048",
    date: todayKey(0),
    tech: "S. Knox",
    client: "Parkside Garage Door",
    type: "Garage Doors",
    status: "catalog",
    priority: "normal",
    score: 100,
    confidence: 96,
    summary: "Complete scan packet. Track, rollers, opener, force reversal, and cleanup are ready to store as a good example.",
    views: ["Wide opening", "Tracks", "Rollers", "Opener", "Safety reversal", "Cleanup"],
    safety: false,
    safetyNotes: "",
    notes: [],
  },
  {
    id: "job-gd-1049",
    date: todayKey(0),
    tech: "D. Carter",
    client: "Westside Garage Door",
    type: "Garage Doors",
    status: "needs-fix",
    priority: "urgent",
    score: 64,
    confidence: 81,
    summary: "Missing cable drum close-up and final safety test view. Manager should inspect before closeout.",
    views: ["Wide opening", "Before condition", "Opener"],
    safety: true,
    safetyNotes: "Final run/safety test not shown.",
    notes: [],
  },
];

const state = loadState();
normalizeFieldScanState(state);
const els = {};
let apiOnline = false;
const manualReviewState = {
  sourceBatch: null,
  batch: null,
  items: [],
  selected: new Set(),
  status: "Choose a reviewed batch JSON file or load a staged batch ID.",
  tone: "idle",
  busy: false,
  result: null,
};
const requiredViews = [
  "Wide opening",
  "Before condition",
  "Track alignment",
  "Rollers and brackets",
  "Springs/cables/drums",
  "Opener and sensors",
  "Run/reversal test",
  "After cleanup",
];

const windowTemplates = [
  { start: 0, end: 15, label: "0:00-0:15", title: "Before sweep" },
  { start: 15, end: 35, label: "0:15-0:35", title: "Hardware close-ups" },
  { start: 35, end: 55, label: "0:35-0:55", title: "Safety proof" },
  { start: 55, end: 75, label: "0:55-1:15", title: "After/run test" },
];

document.addEventListener("DOMContentLoaded", async () => {
  els.root = document.querySelector("[data-fieldproof]");
  if (!els.root) return;
  els.day = els.root.querySelector("[data-fp-day]");
  els.bucket = els.root.querySelector("[data-fp-bucket]");
  els.score = els.root.querySelector("[data-fp-score]");
  els.list = els.root.querySelector("[data-fp-list]");
  els.profile = els.root.querySelector("[data-fp-profile]");
  els.log = els.root.querySelector("[data-fp-log]");
  els.alerts = els.root.querySelector("[data-fp-alerts]");
  els.trades = els.root.querySelector("[data-fp-trades]");
  els.agents = els.root.querySelector("[data-fp-agents]");
  els.storage = els.root.querySelector("[data-fp-storage]");
  els.manualReview = els.root.querySelector("[data-manual-review]");
  els.manualSummary = els.root.querySelector("[data-manual-summary]");
  els.manualItems = els.root.querySelector("[data-manual-items]");
  els.manualStatus = els.root.querySelector("[data-manual-status]");
  els.manualBatchId = els.root.querySelector("[data-manual-batch-id]");
  els.stage = els.root.querySelector("[data-fp-stage]");
  els.frames = els.root.querySelector("[data-fp-frames]");
  els.findingsPanel = els.root.querySelector("[data-fp-findings]");
  els.decision = els.root.querySelector("[data-fp-decision]");
  els.queueCount = els.root.querySelector("[data-fp-queue-count]");
  els.day.value = state.selectedDay || todayKey(0);
  bind();
  await syncFromApi();
  render();
});

function bind() {
  els.day.addEventListener("change", async () => {
    state.selectedDay = els.day.value;
    saveState();
    await syncFromApi();
    render();
  });
  els.bucket.addEventListener("change", async () => {
    await syncFromApi();
    render();
  });
  els.score.addEventListener("input", render);
  els.root.addEventListener("click", async (event) => {
    const select = event.target.closest("[data-fp-select]");
    if (select) {
      state.selectedJobId = select.dataset.fpSelect;
      saveState();
      render();
      return;
    }
    const jump = event.target.closest("[data-fp-jump]");
    if (jump) {
      event.preventDefault();
      els.bucket.value = jump.dataset.fpJump;
      await syncFromApi();
      render();
      return;
    }
    const seek = event.target.closest("[data-fp-seek]");
    if (seek) {
      state.selectedWindow = Number(seek.dataset.fpSeek || 0);
      saveState();
      render();
      return;
    }
    const techOpen = event.target.closest("[data-tech-open]");
    if (techOpen) { state.selectedTechId = techOpen.dataset.techOpen; state.activeTechTab = "jobs"; saveState(); render(); return; }
    const techTab = event.target.closest("[data-tech-tab]");
    if (techTab) { state.activeTechTab = techTab.dataset.techTab; saveState(); render(); return; }
    const tempLogin = event.target.closest("[data-tech-temp]");
    if (tempLogin) { setTempLogin(tempLogin.dataset.techTemp); render(); return; }
    const sendLogin = event.target.closest("[data-tech-login-send]");
    if (sendLogin) { state.activity.unshift(`${techName(sendLogin.dataset.techLoginSend)}: login resend queued to email/text`); saveState(); render(); return; }
    const previewReport = event.target.closest("[data-tech-report-preview]");
    if (previewReport) { state.reportDraft = buildTechReport(previewReport.dataset.techReportPreview, previewReport.dataset.reportType || "weekly"); saveState(); render(); return; }
    const sendReport = event.target.closest("[data-tech-report-send]");
    if (sendReport) { await sendTechReport(sendReport.dataset.techReportSend); render(); return; }
    const videoJump = event.target.closest("[data-video-jump]");
    if (videoJump) {
      const player = els.stage.querySelector("[data-primary-review-video]");
      if (player) player.currentTime = Math.max(0, Math.min(Number.isFinite(player.duration) ? player.duration : Infinity, player.currentTime + Number(videoJump.dataset.videoJump || 0)));
      return;
    }
    const videoToggle = event.target.closest("[data-video-toggle]");
    if (videoToggle) {
      const player = els.stage.querySelector("[data-primary-review-video]");
      if (player) player.paused ? player.play().catch(() => {}) : player.pause();
      return;
    }
    const fillReply = event.target.closest("[data-fill-manager-reply]");
    if (fillReply) {
      const field = els.decision.querySelector("[data-manager-reply-form] textarea[name=message]");
      if (field) { field.value = fillReply.dataset.fillManagerReply || ""; field.focus(); }
      return;
    }
    const action = event.target.closest("[data-fp-action]");
    if (!action) return;
    const job = selectedJob();
    if (!job) return;
    const type = action.dataset.fpAction;
    if (type === "estimate") {
      await postAction(job, "estimate", { mode: "manager-confirm" });
      state.activity.unshift(`${job.id}: draft bid sent to boss confirmation`);
      await syncFromApi();
      render();
      return;
    }
    if (type === "run-teams") {
      await queueAgent("run-teams", { trade: job.type, jobId: job.id, views: job.views, summary: job.summary, score: job.score });
      state.activity.unshift(`${job.id}: ${job.type} teams ran local/free review`);
      await syncFromApi();
      render();
      return;
    }
    if (type === "coach") {
      await queueAgent("learn", { trade: job.type, jobId: job.id, instruction: reshootDirections(job).join(" ") });
      state.activity.unshift(`${job.id}: tech reshoot directions queued`);
      render();
      return;
    }
    if (type === "unsafe") {
      job.safety = true;
      job.safetyNotes = "Unsafe practice flagged by manager.";
      await postAction(job, "unsafe", { detail: job.safetyNotes });
      updateJob(job, "unsafe", "Unsafe practice flagged for manager view.");
      return;
    }
    const status = { pass: "approved", fail: "needs-fix", agree: "reviewed", store: "stored" }[type];
    const message = {
      pass: "Manager approved the scan packet.",
      fail: "Manager sent the scan packet back for more coverage.",
      agree: "Manager agreed with the AI screening score.",
      store: "Scan packet stored in the good-job catalog.",
    }[type];
    await postAction(job, type);
    updateJob(job, status, message);
  });
  els.root.addEventListener("submit", async (event) => {
    if (event.target.matches("[data-company-form]")) {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      state.company = { id: "company", ...data };
      await postGeneral("company-settings", data);
      state.activity.unshift("Company settings saved for packets, invites, and tech login screens");
      saveState(); render(); return;
    }
    if (event.target.matches("[data-tech-settings-form]")) {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      data.showScores = Boolean(event.target.querySelector("[name=showScores]")?.checked);
      data.autoSend = Boolean(event.target.querySelector("[name=autoSend]")?.checked);
      await saveTechSettings(data);
      render(); return;
    }
    if (event.target.matches("[data-tech-note-form]")) {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      await addTechNote(data.techId, data.note);
      event.target.reset(); render(); return;
    }
    if (event.target.matches("[data-score-feedback-form]")) {
      event.preventDefault();
      const job = selectedJob();
      const data = Object.fromEntries(new FormData(event.target).entries());
      await postAction(job, "score-feedback", data);
      state.activity.unshift(`${job.id}: manager taught AI scoring - ${data.verdict}, manager ${data.managerScore}`);
      event.target.reset(); await syncFromApi(); render(); return;
    }
    if (event.target.matches("[data-fp-learning-form]")) {
      event.preventDefault();
      const form = event.target;
      const data = new FormData(form);
      const instruction = String(data.get("instruction") || "").trim();
      const trade = String(data.get("trade") || "Garage Doors").trim();
      if (!instruction) return;
      await postGeneral("learning", { trade, instruction });
      await queueAgent("learn", { trade, instruction });
      state.activity.unshift(`learning: ${trade} - ${instruction}`);
      form.reset();
      form.querySelector("[name=trade]").value = trade || "Garage Doors";
      saveState();
      await syncFromApi();
      render();
      return;
    }
    if (!event.target.matches("[data-fp-note-form]")) return;
    event.preventDefault();
    const form = event.target;
    const job = selectedJob();
    const note = String(new FormData(form).get("note") || "").trim();
    if (!job || !note) return;
    await postAction(job, "note", { note });
    job.notes.unshift({ at: new Date().toISOString(), note });
    state.activity.unshift(`${job.id}: note added`);
    form.reset();
    saveState();
    await syncFromApi();
    render();
  });
  bindManualReview();
}

function bindManualReview() {
  if (!els.manualReview) return;
  const fileInput = els.manualReview.querySelector("[data-manual-file]");
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const sourceBatch = Array.isArray(parsed) ? { records: parsed } : parsed;
      if (!sourceBatch || !Array.isArray(sourceBatch.records) || !sourceBatch.records.length) throw new Error("Batch JSON must contain a non-empty records array.");
      if (sourceBatch.records.length > 100) throw new Error("A batch may contain at most 100 records.");
      manualReviewState.sourceBatch = sourceBatch;
      manualReviewState.batch = {
        id: sourceBatch.batchId || "not-staged",
        producer: sourceBatch.producer || "fieldscan-indexer",
        source_type: sourceBatch.sourceType || "manual-index",
        records_total: sourceBatch.records.length,
        status: "local-preview",
        manifest_sha256: "computed by server at staging",
      };
      manualReviewState.items = sourceBatch.records.map(localManualItem);
      manualReviewState.selected.clear();
      manualReviewState.result = null;
      setManualStatus(`Loaded ${sourceBatch.records.length} local records. Inspect them, then stage candidates.`, "ready");
      renderManualReview();
    } catch (error) {
      manualReviewState.sourceBatch = null;
      setManualStatus(error.message || "Could not read this JSON file.", "error");
      renderManualReview();
    }
  });

  els.manualReview.querySelector("[data-manual-ingest-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!manualReviewState.sourceBatch || manualReviewState.busy) return;
    const source = manualReviewState.sourceBatch;
    await runManualTask("Staging candidate records...", async () => {
      const result = await managerAgentRequest("manual-ingest", {
        method: "POST",
        body: {
          batchId: source.batchId,
          producer: source.producer,
          sourceType: source.sourceType,
          note: source.note,
          records: source.records,
        },
      });
      els.manualBatchId.value = result.batchId;
      setManualStatus(`Staged ${result.recordsAccepted}/${result.recordsTotal}; ${result.recordsRejected} rejected. Nothing was promoted.`, result.recordsRejected ? "hold" : "ready");
      await loadManualBatch(result.batchId, { preserveStatus: true });
    });
  });

  els.manualReview.querySelector("[data-manual-load]")?.addEventListener("click", async () => {
    const batchId = String(els.manualBatchId?.value || "").trim();
    if (!batchId || manualReviewState.busy) return;
    await runManualTask("Loading staged batch...", () => loadManualBatch(batchId));
  });

  els.manualReview.querySelector("[data-manual-select-staged]")?.addEventListener("click", () => {
    manualReviewState.selected = new Set(manualReviewState.items.filter(isSelectableManualItem).map((item) => item.id));
    renderManualReview();
  });
  els.manualReview.querySelector("[data-manual-clear-selection]")?.addEventListener("click", () => {
    manualReviewState.selected.clear();
    renderManualReview();
  });
  els.manualItems?.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-manual-item-select]");
    if (!checkbox) return;
    if (checkbox.checked) manualReviewState.selected.add(checkbox.value);
    else manualReviewState.selected.delete(checkbox.value);
    renderManualSelectionCount();
  });

  els.manualReview.querySelector("[data-manual-promote-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (manualReviewState.busy) return;
    const batchId = manualReviewState.batch?.id;
    if (!batchId || batchId === "not-staged") return setManualStatus("Stage or load a server batch before promotion.", "error");
    const itemIds = [...manualReviewState.selected];
    if (!itemIds.length) return setManualStatus("Select at least one staged candidate.", "error");
    const form = event.target;
    const confirmations = Object.fromEntries(["exactIdentity", "sourcePages", "rights", "qualifiedReview", "revisionPolicy"].map((key) => [key, Boolean(form.elements[key]?.checked)]));
    const missing = Object.entries(confirmations).filter(([, value]) => !value).map(([key]) => key);
    if (missing.length) return setManualStatus("All five manager confirmations are required.", "error");
    await runManualTask("Promoting selected verified candidates...", async () => {
      const result = await managerAgentRequest("manual-promote", {
        method: "POST",
        body: { batchId, itemIds, confirmations, note: String(form.elements.note?.value || "").trim() },
      });
      manualReviewState.result = result;
      manualReviewState.selected.clear();
      form.reset();
      setManualStatus(`Promotion complete: ${result.promoted} promoted, ${result.held} held.`, result.held ? "hold" : "ready");
      await loadManualBatch(batchId, { preserveStatus: true });
    });
  });
  renderManualReview();
}

async function runManualTask(message, task) {
  manualReviewState.busy = true;
  setManualStatus(message, "busy");
  renderManualReview();
  try {
    await task();
  } catch (error) {
    setManualStatus(error.message || "The manager operation failed.", "error");
  } finally {
    manualReviewState.busy = false;
    renderManualReview();
  }
}

async function loadManualBatch(batchId, options = {}) {
  const result = await managerAgentRequest("manual-ingest-batch", { params: { batchId } });
  manualReviewState.batch = result.batch;
  manualReviewState.items = result.items || [];
  manualReviewState.sourceBatch = null;
  manualReviewState.selected = new Set(manualReviewState.items.filter(isSelectableManualItem).map((item) => item.id));
  els.manualBatchId.value = result.batch.id;
  if (!options.preserveStatus) setManualStatus(`Loaded ${result.items.length} records. Review every source, page, identity, and hash before promotion.`, "ready");
  return result;
}

async function managerAgentRequest(route, options = {}) {
  const method = options.method || "GET";
  const url = new URL(agentApi, window.location.origin);
  url.searchParams.set("route", route);
  for (const [key, value] of Object.entries(options.params || {})) if (value) url.searchParams.set(key, value);
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: method === "POST" ? JSON.stringify({ route, ...(options.body || {}) }) : undefined,
  }).catch(() => null);
  if (!response) throw new Error("FieldScan manager API is unreachable.");
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const access = response.status === 401 ? "Sign in before using manager review." : response.status === 403 ? "Your account needs FieldScan manager access." : "";
    throw new Error(access || payload.error || `Manager API failed (${response.status}).`);
  }
  return payload;
}
function localManualItem(record, index) {
  const id = String(record.id || record.external_id || `local-${index}`);
  const document = record.document && typeof record.document === "object" ? record.document : {};
  const exactModels = Array.isArray(record.exactCoveredModelNumbers) ? record.exactCoveredModelNumbers.join(" / ") : "";
  return {
    id,
    external_id: id,
    item_type: String(record.itemType || record.item_type || (record.topicEvidence ? "manual-evidence" : "unknown")),
    manual_id: String(record.manualId || record.manual_id || ""),
    manufacturer: String(record.manufacturer || ""),
    model_pattern: String(record.modelPattern || record.model_pattern || exactModels || record.productModelFamily || ""),
    source_url: String(record.sourceUrl || record.source_url || document.officialSourceUrl || ""),
    source_page: manualText(record.sourcePage || record.sourcePages || record.source_page || document.exactCitedPagesSections),
    content_checksum_sha256: String(record.contentChecksumSha256 || record.checksum_sha256 || ""),
    payload_sha256: "computed by server at staging",
    validation_status: "not-staged",
    review_status: "candidate",
    validationErrors: [],
    payload: record,
  };
}

function isSelectableManualItem(item) {
  return item.validation_status === "staged" && item.review_status === "candidate";
}

function setManualStatus(message, tone = "idle") {
  manualReviewState.status = message;
  manualReviewState.tone = tone;
  if (els.manualStatus) {
    els.manualStatus.textContent = message;
    els.manualStatus.dataset.tone = tone;
  }
}

function renderManualReview() {
  if (!els.manualReview) return;
  const batch = manualReviewState.batch;
  const counts = manualReviewState.items.reduce((result, item) => {
    const key = item.validation_status || "unknown";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  els.manualStatus.textContent = manualReviewState.status;
  els.manualStatus.dataset.tone = manualReviewState.tone;
  els.manualSummary.innerHTML = batch ? `<article><span>Batch</span><strong>${escapeHtml(batch.id)}</strong><small>${escapeHtml(batch.producer || "unknown producer")}</small></article>
    <article><span>Status</span><strong>${escapeHtml(batch.status || "local")}</strong><small>${Number(batch.records_total || manualReviewState.items.length)} records</small></article>
    <article><span>Staged</span><strong>${counts.staged || 0}</strong><small>candidate records</small></article>
    <article><span>Held</span><strong>${manualReviewState.items.filter((item) => !isSelectableManualItem(item) && item.review_status !== "promoted").length}</strong><small>review or repair</small></article>
    <article class="manifest"><span>Manifest SHA-256</span><code>${escapeHtml(batch.manifest_sha256 || "not available")}</code></article>` : `<p>No batch loaded. Upload the prepared JSON or enter a staged batch ID.</p>`;
  els.manualItems.innerHTML = manualReviewState.items.map(manualItemCard).join("") || `<div class="fp-manual-empty">No manual records loaded.</div>`;
  const stageButton = els.manualReview.querySelector("[data-manual-stage]");
  if (stageButton) stageButton.disabled = manualReviewState.busy || !manualReviewState.sourceBatch;
  const loadButton = els.manualReview.querySelector("[data-manual-load]");
  if (loadButton) loadButton.disabled = manualReviewState.busy;
  const promoteButton = els.manualReview.querySelector("[data-manual-promote]");
  if (promoteButton) promoteButton.disabled = manualReviewState.busy || !manualReviewState.selected.size;
  const result = manualReviewState.result;
  const resultPanel = els.manualReview.querySelector("[data-manual-result]");
  if (resultPanel) {
    resultPanel.innerHTML = result ? `<strong>${result.promoted} promoted / ${result.held} held</strong>
      ${(result.promotedItems || []).map((item) => `<span class="promoted">Promoted ${escapeHtml(item.itemType)}: ${escapeHtml(item.externalId)}</span>`).join("")}
      ${(result.heldItems || []).map((item) => `<span class="held">Held ${escapeHtml(item.itemType)}: ${escapeHtml(item.externalId)} — ${escapeHtml(item.reason)}</span>`).join("")}
      <small>${escapeHtml(result.instruction || "")}</small>` : "";
  }
  renderManualSelectionCount();
}

function renderManualSelectionCount() {
  const count = els.manualReview?.querySelector("[data-manual-selection-count]");
  if (count) count.textContent = `${manualReviewState.selected.size} selected`;
  const promoteButton = els.manualReview?.querySelector("[data-manual-promote]");
  if (promoteButton) promoteButton.disabled = manualReviewState.busy || !manualReviewState.selected.size;
}

function manualItemCard(item) {
  const payload = item.payload || {};
  const document = payload.document && typeof payload.document === "object" ? payload.document : {};
  const sourceUrl = safeHttpsUrl(item.source_url || payload.sourceUrl || payload.source_url || document.officialSourceUrl);
  const page = manualText(item.source_page || payload.sourcePage || payload.sourcePages || payload.source_page || document.exactCitedPagesSections) || "not cited";
  const sourceLink = manualSourceLink(sourceUrl, page);
  const contentHash = item.content_checksum_sha256 || payload.contentChecksumSha256 || payload.checksum_sha256 || "missing";
  const payloadHash = item.payload_sha256 || "not computed";
  const title = document.exactTitle || payload.title || payload.parameterName || payload.terminalLabel || payload.label || payload.accessoryModel || item.external_id;
  const exactModels = Array.isArray(payload.exactCoveredModelNumbers) ? payload.exactCoveredModelNumbers.join(" / ") : "";
  const identity = [item.manufacturer || payload.manufacturer, item.model_pattern || payload.modelPattern || payload.productModelFamily || exactModels, payload.boardPart, payload.boardRevision].filter(Boolean).join(" / ") || "No equipment identity in record";
  const revision = document.revisionVersionDate || payload.versionLabel || payload.revision || "revision not recorded";
  const neededDetails = manualNeededDetails(payload);
  const status = item.review_status === "promoted" ? "promoted" : item.validation_status || "unknown";
  const selectable = isSelectableManualItem(item);
  const errors = Array.isArray(item.validationErrors) ? item.validationErrors : [];
  const statusTone = selectable ? "staged" : status === "promoted" ? "promoted" : "held";
  return `<article class="fp-manual-item ${statusTone}">
    <label class="fp-manual-select"><input type="checkbox" data-manual-item-select value="${escapeAttr(item.id)}" ${manualReviewState.selected.has(item.id) ? "checked" : ""} ${selectable ? "" : "disabled"}/><span>${selectable ? "Select candidate" : "Held from selection"}</span></label>
    <div class="fp-manual-item-head"><div><span>${escapeHtml(item.item_type || "unknown")}</span><h4>${escapeHtml(title)}</h4></div><b>${escapeHtml(status)}</b></div>
    <dl><div><dt>Canonical ID</dt><dd>${escapeHtml(item.external_id)}</dd></div><div><dt>Identity</dt><dd>${escapeHtml(identity)}</dd></div><div><dt>Manual parent</dt><dd>${escapeHtml(item.manual_id || (item.item_type === "manual" ? "this record" : "missing"))}</dd></div><div><dt>Source page</dt><dd>${escapeHtml(page)}</dd></div></dl>
    <section class="fp-manual-needed" data-manual-needed-details><div class="fp-manual-needed-head"><strong>Needed details</strong><span>Use the card, then verify the source</span></div>${neededDetails.length ? neededDetails.map((detail) => `<article data-tone="${escapeAttr(detail.tone)}"><b>${escapeHtml(detail.label)}</b><p>${escapeHtml(detail.text)}</p>${detail.citation ? `<small>${escapeHtml(detail.citation)}</small>` : ""}</article>`).join("") : `<p class="fp-manual-needed-empty">No concise field detail is stored for this record. Open the official source before relying on it.</p>`}</section>
    <div class="fp-manual-source-meta"><span>Official document</span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(revision)} · ${escapeHtml(page)}</small></div>
    <div class="fp-manual-proof"><span>Content SHA-256</span><code>${escapeHtml(contentHash)}</code><span>Payload SHA-256</span><code>${escapeHtml(payloadHash)}</code></div>
    ${sourceLink ? `<a class="fp-manual-source" href="${escapeAttr(sourceLink)}" target="_blank" rel="noopener noreferrer" aria-label="Double-check official manual at ${escapeAttr(page)}">Double-check official manual · ${escapeHtml(page)} ↗</a>` : `<span class="fp-manual-source missing">No safe HTTPS official-manual link</span>`}
    ${errors.length ? `<ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>` : ""}
    ${!selectable && status !== "promoted" ? `<p class="fp-manual-hold">Not promotable: ${escapeHtml(manualHoldReason(item))}</p>` : ""}
  </article>`;
}

function manualNeededDetails(payload) {
  const topicEvidence = payload.topicEvidence && typeof payload.topicEvidence === "object" ? payload.topicEvidence : {};
  const topics = [
    ["Emergency first", "emergency_first", "emergencyFirst"],
    ["Safety / access", "safe_access", "safeAccess"],
    ["What to check", "diagnostics"],
    ["Functional test", "functional_testing", "functionalTesting"],
    ["Compatibility", "compatibility"],
    ["Replacement / lifecycle", "replacement_expiry", "replacementExpiry"],
    ["Manager / licensed hold", "manager_licensed_professional_holds", "managerHold", "licensedProfessionalHold", "serviceBoundaries"],
  ];
  const details = [];
  for (const [label, ...keys] of topics) {
    const value = keys.map((key) => topicEvidence[key] ?? payload[key]).find((entry) => entry != null);
    const detail = manualEvidenceDetail(label, value);
    if (detail) details.push(detail);
    if (details.length === 4) break;
  }
  if (details.length) return details;
  const fallback = [
    ["Field steps", payload.techSteps],
    ["Connection detail", payload.connectionNotes || payload.terminalFunction],
    ["Applicability", payload.appliesTo || payload.description || payload.summary || payload.note],
  ];
  return fallback.map(([label, value]) => {
    const text = manualText(value);
    return text ? { label, text, citation: manualText(payload.sourcePage || payload.sourcePages), tone: "covered" } : null;
  }).filter(Boolean).slice(0, 3);
}

function manualEvidenceDetail(label, value) {
  const entry = Array.isArray(value) ? value.find(Boolean) : value;
  if (!entry) return null;
  if (typeof entry === "string") return { label, text: entry, citation: "", tone: "covered" };
  if (typeof entry !== "object") return null;
  const text = manualText(entry.fact || entry.statement || entry.text || entry.summary || entry.description);
  if (!text || entry.status === "not_stated" || entry.status === "not_applicable") return null;
  const citations = Array.isArray(entry.citations) ? entry.citations : [];
  const citation = citations.map((item) => manualText(item?.pageSection || item?.locator || item?.sourcePage)).filter(Boolean).join(" · ");
  const tone = entry.status === "hold" || /hold/i.test(label) ? "hold" : "covered";
  return { label, text, citation, tone };
}

function manualText(value) {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (Array.isArray(value)) return value.map(manualText).filter(Boolean).join(" · ");
  return "";
}

function manualSourceLink(sourceUrl, page) {
  const safeUrl = safeHttpsUrl(sourceUrl);
  if (!safeUrl) return "";
  try {
    const url = new URL(safeUrl);
    if (/\.pdf$/i.test(url.pathname)) {
      const match = String(page || "").match(/(?:pdf\s*)?(?:p(?:age)?\.?\s*)?(\d+)/i);
      if (match) url.hash = `page=${match[1]}`;
    }
    return url.href;
  } catch {
    return safeUrl;
  }
}

function manualHoldReason(item) {
  if (item.validation_status === "not-staged") return "local preview only; stage it first";
  if (item.validation_status === "revision-review") return "possible revision; create and verify a new versioned manual ID";
  if (item.validation_status === "needs-content-hash") return "verified content SHA-256 is missing";
  if (item.validation_status === "duplicate") return "same verified document hash already exists";
  if (item.validation_status === "rejected") return (item.validationErrors || []).join("; ") || "ingest validation rejected it";
  return `validation ${item.validation_status || "unknown"}; review ${item.review_status || "unknown"}`;
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
async function syncFromApi() {
  const day = els.day?.value || state.selectedDay || todayKey(0);
  const bucket = els.bucket?.value || "all";
  const minScore = els.score?.value || 0;
  const response = await fetch(`${api}?day=${encodeURIComponent(day)}&bucket=${encodeURIComponent(bucket)}&minScore=${encodeURIComponent(minScore)}`, { cache: "no-store" }).catch(() => null);
  if (!response?.ok) {
    apiOnline = false;
    return;
  }
  const data = await response.json().catch(() => null);
  if (!data?.ok) return;
  apiOnline = true;
  state.findings = data.findings || [];
  state.estimates = data.estimates || [];
  state.trades = data.trades || [];
  state.agents = data.agents || [];
  state.storage = data.storage || {};
  state.media = data.media || [];
  state.inbox = data.inbox || [];
  state.unreadCount = Number(data.unreadCount || 0);
  state.company = data.company || state.company;
  state.techSettings = data.techSettings || state.techSettings || [];
  state.techNotes = data.techNotes || state.techNotes || [];
  state.techReports = data.techReports || state.techReports || [];
  state.scoreFeedback = data.scoreFeedback || state.scoreFeedback || [];
  state.jobs = (data.jobs || []).map(fromApiJob);
  state.activity = [
    ...(data.guidance || []).map((item) => `guidance: ${item.instruction}`),
    ...(data.examples || []).map((item) => `example: ${item.trade} - ${item.title}`),
    ...(data.actions || []).map((item) => `${item.job_id}: ${item.action} - ${item.detail || "logged"}`),
  ];
  state.techs = data.techs || [];
  state.skills = data.skills || [];
  if (!state.jobs.some((job) => job.id === state.selectedJobId)) state.selectedJobId = state.jobs[0]?.id || "";
  saveState();
}

async function postGeneral(action, extra = {}) {
  if (!apiOnline) return false;
  const response = await fetch(api, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  }).catch(() => null);
  return Boolean(response?.ok);
}

async function postAction(job, action, extra = {}) {
  if (!apiOnline) return false;
  const response = await fetch(api, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: job.id, action, ...extra }),
  }).catch(() => null);
  return Boolean(response?.ok);
}

async function queueAgent(route, extra = {}) {
  const response = await fetch(agentApi, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ route, ...extra }),
  }).catch(() => null);
  return Boolean(response?.ok);
}

function render() {
  const jobs = filteredJobs();
  if (!state.selectedJobId && jobs.length) state.selectedJobId = jobs[0].id;
  if (!jobs.some((job) => job.id === state.selectedJobId) && jobs.length) state.selectedJobId = jobs[0].id;
  const minScore = Number(els.score.value || 0);
  els.root.querySelector("[data-fp-score-label]").textContent = `${minScore}+`;
  els.root.querySelector("[data-fp-ready]").textContent = state.jobs.filter((job) => job.status === "ready-review").length;
  els.root.querySelector("[data-fp-urgent]").textContent = state.jobs.filter((job) => job.priority === "urgent").length;
  els.root.querySelector("[data-fp-perfect]").textContent = state.jobs.filter((job) => Number(job.score) >= 100).length;
  els.root.querySelector("[data-fp-unsafe]").textContent = state.jobs.filter((job) => job.status === "unsafe" || job.safety).length;
  els.queueCount.textContent = jobs.length;
  els.list.innerHTML = jobs.map(queueItem).join("") || `<div class="fp-empty">No scan packets match this filter.</div>`;
  renderStage(selectedJob() || jobs[0]);
  renderOwnerLane();
  renderTradeSystem();
  renderProfiles();
  els.log.innerHTML = state.activity.slice(0, 10).map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>No manager actions yet.</li>";
}

function filteredJobs() {
  const minScore = Number(els.score.value || 0);
  const bucket = els.bucket.value;
  const day = els.day.value;
  return state.jobs.filter((job) => {
    const dayOk = !day || job.date === day;
    const bucketOk = bucket === "all" || job.status === bucket || job.priority === bucket || (bucket === "unsafe" && job.safety);
    return dayOk && bucketOk && Number(job.score || 0) >= minScore;
  });
}

function selectedJob() {
  return state.jobs.find((job) => job.id === state.selectedJobId) || state.jobs[0];
}

function queueItem(job) {
  const active = job.id === state.selectedJobId ? " active" : "";
  const scoreClass = scoreTone(job);
  return `<button class="fp-run${active}" type="button" data-fp-select="${escapeAttr(job.id)}">
    <span><b>${escapeHtml(job.client)}</b><em>${escapeHtml(job.status)} / ${escapeHtml(job.priority)}</em></span>
    <strong class="${scoreClass}">${job.score}</strong>
    <small>${escapeHtml(job.tech)} - ${escapeHtml(job.type)}</small>
  </button>`;
}

function renderStage(job) {
  if (!job) {
    els.stage.innerHTML = `<div class="fp-empty">No run selected.</div>`;
    els.frames.innerHTML = "";
    els.findingsPanel.innerHTML = "";
    els.decision.innerHTML = "";
    return;
  }
  const scoreClass = scoreTone(job);
  const media = mediaFor(job);
  const primaryVideo = media.find((item) => item.asset_type === "video");
  const frameMedia = media.filter((item) => item.asset_type !== "video");
  const windows = reviewWindows(job);
  const selectedWindow = windows[Math.min(Number(state.selectedWindow || 0), windows.length - 1)] || windows[0];
  els.stage.innerHTML = `<div class="fp-video-shell ${scoreClass}">
    <div class="fp-video-topline">
      <div><span>${escapeHtml(job.id)}</span><h3>${escapeHtml(job.client)}</h3></div>
      <div class="fp-big-score"><strong>${job.score}</strong><small>${job.confidence}% confidence</small></div>
    </div>
    <div class="fp-video-box">
      ${primaryVideo ? `<div class="fp-primary-player"><video class="fp-primary-review-video" data-primary-review-video controls playsinline preload="metadata" src="/api/fieldscan-media-file?id=${encodeURIComponent(primaryVideo.id)}"><track kind="captions" /></video><div class="fp-player-tools"><button type="button" data-video-jump="-10">↶ 10 sec</button><button type="button" data-video-toggle>Play / pause</button><button type="button" data-video-jump="10">10 sec ↷</button><label>Speed <select data-video-speed><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label></div></div>` : `<div class="fp-phone-video"><div class="fp-video-scanline"></div><strong>${escapeHtml(selectedWindow.title)}</strong><span>${escapeHtml(selectedWindow.label)} / ${escapeHtml(job.type)}</span></div>`}
      <div class="fp-video-readout">
        <b>${escapeHtml(job.status)}</b>
        <p>${escapeHtml(job.summary)}</p>
        <small>AI screening evidence only. Manager confirms before pass, storage, or customer send.</small>
      </div>
    </div>
    <div class="fp-timeline">${windows.map((window, index) => `<button type="button" class="${index === Number(state.selectedWindow || 0) ? "active" : ""}" data-fp-seek="${index}"><span style="width:${window.coverage}%"></span><b>${escapeHtml(window.label)}</b></button>`).join("")}</div>
  </div>`;
  const checklist = checklistFor(job);
  const comparison = beforeAfterComparison(media, job);
  els.frames.innerHTML = `${comparison}<div class="fp-section-head"><strong>Evidence frames</strong><span>${frameMedia.length ? `${frameMedia.length} uploaded` : `${job.views.length}/${checklist.length} views`}</span></div>${media.length ? media.map(mediaCard).join("") : checklist.map((view, index) => frameCard(job, view, index)).join("")}`;
  els.findingsPanel.innerHTML = `<div class="fp-section-head"><strong>Findings and reshoot directions</strong><span>${scoreClass}</span></div>${findingsFor(job).map(findingCard).join("")}`;
  els.decision.innerHTML = decisionPanel(job);
}

function reviewWindows(job) {
  return windowTemplates.map((window) => {
    const matchCount = job.views.filter((view) => keywords(`${window.title} ${view}`).some((word) => window.title.toLowerCase().includes(word) || view.toLowerCase().includes(word))).length;
    return { ...window, coverage: Math.max(18, Math.min(100, 28 + matchCount * 18 + Number(job.score || 0) / 4)) };
  });
}

function checklistFor(job) {
  const preset = (state.trades || []).find((trade) => String(trade.trade || "").toLowerCase() === String(job?.type || "").toLowerCase());
  const list = parseJsonList(preset?.checklist_json);
  return list.length ? list : requiredViews;
}
function mediaFor(job) {
  return (state.media || []).filter((item) => item.job_id === job.id);
}

function beforeAfterComparison(media, job = selectedJob()) {
  const before = media.find((item) => /before/i.test(item.label || ""));
  const after = media.find((item) => /after/i.test(item.label || ""));
  if (!before && !after) return "";
  const points = comparisonPoints(job, Boolean(before), Boolean(after));
  const card = (item, label) => {
    if (!item) return `<article class="fp-compare-card missing"><strong>${label}</strong><button type="button" data-fp-action="coach">Request shot</button><div><span>Missing</span></div><small>Send tech back for this angle.</small></article>`;
    const url = `/api/fieldscan-media-file?id=${encodeURIComponent(item.id)}`;
    return `<article class="fp-compare-card"><strong>${label}</strong><button type="button" data-ai-point="${label.toLowerCase()} angle">Tap angle</button><div><img loading="lazy" src="${escapeAttr(url)}" alt="${label} job comparison" /></div><small>${escapeHtml(item.created_at || "Uploaded")}</small></article>`;
  };
  return `<section class="fp-before-after"><div class="fp-section-head"><strong>Before / After comparison</strong><span>${before && after ? "same-angle check" : "needs both shots"}</span></div><div>${card(before, "Before")}${card(after, "After")}</div><div class="fp-ai-points">${points.map((point) => `<button type="button" class="${point.tone}" data-ai-point="${escapeAttr(point.label)}"><b>${point.score}</b><span>${escapeHtml(point.label)}</span><small>${escapeHtml(point.note)}</small></button>`).join("")}</div></section>`;
}

function comparisonPoints(job, hasBefore, hasAfter) {
  const score = Number(job?.score || 0);
  return [
    { label: "same angle", score: hasBefore && hasAfter ? 92 : 38, tone: hasBefore && hasAfter ? "green" : "red", note: hasBefore && hasAfter ? "Before/after pair ready" : "Missing one side" },
    { label: "finish proof", score: hasAfter ? Math.max(60, score) : 32, tone: hasAfter ? scoreTone(job) : "red", note: hasAfter ? "After shot exists" : "Needs after shot" },
    { label: "cleanup", score: score >= 85 ? 90 : 62, tone: score >= 85 ? "green" : "yellow", note: score >= 85 ? "Looks passable" : "Manager should inspect" },
    { label: "unsafe flags", score: job?.safety ? 25 : 96, tone: job?.safety ? "red" : "green", note: job?.safety ? "Unsafe practice flagged" : "No safety flag" },
  ];
}
function mediaCard(item) {
  const url = `/api/fieldscan-media-file?id=${encodeURIComponent(item.id)}`;
  const isVideo = String(item.content_type || "").startsWith("video/") || item.asset_type === "video";
  const preview = isVideo ? `<video controls preload="metadata" src="${escapeAttr(url)}"></video>` : `<img loading="lazy" src="${escapeAttr(url)}" alt="${escapeAttr(item.label || "FieldScan media")}" />`;
  return `<article class="fp-frame-card green fp-media-card"><div class="fp-frame-thumb">${preview}</div><strong>${escapeHtml(item.label || item.id)}</strong><small>${(Number(item.size_bytes || 0) / 1024 / 1024).toFixed(2)} MB uploaded ${escapeHtml(item.created_at || "")}</small></article>`;
}

function frameCard(job, view, index) {
  const present = hasView(job, view);
  const tone = present ? "green" : job.safety || job.score < 75 ? "red" : "yellow";
  return `<article class="fp-frame-card ${tone}" data-fp-seek="${Math.min(index, windowTemplates.length - 1)}">
    <div class="fp-frame-thumb"><span>${String(index + 1).padStart(2, "0")}</span></div>
    <strong>${escapeHtml(view)}</strong>
    <small>${present ? "Captured" : directionForView(view)}</small>
  </article>`;
}

function managerThreadFor(job) {
  const messages = (state.inbox || []).filter((item) => item.related_job_id === job.id).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  const settings = techSettings(job.techId || slug(job.tech), job.tech);
  const techMessage = [...messages].reverse().find((item) => String(item.sender_role || "").toLowerCase() === "technician");
  const recipientEmail = settings.login_email || techMessage?.sender_email || "";
  const thread = messages.length ? messages.map((item) => `<article><b>${escapeHtml(item.sender_role || "team")}</b><span>${escapeHtml(item.body)}</span><small>${escapeHtml(item.created_at || "")}</small></article>`).join("") : `<p>No private help thread for this job yet.</p>`;
  const form = recipientEmail ? `<form class="fp-note fp-manager-reply" data-manager-reply-form><input type="hidden" name="recipientEmail" value="${escapeAttr(recipientEmail)}" /><div class="fp-reply-presets"><button type="button" data-fill-manager-reply="Pause work. Send a steady wide view of both sides of the opening, then the exact area you are questioning.">Request wide + detail</button><button type="button" data-fill-manager-reply="Do not proceed yet. Send the fire labels and the approved plan sheet/detail for this exact door and suite.">Request labels + plans</button><button type="button" data-fill-manager-reply="Keep the area in a safe state. I am escalating this to the qualified designer/AHJ before you continue.">Escalate / hold</button></div><textarea name="message" placeholder="Reply with the decision, exact next shot, or hold reason." required></textarea><label><input type="checkbox" name="email" /> also email the tech</label><button type="submit">Send private reply</button></form>` : `<p>Set this technician's login email before replying from the desk.</p>`;
  return `<section class="fp-manager-thread"><div class="fp-section-head"><strong>Private tech ↔ manager thread</strong><span>${messages.length} message${messages.length === 1 ? "" : "s"}</span></div>${thread}${form}</section>`;
}
function decisionPanel(job) {
  return `<h3>Manager decision</h3>
    ${managerThreadFor(job)}
    <div class="fp-decision-score ${scoreTone(job)}"><strong>${job.score}</strong><span>${escapeHtml(job.status)}</span><small>${escapeHtml(job.tech)} / ${job.confidence}% confidence</small></div>
    <div class="fp-actions">
      <button type="button" data-fp-action="pass">Pass</button>
      <button type="button" data-fp-action="fail">Send back</button>
      <button type="button" data-fp-action="agree">Agree score</button>
      <button type="button" data-fp-action="store">Store</button>
      <button type="button" data-fp-action="unsafe">Unsafe</button>
      <button type="button" data-fp-action="estimate">Draft bid</button>
      <button type="button" data-fp-action="coach">Tell tech</button>
      <button type="button" data-fp-action="run-teams">Run teams</button>
    </div>
    <form class="fp-note fp-score-feedback" data-score-feedback-form>
      <select name="verdict" aria-label="AI score feedback"><option value="agree">AI score is right</option><option value="disagree">AI score is wrong</option></select>
      <input name="managerScore" type="number" min="0" max="100" value="${escapeAttr(job.score)}" aria-label="Manager score" />
      <textarea name="note" placeholder="Teach the AI: what exactly is wrong, what should the tech show, what rule should change?"></textarea>
      <button type="submit">Teach AI</button>
    </form>
    <form class="fp-note" data-fp-note-form>
      <input name="note" placeholder="Manager note for ${escapeAttr(job.id)}" />
      <button type="submit">Add note</button>
    </form>
    <div class="fp-reshoot"><strong>Tech directions</strong>${reshootDirections(job).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
    ${estimateBlock(job)}`;
}

function findingsFor(job) {
  const fromDb = job.findings?.length ? job.findings : inferredFindings(job);
  const missing = checklistFor(job).filter((view) => !hasView(job, view)).slice(0, 4).map((view) => ({ severity: job.score < 75 ? "red" : "yellow", category: "missing-view", finding: view, recommendation: directionForView(view) }));
  return [...fromDb, ...missing].slice(0, 8);
}

function findingCard(item) {
  return `<article class="fp-finding-card ${escapeAttr(item.severity || "yellow")}"><b>${escapeHtml(item.severity || "check")}</b><strong>${escapeHtml(item.finding || "Inspect")}</strong><span>${escapeHtml(item.recommendation || item.category || "Manager review")}</span></article>`;
}

function reshootDirections(job) {
  const missing = checklistFor(job).filter((view) => !hasView(job, view));
  if (!missing.length && !job.safety) return ["No reshoot needed. Ready for manager pass or catalog storage."];
  return missing.slice(0, 3).map(directionForView).concat(job.safety ? ["Stop closeout until manager clears the unsafe flag."] : []);
}

function hasView(job, view) {
  const text = job.views.join(" ").toLowerCase();
  return keywords(view).some((word) => text.includes(word));
}

function directionForView(view) {
  if (/spring|cable|drum/i.test(view)) return "Show spring, cable, and drum from a safe distance with no hands in the tension zone.";
  if (/track|roller|bracket/i.test(view)) return "Move slowly down both sides so track, rollers, hinges, and brackets are steady.";
  if (/opener|sensor|test|reversal/i.test(view)) return "Show opener, sensors, wall button, and final run or reversal test.";
  if (/after|cleanup/i.test(view)) return "Step back for a clean after shot and show the work area is cleared.";
  if (/before|opening/i.test(view)) return "Start wide and say the customer issue before touching the job.";
  return `Capture ${view}.`;
}

function estimateBlock(job) {
  const estimate = (state.estimates || []).find((item) => item.job_id === job.id);
  if (!estimate) return `<div class="fp-estimate"><strong>Bid gauge</strong><span>Draft only. Boss confirms before customer use.</span></div>`;
  return `<div class="fp-estimate"><strong>${money(estimate.low_cents)} - ${money(estimate.high_cents)}</strong><span>${escapeHtml(estimate.mode)} / ${estimate.confidence}% confidence / ${escapeHtml(estimate.status)}</span></div>`;
}

function renderProfiles() {
  const profiles = profileRows();
  const selected = profiles.find((profile) => profile.tech_id === state.selectedTechId) || profiles[0];
  if (selected && !state.selectedTechId) state.selectedTechId = selected.tech_id;
  els.profile.innerHTML = `<div class="fp-company-card">${companyCard()}</div><div class="fp-crew-grid">${profiles.map(crewCard).join("")}</div>${selected ? techProfilePanel(selected) : ""}`;
}

function profileRows() {
  const profiles = new Map();
  for (const row of state.techs || []) profiles.set(row.tech_id, { ...row });
  for (const job of state.jobs || []) {
    const id = job.techId || slug(job.tech);
    const profile = profiles.get(id) || { tech_id: id, tech_name: job.tech, jobs_count: 0, average_score: 0, pass_count: 0 };
    profile.jobs_count = Number(profile.jobs_count || 0) || state.jobs.filter((item) => slug(item.tech) === id).length;
    profile.average_score = Number(profile.average_score || 0) || average(state.jobs.filter((item) => slug(item.tech) === id).map((item) => item.score));
    profile.pass_count = Number(profile.pass_count || 0) || state.jobs.filter((item) => slug(item.tech) === id && ["approved", "stored", "reviewed"].includes(item.status)).length;
    profiles.set(id, profile);
  }
  return [...profiles.values()].sort((a, b) => Number(b.average_score || 0) - Number(a.average_score || 0));
}

function companyCard() {
  const company = state.company || {};
  return `<form data-company-form><h4>Company card</h4><small>Shows on packets, invites, and tech login screens.</small><input name="name" value="${escapeAttr(company.name || "AMH FieldScan")}" placeholder="Company name" /><input name="phone" value="${escapeAttr(company.phone || "")}" placeholder="Phone" /><input name="email" value="${escapeAttr(company.email || "fieldscan@amhsiterevival.com")}" placeholder="Email" /><input name="address" value="${escapeAttr(company.address || "")}" placeholder="Address" /><button type="submit">Save company</button></form>`;
}

function crewCard(profile) {
  const settings = techSettings(profile.tech_id, profile.tech_name);
  const mode = settings.approval_mode === "go" ? "goes on" : "waits";
  return `<button type="button" class="fp-crew-card ${profile.tech_id === state.selectedTechId ? "active" : ""}" data-tech-open="${escapeAttr(profile.tech_id)}"><span>${escapeHtml(settings.tech_name || profile.tech_name)}</span><strong>${profile.average_score || 0}</strong><small>${mode} / ${settings.show_scores === 0 ? "scores hidden" : "scores shown"}</small></button>`;
}

function techProfilePanel(profile) {
  const tab = state.activeTechTab || "jobs";
  const tabs = ["jobs", "scores", "stats", "notes"].map((item) => `<button type="button" class="${tab === item ? "active" : ""}" data-tech-tab="${item}">${item}</button>`).join("");
  return `<section class="fp-tech-profile"><div class="fp-tech-head"><div><span>Tech profile</span><h4>${escapeHtml(techSettings(profile.tech_id, profile.tech_name).tech_name || profile.tech_name)}</h4></div><strong>${profile.average_score || 0}</strong></div><div class="fp-tech-tabs">${tabs}</div>${techTabContent(profile, tab)}</section>`;
}

function techTabContent(profile, tab) {
  if (tab === "scores") return techScoresTab(profile);
  if (tab === "stats") return techStatsTab(profile);
  if (tab === "notes") return techNotesTab(profile);
  return techJobsTab(profile);
}

function techJobsTab(profile) {
  const jobs = jobsForTech(profile.tech_id);
  const days = [...new Set(jobs.map((job) => job.date))];
  return `<div class="fp-tech-pane"><input data-tech-job-search placeholder="Search jobs, customers, flags" /><select data-tech-day-filter><option value="">All days</option>${days.map((day) => `<option>${escapeHtml(day)}</option>`).join("")}</select><div class="fp-tech-job-list">${jobs.map((job) => `<article><strong>${escapeHtml(job.client)}</strong><span>${escapeHtml(job.date)} / ${escapeHtml(job.type)} / ${escapeHtml(job.status)}</span><b>${job.score}</b><small>${escapeHtml(job.summary)}</small></article>`).join("") || "<p>No jobs yet.</p>"}</div></div>`;
}

function techScoresTab(profile) {
  const jobs = jobsForTech(profile.tech_id);
  const report = buildTechReport(profile.tech_id, techSettings(profile.tech_id, profile.tech_name).report_frequency || "weekly");
  return `<div class="fp-tech-pane"><div class="fp-report-controls"><button type="button" data-tech-report-preview="${escapeAttr(profile.tech_id)}" data-report-type="daily">Daily report</button><button type="button" data-tech-report-preview="${escapeAttr(profile.tech_id)}" data-report-type="weekly">Weekly report</button><button type="button" data-tech-report-send="${escapeAttr(profile.tech_id)}">Send to tech</button></div><pre class="fp-report-preview">${escapeHtml(state.reportDraft?.techId === profile.tech_id ? state.reportDraft.body : report.body)}</pre><div class="fp-score-bars">${jobs.slice(0, 12).map((job) => `<span><b style="width:${Math.max(4, Number(job.score || 0))}%"></b><em>${escapeHtml(job.date)} ${job.score}</em></span>`).join("")}</div></div>`;
}

function techStatsTab(profile) {
  const settings = techSettings(profile.tech_id, profile.tech_name);
  const jobs = jobsForTech(profile.tech_id);
  const unsafe = jobs.filter((job) => job.safety || job.status === "unsafe").length;
  return `<div class="fp-stat-grid"><article><span>Jobs</span><strong>${jobs.length}</strong></article><article><span>Average</span><strong>${average(jobs.map((job) => job.score))}</strong></article><article><span>Pass/store</span><strong>${jobs.filter((job) => ["approved", "stored", "reviewed"].includes(job.status)).length}</strong></article><article><span>Unsafe</span><strong>${unsafe}</strong></article><article><span>Mode</span><strong>${settings.approval_mode === "go" ? "Go on" : "Wait"}</strong></article><article><span>Scores</span><strong>${settings.show_scores === 0 ? "Hidden" : "Shown"}</strong></article><p>${plainTechRead(profile, jobs, unsafe)}</p></div>`;
}

function techNotesTab(profile) {
  const settings = techSettings(profile.tech_id, profile.tech_name);
  const notes = (state.techNotes || []).filter((note) => note.tech_id === profile.tech_id);
  return `<form data-tech-settings-form class="fp-tech-settings"><input type="hidden" name="techId" value="${escapeAttr(profile.tech_id)}" /><input name="techName" value="${escapeAttr(settings.tech_name || profile.tech_name)}" placeholder="Tech name" /><input name="loginEmail" value="${escapeAttr(settings.login_email || "")}" placeholder="Login email" /><select name="approvalMode"><option value="wait" ${settings.approval_mode !== "go" ? "selected" : ""}>waits on site for my approval</option><option value="go" ${settings.approval_mode === "go" ? "selected" : ""}>goes on - I review later</option></select><label><input type="checkbox" name="showScores" ${settings.show_scores === 0 ? "" : "checked"}/> show scores to this tech</label><label><input type="checkbox" name="autoSend" ${settings.auto_send ? "checked" : ""}/> auto-send report</label><select name="reportFrequency"><option value="daily" ${settings.report_frequency === "daily" ? "selected" : ""}>every evening</option><option value="weekly" ${settings.report_frequency !== "daily" ? "selected" : ""}>every Friday</option></select><button type="submit">Save tech</button><button type="button" data-tech-temp="${escapeAttr(profile.tech_id)}">Set login</button><button type="button" data-tech-login-send="${escapeAttr(profile.tech_id)}">Resend login</button><small>${settings.temp_password ? `Temp password: ${escapeHtml(settings.temp_password)}` : "No temp password set."}</small></form><form data-tech-note-form class="fp-tech-note"><input type="hidden" name="techId" value="${escapeAttr(profile.tech_id)}"/><textarea name="note" placeholder="Coaching note: pinpoint concern, exact fix, wanted spec."></textarea><button type="submit">Add coaching note</button></form><div class="fp-tech-notes">${notes.map((note) => `<article><strong>${escapeHtml(note.author_email || "manager")}</strong><span>${escapeHtml(note.created_at || "")}</span><p>${escapeHtml(note.note)}</p></article>`).join("") || "<p>No tech notes yet.</p>"}</div>`;
}

function renderOwnerLane() {
  const active = state.jobs.filter((job) => job.priority === "urgent" || job.status === "ready-review" || job.safety).slice(0, 5);
  els.alerts.innerHTML = active.map((job) => `<article><strong>${escapeHtml(job.client)}</strong><span>${escapeHtml(job.status)} / ${job.score}</span><small>Act inside 5-10 min: confirm, send back, store, or join live.</small></article>`).join("") || `<p>No owner alerts right now.</p>`;
}

function renderTradeSystem() {
  els.trades.innerHTML = (state.trades || []).map((trade) => `<article><strong>${escapeHtml(trade.trade)}</strong><span>${escapeHtml(trade.title)}</span><small>${parseJsonList(trade.checklist_json).slice(0, 3).map(escapeHtml).join(" / ")}</small></article>`).join("") || `<p>Garage Doors first. Plumbing and Electrical staged next.</p>`;
  els.agents.innerHTML = (state.agents || []).map((agent) => `<article><span>${escapeHtml(agent.team)}</span><strong>${escapeHtml(agent.role)}</strong><small>${escapeHtml(agent.model)} / ${escapeHtml(agent.mode)} / cap $${Number(agent.daily_cap_cents || 0) / 100}</small></article>`).join("") || `<p>K2 context teams are configured after migrations run.</p>`;
  const storage = state.storage || {};
  const gb = Number(storage.bytes || 0) / 1024 / 1024 / 1024;
  els.storage.innerHTML = `<article><strong>${storage.configured ? "R2 bound" : "R2 pending"}</strong><span>${escapeHtml(storage.bucket || "amh-crm-files")} / fieldscan/</span><small>${gb.toFixed(3)} GB used. Cleanup target: keep under ${storage.freeTargetGb || 9} GB.</small></article>`;
}

function inferredFindings(job) {
  if (job.safety || job.status === "unsafe") return [{ severity: "red", category: "safety", finding: job.safetyNotes || "Unsafe practice flagged", recommendation: "Manager review required" }];
  if (job.score >= 100) return [{ severity: "green", category: "fit", finding: "Looks proper for review", recommendation: "Store as a good-job example" }];
  return [{ severity: job.score < 75 ? "red" : "yellow", category: "placement", finding: "Needs manager look", recommendation: "Compare against required views" }];
}

function updateJob(job, status, message) {
  job.status = status;
  state.activity.unshift(`${job.id}: ${message}`);
  saveState();
  render();
}

function fromApiJob(job) {
  return {
    id: job.id,
    date: job.job_date,
    tech: job.tech_name,
    techId: job.tech_id || "",
    client: job.client_name,
    type: job.job_type,
    status: job.status,
    priority: job.priority,
    score: Number(job.score || 0),
    confidence: Number(job.confidence || 0),
    summary: job.summary || "",
    views: parseViews(job.evidence_json),
    safety: Boolean(job.safety_flag),
    safetyNotes: job.safety_notes || "",
    notes: [],
    findings: (state.findings || []).filter((item) => item.job_id === job.id).map((item) => ({ severity: item.severity, category: item.category, finding: item.finding, recommendation: item.recommendation })),
  };
}

function techSettings(techId, name = "") {
  const found = (state.techSettings || []).find((item) => item.tech_id === techId) || {};
  return { tech_id: techId, tech_name: name, login_email: "", approval_mode: "wait", show_scores: 1, report_frequency: "weekly", auto_send: 0, ...found };
}

async function saveTechSettings(data) {
  const current = techSettings(data.techId, data.techName);
  const payload = { ...current, ...data, techId: data.techId, tempPassword: data.tempPassword || "" };
  const index = (state.techSettings || []).findIndex((item) => item.tech_id === data.techId);
  const row = { tech_id: data.techId, tech_name: data.techName, login_email: data.loginEmail, approval_mode: data.approvalMode, show_scores: data.showScores ? 1 : 0, report_frequency: data.reportFrequency, auto_send: data.autoSend ? 1 : 0, temp_password: current.temp_password || "" };
  if (index >= 0) state.techSettings[index] = row; else state.techSettings.push(row);
  await postGeneral("tech-settings", payload);
  state.activity.unshift(`${data.techName || data.techId}: tech settings saved`);
  saveState();
}

function setTempLogin(techId) {
  const settings = techSettings(techId);
  settings.temp_password = `FS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const index = (state.techSettings || []).findIndex((item) => item.tech_id === techId);
  if (index >= 0) state.techSettings[index] = settings; else state.techSettings.push(settings);
  postGeneral("tech-settings", { techId, techName: settings.tech_name || techId, loginEmail: settings.login_email || "", approvalMode: settings.approval_mode, showScores: settings.show_scores !== 0, reportFrequency: settings.report_frequency || "weekly", autoSend: Boolean(settings.auto_send), tempPassword: settings.temp_password });
  state.activity.unshift(`${settings.tech_name || techId}: temp login generated and queued for email/text`);
  saveState();
}

async function addTechNote(techId, note) {
  if (!note) return;
  state.techNotes.unshift({ id: `local-${Date.now()}`, tech_id: techId, author_email: "manager", note, created_at: new Date().toISOString() });
  await postGeneral("tech-note", { techId, note });
  state.activity.unshift(`${techName(techId)}: coaching note added`);
  saveState();
}

function buildTechReport(techId, type = "weekly") {
  const jobs = jobsForTech(techId);
  const settings = techSettings(techId);
  const avg = average(jobs.map((job) => job.score));
  const flags = jobs.filter((job) => job.safety || Number(job.score) < 75);
  const tips = flags.slice(0, 4).map((job) => `- ${job.client}: ${reshootDirections(job).join(" ")}`).join("\n") || "- Keep capturing full before, problem, safety, after, and cleanup proof.";
  return { techId, type, recipientEmail: settings.login_email || "", subject: `AMH FieldScan ${type} report - ${settings.tech_name || techId}`, body: `${settings.tech_name || techId}\n${type.toUpperCase()} FIELD REPORT\nAverage score: ${avg}\nJobs reviewed: ${jobs.length}\nFlags: ${flags.length}\n\nPer job:\n${jobs.map((job) => `- ${job.date} ${job.client}: ${job.score} ${job.status}`).join("\n")}\n\nWork on:\n${tips}` };
}

async function sendTechReport(techId) {
  const draft = state.reportDraft?.techId === techId ? state.reportDraft : buildTechReport(techId, techSettings(techId).report_frequency || "weekly");
  await postGeneral("tech-report", { techId, reportType: draft.type, recipientEmail: draft.recipientEmail, subject: draft.subject, body: draft.body });
  state.activity.unshift(`${techName(techId)}: ${draft.type} report queued from fieldscan@amhsiterevival.com`);
  saveState();
}

function jobsForTech(techId) {
  return (state.jobs || []).filter((job) => (job.techId || slug(job.tech)) === techId);
}

function techName(techId) {
  return techSettings(techId).tech_name || (state.jobs || []).find((job) => (job.techId || slug(job.tech)) === techId)?.tech || techId;
}

function average(values) {
  const nums = values.map(Number).filter((value) => Number.isFinite(value));
  return nums.length ? Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length) : 0;
}

function plainTechRead(profile, jobs, unsafe) {
  const avg = average(jobs.map((job) => job.score));
  if (unsafe) return `${profile.tech_name} needs safety review before more trust. Pinpoint exact missing proof and make the next scan show it.`;
  if (avg >= 95) return `${profile.tech_name} is ready for faster review on this lane. Keep storing 100-score jobs as examples.`;
  if (avg >= 80) return `${profile.tech_name} is close. Coach missing views and final test proof.`;
  return `${profile.tech_name} needs tighter capture instructions and manager hold mode.`;
}

function slug(value) {
  return String(value || "field-tech").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "field-tech";
}

function normalizeFieldScanState(target) {
  target.company ||= { id: "company", name: "AMH FieldScan", phone: "", email: "fieldscan@amhsiterevival.com", address: "" };
  target.techSettings ||= [];
  target.techNotes ||= [];
  target.techReports ||= [];
  target.scoreFeedback ||= [];
  target.selectedTechId ||= "";
  target.activeTechTab ||= "jobs";
  target.reportDraft ||= null;
}

function skillChip(skill) {
  return `<em class="fp-skill ${escapeAttr(skill.level || "watch")}">${escapeHtml(skill.skill)} ${skill.average_score} / unsafe ${skill.unsafe_count}</em>`;
}

function scoreTone(job) {
  if (job.safety || job.status === "unsafe" || Number(job.score) < 75) return "red";
  if (Number(job.score) >= 95) return "green";
  return "yellow";
}

function money(cents) {
  return `$${Math.round(Number(cents || 0) / 100).toLocaleString()}`;
}

function keywords(value) {
  return String(value).toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3);
}

function parseViews(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonList(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(FIELD_SCAN_STORAGE) || "null");
    if (saved?.jobs?.length) return saved;
  } catch {}
  return { selectedDay: todayKey(0), selectedJobId: "job-gd-1047", selectedWindow: 0, jobs: seedJobs, activity: ["AMH FieldScan AI review console initialized"], techs: [], skills: [], estimates: [], trades: [], agents: [], storage: {}, findings: [], media: [], company: { id: "company", name: "AMH FieldScan", phone: "", email: "fieldscan@amhsiterevival.com", address: "" }, techSettings: [], techNotes: [], techReports: [], scoreFeedback: [], selectedTechId: "", activeTechTab: "jobs", reportDraft: null };
}

function saveState() {
  localStorage.setItem(FIELD_SCAN_STORAGE, JSON.stringify(state));
}

function todayKey(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
