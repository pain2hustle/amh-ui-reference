const els = {
  providers: document.getElementById("providers"),
  watchdogPanel: document.getElementById("watchdogPanel"),
  agentRack: document.getElementById("agentRack"),
  productionGoal: document.getElementById("productionGoal"),
  leadList: document.getElementById("leadList"),
  taskList: document.getElementById("taskList"),
  outreachList: document.getElementById("outreachList"),
  responseList: document.getElementById("responseList"),
  approvalList: document.getElementById("approvalList"),
  paymentList: document.getElementById("paymentList"),
  clientList: document.getElementById("clientList"),
  logList: document.getElementById("logList"),
  directionList: document.getElementById("directionList"),
  directionCount: document.getElementById("directionCount"),
  leadCount: document.getElementById("leadCount"),
  taskCount: document.getElementById("taskCount"),
  outreachCount: document.getElementById("outreachCount"),
  responseCount: document.getElementById("responseCount"),
  approvalCount: document.getElementById("approvalCount"),
  paymentCount: document.getElementById("paymentCount"),
  clientCount: document.getElementById("clientCount"),
  logCount: document.getElementById("logCount"),
};

let current = null;

async function boot() {
  const res = await fetch("/api/command-center", { cache: "no-store" }).catch(() => null);
  if (!res || res.status === 401) {
    window.location.href = "/login.html";
    return;
  }
  current = await res.json();
  render(current);
}

function render(data) {
  const state = data.state || {};
  const leads = state.leads || [];
  const tasks = state.tasks || [];
  const outreach = state.outreach || [];
  const responses = state.responses || [];
  const approvals = state.approvals || [];
  const payments = state.payments || [];
  const clients = state.clients || [];
  const logs = state.logs || [];
  const directionNotes = state.directionNotes || [];
  const agents = state.agents || [];
  const queue = data.queue || [];
  const localModels = state.localModels || [];
  const productionGoal = state.productionGoal || {};
  const watchdog = state.watchdog || {};

  els.providers.innerHTML = bridgeCard(state.bridge)
    + localModelRack(localModels)
    + Object.entries(data.providers || {})
    .map(([id, item]) => providerCard(id, item))
    .join("");
  const visibleAgents = realAgentActivity(agents, tasks, queue);
  renderWatchdog(watchdog, tasks, queue, logs, state.providerControls || {});
  renderAgentRack(visibleAgents);
  renderProductionGoal(productionGoal, tasks);

function renderWatchdog(watchdog, tasks, queue, logs, controls) {
  if (!els.watchdogPanel) return;
  const active = realWorkItems(tasks, queue);
  const lastLog = logs[0] || {};
  const lastAt = watchdog.lastHeartbeatAt || lastLog.at || "";
  const ageSeconds = lastAt ? Math.max(0, Math.round((Date.now() - Date.parse(lastAt)) / 1000)) : null;
  const serper = controls.serper || {};
  const cap = Number(serper.dailyQueryCap || 0);
  const used = Number(serper.todayQueries || 0);
  const capText = cap ? `${used}/${cap}` : `${used}`;
  const status = active.length ? "RUN" : "IDLE";
  els.watchdogPanel.innerHTML = `
    <article class="watchdog-card ${status.toLowerCase()}">
      <div class="flame-core" aria-hidden="true"><span></span></div>
      <div>
        <span>SWARM WATCHDOG</span>
        <strong>${status}</strong>
        <p>${active.length ? `${active.length} real queued or running task${active.length === 1 ? "" : "s"}.` : "No AMH agent is running. Agents stay retained and start only when work is queued."}</p>
      </div>
      <dl>
        <div><dt>Last pulse</dt><dd>${lastAt ? `${ageSeconds}s ago` : "none"}</dd></div>
        <div><dt>Serper</dt><dd>${escapeHtml(capText)}</dd></div>
        <div><dt>Qwen</dt><dd>${escapeHtml(watchdog.qwen || "checking")}</dd></div>
        <div><dt>Kimi</dt><dd>${escapeHtml(watchdog.kimi || "optional")}</dd></div>
        <div><dt>Gemma 41B</dt><dd>${escapeHtml(watchdog.gemma41b || "checking")}</dd></div>
      </dl>
      ${active.length ? `<div class="watchdog-actions"><code>Demand-driven agent work is active.</code></div>` : ""}
    </article>
  `;
}

function bridgeCard(bridge = {}) {
  const ok = bridge.ok !== false;
  return `
      <article class="provider-card bridge-card ${ok ? "on" : "off"}">
        <span>${ok ? "LIVE BRIDGE" : "FALLBACK"}</span>
        <strong>${escapeHtml(bridge.source || "local")}</strong>
        <p>${ok ? "Dashboard is reading the newest agent state available." : "GitHub bridge missed; local fallback is showing."}</p>
        <p>${bridge.url ? "GitHub state connected." : "No raw state URL configured."}</p>
      </article>
    `;
}

function renderProductionGoal(goal, tasks) {
  if (!els.productionGoal) return;
  const limit = Number(goal.dailySiteLimit || 5);
  const done = Number(goal.todayBuilt || tasks.filter((task) => task.status === "finished").length || 0);
  const percent = limit > 0 ? Math.min(100, Math.round((done / limit) * 100)) : 0;
  els.productionGoal.innerHTML = `
    <article class="goal-card">
      <div>
        <span>DAILY BUILD GOAL</span>
        <strong>${done}/${limit}</strong>
        <p>${escapeHtml(goal.notes || "AMH preview build cap for today.")}</p>
      </div>
      <form class="goal-form" id="goalForm">
        <label>
          Sites per day
          <input name="dailySiteLimit" inputmode="numeric" value="${limit}" min="1" max="100" />
        </label>
        <button type="submit">Save goal</button>
      </form>
      <div class="goal-meter" style="--goal:${percent}%"><span></span></div>
    </article>
  `;
}

function renderAgentRack(agents) {
  if (!els.agentRack) return;
  els.agentRack.innerHTML = `
    <div class="rack-head">
      <span>AMH APP AGENTS · REAL ACTIVITY</span>
      <strong>${agents.length}</strong>
      <p>Only agents with fresh queued, running, or recently completed work appear here. The full AMH roster remains retained.</p>
    </div>
    <div class="agent-track">
      ${agents.map(agentCard).join("") || empty("No active AMH agents. Queue work when the app needs it.")}
    </div>
  `;
}

function agentCard(agent) {
  return `
    <article class="agent-card ${escapeAttr(agent.status || "standby")}">
      <div class="agent-topline">
        <span>${escapeHtml(agent.name || agent.id)}</span>
        <b>${escapeHtml(agent.status || "standby")}</b>
      </div>
      <strong>${escapeHtml(agent.model || agent.provider || "local")}</strong>
      <p>${escapeHtml(agent.role || agent.task || "")}</p>
      <dl>
        <div><dt>Tool</dt><dd>${escapeHtml(agent.tool || "AMH shell")}</dd></div>
        <div><dt>Lane</dt><dd>${escapeHtml(agent.lane || "ops")}</dd></div>
      </dl>
      <small>${escapeHtml(agent.task || agent.updatedAt || "")}</small>
    </article>
  `;
}

const activeWorkStatuses = new Set(["queued", "running", "working", "in-progress"]);

function itemTime(item) {
  const value = item?.updatedAt || item?.updated_at || item?.createdAt || item?.created_at || item?.at;
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function isFresh(item, hours) {
  const at = itemTime(item);
  return at > 0 && Date.now() - at <= hours * 60 * 60 * 1000;
}

function realWorkItems(tasks, queue) {
  const byId = new Map();
  for (const item of [...(queue || []), ...(tasks || [])]) {
    if (!item?.id || !activeWorkStatuses.has(String(item.status || "").toLowerCase())) continue;
    if (!isFresh(item, 24)) continue;
    byId.set(item.id, { ...(byId.get(item.id) || {}), ...item });
  }
  return [...byId.values()];
}

function realAgentActivity(agents, tasks, queue) {
  const work = realWorkItems(tasks, queue);
  const liveOwners = new Set(work.flatMap((item) => [item.owner, item.agent, item.agentId]).filter(Boolean).map((item) => String(item).toLowerCase()));
  return (agents || []).filter((agent) => {
    const status = String(agent.status || "").toLowerCase();
    const id = String(agent.id || agent.name || "").toLowerCase();
    if (activeWorkStatuses.has(status)) return isFresh(agent, 1) && (!liveOwners.size || liveOwners.has(id));
    return ["finished", "completed", "recent"].includes(status) && isFresh(agent, 6);
  });
}

function localModelRack(models) {
  if (!models.length) return "";
  return `
      <article class="provider-card local-model-card on">
        <div class="provider-topline">
          <span>LOCAL OLLAMA</span>
          <b>FREE</b>
        </div>
        <strong>PC Model Rack</strong>
        <p>Real models available on this machine. Use the best current lanes; leave old/weak ones out.</p>
        <div class="model-stack">
          ${models.map((model) => `
            <div class="model-pill ${model.preferred ? "preferred" : ""} ${model.available ? "available" : "missing"}">
              <span>${escapeHtml(model.available ? "active" : "not installed")} / ${escapeHtml(model.role || "lane")}</span>
              <strong>${escapeHtml(model.name)}</strong>
              <small>${escapeHtml(model.note || "")}</small>
            </div>
          `).join("")}
        </div>
      </article>
    `;
}

function providerCard(id, item) {
  const confirmed = !item.requiresConfirm || item.confirmedAt;
  const capped = item.pausedAtCap;
  const spend = Number(item.spentUsd || 0);
  const budget = Number(item.budgetUsd || 0);
  const percent = budget > 0 ? Math.min(100, Math.round((spend / budget) * 100)) : 0;
  const free = item.billing === "free-local" || item.billing === "free-or-cloud";
  return `
      <article class="provider-card ${item.configured && item.enabled && !capped ? "on" : "off"}">
        <div class="provider-topline">
          <span>${capped ? "CAP PAUSED" : item.preferred ? "PREFERRED" : item.enabled ? "ON" : "OFF"} / ${item.configured ? "KEY READY" : "NO KEY"}</span>
          <b>${capped ? "PAUSED" : confirmed ? "CONFIRMED" : "LOCKED"}</b>
        </div>
        <strong>${escapeHtml(item.label)}</strong>
        <p>${escapeHtml(item.role || id)}</p>
        ${item.model ? `<p class="provider-model">${escapeHtml(item.model)}</p>` : ""}
        <div class="spend-meter" style="--spend:${percent}%">
          <div><span></span></div>
          <p>${free ? "Free-first lane" : "Paid cloud lane"} · Spent $${spend.toFixed(2)} · Cap $${budget.toFixed(2)}</p>
        </div>
        <label class="cap-control">
          Cap
          <input inputmode="decimal" value="${budget.toFixed(2)}" data-provider-cap="${escapeAttr(id)}" aria-label="${escapeAttr(item.label)} cap" />
        </label>
        <p class="provider-note">${capped ? "Paid cap paused. Free work can continue where available; raise cap and confirm for paid calls." : confirmed ? "Spend confirmed or free." : "Needs confirm before paid use."}</p>
        <div class="provider-actions">
          <button type="button" data-action="provider-toggle" data-provider="${escapeAttr(id)}" data-enabled="${item.enabled ? "false" : "true"}">${item.enabled ? "Turn off" : "Turn on"}</button>
          <button type="button" data-action="provider-budget" data-provider="${escapeAttr(id)}">Save cap</button>
          <button type="button" data-action="provider-confirm" data-provider="${escapeAttr(id)}">Confirm</button>
        </div>
      </article>
    `;
}

  els.leadCount.textContent = leads.length;
  const activeTasks = realWorkItems(tasks, data.queue || []);
  const finishedTasks = tasks.filter((task) => task.status === "finished");
  els.taskCount.textContent = activeTasks.length;
  els.outreachCount.textContent = outreach.length;
  els.responseCount.textContent = responses.length;
  els.approvalCount.textContent = approvals.length;
  els.paymentCount.textContent = payments.length;
  els.clientCount.textContent = clients.length;
  els.logCount.textContent = logs.length;
  if (els.directionCount) els.directionCount.textContent = directionNotes.length;

  els.leadList.innerHTML = leads.map(leadCard).join("") || empty("No found customers yet.");
  els.taskList.innerHTML = taskLane(activeTasks, finishedTasks);
  els.outreachList.innerHTML = outreach.map(outreachCard).join("") || empty("No sends planned.");
  els.responseList.innerHTML = responses.map((item) => smallCard(item.company || item.from || "Response", item.status, item.message)).join("") || empty("No replies yet.");
  els.approvalList.innerHTML = approvals.map((item) => smallCard(item.title, item.status, item.reason)).join("") || empty("No approvals yet.");
  els.logList.innerHTML = logs.map((item) => `<div class="log-row"><span>${escapeHtml(item.agent)}</span><p>${escapeHtml(item.message)}</p><small>${escapeHtml(item.at || "")}</small></div>`).join("") || empty("No logs yet.");
  if (els.directionList) els.directionList.innerHTML = directionNotes.map(directionNoteCard).join("") || empty("No direction notes yet. Add the first priority, result, need, or process note above.");

  els.paymentList.innerHTML = payments.map(paymentCard).join("") || empty("No payments yet.");
  els.clientList.innerHTML = clients.map(clientCard).join("") || empty("No client accounts yet.");
}

function directionNoteCard(note) {
  const flags = [note.lane || "general", note.model || "local", note.autoPublish ? "auto-publish approved" : "review first"].join(" · ");
  return `<article class="direction-note"><b>${escapeHtml(note.kind || "direction")}</b><p>${escapeHtml(note.message || "")}</p><small>${escapeHtml(flags)}<br />${escapeHtml(note.by || "AMH")} · ${escapeHtml(note.at || "")}</small></article>`;
}

function leadCard(lead) {
  return `
    <article class="lead-card">
      <div>
        <span class="pill">${escapeHtml(lead.status || "found")}</span>
        <h3>${escapeHtml(lead.company || "Unknown company")}</h3>
        <p>${escapeHtml(lead.city || "")} ${lead.website ? `- ${escapeHtml(lead.website)}` : ""}</p>
        <div class="contact-row">
          ${lead.phone && lead.pitch ? `<a href="sms:${escapeAttr(telLink(lead.phone))}?&body=${encodeURIComponent(lead.pitch)}">📱 Text (1-tap)</a>` : ""}
          ${lead.phone ? `<a href="tel:${escapeAttr(telLink(lead.phone))}">Call</a>` : ""}
          ${lead.email ? `<a href="mailto:${escapeAttr(lead.email)}">Email</a>` : ""}
          ${lead.website ? `<a href="${escapeAttr(lead.website)}" target="_blank" rel="noreferrer">Site</a>` : ""}
        </div>
        <small>${escapeHtml(lead.nextStep || "")}</small>
      </div>
      <strong class="score">${Number(lead.score || 0)}</strong>
      <div class="card-actions">
        <button type="button" data-action="promote-lead" data-lead="${escapeHtml(lead.id)}">Do first</button>
        <button type="button" data-action="draft-email" data-lead="${escapeHtml(lead.id)}">Draft email</button>
        <button type="button" data-action="plan-send" data-lead="${escapeHtml(lead.id)}">Plan send</button>
      </div>
    </article>
  `;
}

function outreachCard(item) {
  return `
    <article class="small-card">
      <span>${escapeHtml(item.status || "planned")}</span>
      <strong>${escapeHtml(item.company || item.email || "Outreach")}</strong>
      <p>${escapeHtml(item.subject || item.lastAction || "")}</p>
      ${item.status === "sent" ? "" : `<button type="button" data-action="mark-sent" data-outreach="${escapeHtml(item.id)}">Mark sent</button>`}
      ${item.status === "sent" ? "" : `<button type="button" data-action="approve-send" data-outreach="${escapeHtml(item.id)}">Send now</button>`}
    </article>
  `;
}

function clientCard(item) {
  return `
    <article class="small-card">
      <span>${item.paid ? "paid" : escapeHtml(item.status || "client")}</span>
      <strong>${escapeHtml(item.company || item.email)}</strong>
      <p>${escapeHtml(item.previewUrl || "Preview pending")}</p>
      <div class="contact-row">
        ${item.email ? `<a href="mailto:${escapeAttr(item.email)}">Email</a>` : ""}
        ${item.phone ? `<a href="tel:${escapeAttr(telLink(item.phone))}">Call</a>` : ""}
        ${item.previewUrl ? `<a href="${escapeAttr(item.previewUrl)}" target="_blank" rel="noreferrer">Preview</a>` : ""}
      </div>
      <button type="button" data-action="client-edit" data-client="${escapeHtml(item.id)}">Add edit note</button>
      <button type="button" data-action="admin-suggestion" data-client="${escapeHtml(item.id)}">Tell team</button>
      <button type="button" data-action="version-ready" data-client="${escapeHtml(item.id)}">Version ready</button>
    </article>
  `;
}

function paymentCard(item) {
  return `
    <article class="small-card">
      <span>${escapeHtml(item.status || "waiting")}</span>
      <strong>${escapeHtml(item.company || "Payment")}</strong>
      <p>${escapeHtml(item.delivery || item.checkout || "")}</p>
      ${item.checkoutUrl ? `<a href="${escapeAttr(item.checkoutUrl)}" target="_blank" rel="noreferrer">Checkout</a>` : ""}
      <button type="button" data-action="create-checkout" data-payment="${escapeAttr(item.id || "")}">Create checkout</button>
      <button type="button" data-action="mark-paid" data-company="${escapeAttr(item.company || "")}">Mark paid</button>
    </article>
  `;
}

function taskLane(activeTasks, finishedTasks) {
  const active = activeTasks.map((task) => smallCard(task.title || task.goal || task.id, task.status, task.priority || task.owner)).join("");
  const finished = finishedTasks
    .slice(0, 6)
    .map((task) => buildCard(task))
    .join("");
  return `
    ${active || empty("No active tasks. Agents are watching for real leads.")}
    ${finished ? `<div class="lane-history"><span>Finished history</span>${finished}</div>` : ""}
  `;
}

// A finished build card — shows the new sample link AND the original site link as one-tap
// buttons (the builder records sampleUrl/sourceUrl on win). Falls back to plain text if absent.
function buildCard(task) {
  const title = task.title || task.goal || task.id;
  const sample = task.sampleUrl || (task.samplePath ? `https://amhsiterevival.com/${task.samplePath}` : "");
  const links = [
    sample ? `<a href="${escapeAttr(sample)}" target="_blank" rel="noreferrer">✨ New site ↗</a>` : "",
    task.sourceUrl ? `<a href="${escapeAttr(task.sourceUrl)}" target="_blank" rel="noreferrer">🌐 Original ↗</a>` : "",
  ].filter(Boolean).join("");
  return `<article class="small-card"><span>finished</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(task.result || task.previewUrl || "Done")}</p>${links ? `<div class="contact-row">${links}</div>` : ""}</article>`;
}

function smallCard(title, status, detail) {
  return `<article class="small-card"><span>${escapeHtml(status || "")}</span><strong>${escapeHtml(title || "")}</strong><p>${escapeHtml(detail || "")}</p></article>`;
}

function empty(text) {
  return `<div class="empty-state">${escapeHtml(text)}</div>`;
}

async function post(action, body = {}) {
  const response = await fetch("/api/command-center", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    alert(data.error || "Command failed.");
    return data;
  }
  await boot();
  return data;
}

document.addEventListener("click", async (event) => {
  const scrollTop = event.target.closest("[data-scroll-top]");
  if (scrollTop) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const scrollBottom = event.target.closest("[data-scroll-bottom]");
  if (scrollBottom) {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    return;
  }

  const viewMode = event.target.closest("[data-view-mode]");
  if (viewMode) {
    setViewMode(viewMode.dataset.viewMode || "regular");
    return;
  }

  const laneToggle = event.target.closest("[data-lane-toggle]");
  if (laneToggle) {
    const card = laneToggle.closest(".ops-card");
    card?.classList.toggle("is-collapsed");
    laneToggle.textContent = card?.classList.contains("is-collapsed") ? "Show section" : "Hide section";
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "promote-lead") await post(action, { leadId: button.dataset.lead });
  if (action === "draft-email") await post(action, { leadId: button.dataset.lead });
  if (action === "plan-send") await post(action, { leadId: button.dataset.lead });
  if (action === "mark-sent") await post(action, { outreachId: button.dataset.outreach });
  if (action === "approve-send") await post(action, { outreachId: button.dataset.outreach });
  if (action === "mark-paid") await post(action, { company: button.dataset.company });
  if (action === "create-checkout") await post(action, { paymentId: button.dataset.payment });
  if (action === "provider-toggle") await post(action, { provider: button.dataset.provider, enabled: button.dataset.enabled === "true" });
  if (action === "provider-confirm") await post(action, { provider: button.dataset.provider });
  if (action === "provider-budget") {
    const input = document.querySelector(`[data-provider-cap="${cssEscape(button.dataset.provider)}"]`);
    const budgetUsd = input?.value || "0";
    await post(action, { provider: button.dataset.provider, budgetUsd });
  }
  if (action === "client-edit") {
    const message = prompt("Edit note for this client?");
    if (message) await post(action, { clientId: button.dataset.client, message });
  }
  if (action === "admin-suggestion") {
    const message = prompt("Tell the team what to change or add?");
    if (message) await post(action, { clientId: button.dataset.client, message });
  }
  if (action === "version-ready") {
    const previewUrl = prompt("Preview URL to send or track?");
    if (previewUrl !== null) await post(action, { clientId: button.dataset.client, previewUrl });
  }
  if (action === "watchdog-kick") await post(action, {});
});

document.getElementById("quickQueue")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  await post("queue", { goal: form.get("goal") });
  event.currentTarget.reset();
});

document.getElementById("agentDirectionForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const message = String(form.get("message") || "").trim();
  const msg = document.getElementById("agentDirectionMsg");
  if (!message) return;
  if (msg) msg.textContent = form.get("runRequested") ? "Saving note and queueing the agent request..." : "Saving note...";
  try {
    const result = await post("agent-direction", {
      kind: form.get("kind"), lane: form.get("lane"), model: form.get("model"), message,
      dailyTokenCap: Number(form.get("dailyTokenCap") || 4000),
      runRequested: form.get("runRequested") === "on",
      autoPublish: form.get("autoPublish") === "on",
    });
    if (result?.ok === false) throw new Error(result.error || "Could not save the note.");
    event.currentTarget.reset();
    event.currentTarget.elements.dailyTokenCap.value = "4000";
    if (msg) msg.textContent = "Saved. The direction log and queue are current.";
  } catch (error) {
    if (msg) msg.textContent = error.message || "Could not save the note.";
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target?.id !== "goalForm") return;
  event.preventDefault();
  const form = new FormData(event.target);
  await post("production-goal", { dailySiteLimit: form.get("dailySiteLimit") });
});

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" }).catch(() => null);
  window.location.href = "/login.html";
});

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

function telLink(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value || "");
  return String(value || "").replace(/"/g, '\\"');
}

function setupLaneDefaults() {
  document.querySelectorAll(".ops-card").forEach((card) => {
    const shouldStayOpen = card.classList.contains("lane-customers") || card.classList.contains("lane-builds");
    card.classList.toggle("is-collapsed", !shouldStayOpen);
    const toggle = card.querySelector("[data-lane-toggle]");
    if (toggle) toggle.textContent = shouldStayOpen ? "Hide section" : "Show section";
  });
}

function setViewMode(mode) {
  const advanced = mode === "advanced";
  document.body.classList.toggle("show-ai-controls", advanced);
  document.querySelectorAll("[data-view-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewMode === mode);
  });
  const controls = document.querySelector(".dash-collapse");
  if (controls) {
    controls.open = advanced;
    if (advanced) controls.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

setupLaneDefaults();
setViewMode("regular");
boot();

