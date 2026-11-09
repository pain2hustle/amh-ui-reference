const intakeModal = document.getElementById("intakeModal");
const openIntake = () => {
  intakeModal?.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  intakeModal?.querySelector("input")?.focus();
};
const closeIntake = () => {
  intakeModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

document.querySelectorAll("[data-open-intake]").forEach((button) => button.addEventListener("click", openIntake));
document.querySelectorAll("[data-close-intake]").forEach((button) => button.addEventListener("click", closeIntake));
intakeModal?.addEventListener("click", (event) => {
  if (event.target === intakeModal) closeIntake();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeIntake();
});

document.querySelectorAll("#siteIntake, #siteIntakeModal, #pricingIntake").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const msg = form.querySelector(".form-msg, [data-intake-msg]");
    if (msg) {
      msg.classList.remove("ok");
      msg.textContent = "Sending to AMH...";
    }
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (msg) msg.textContent = data.error || "Could not send yet. Email AMH directly.";
        return;
      }
      if (msg) {
        msg.classList.add("ok");
        msg.textContent = "Sent. AMH has it in the private queue.";
      }
      const pays = form.closest(".price-card")?.querySelectorAll("[data-price-pay]") || [];
      pays.forEach((pay) => {
        pay.classList.remove("is-locked");
        pay.setAttribute("aria-disabled", "false");
      });
      if (pays.length && msg) msg.textContent = "Details sent. Basic and Premium payment are unlocked.";
      form.reset();
      window.setTimeout(closeIntake, 1400);
    } catch {
      if (msg) msg.textContent = "Could not connect yet. Email AMH directly.";
    }
  });
});

document.querySelectorAll("[data-price-pay]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (link.getAttribute("aria-disabled") !== "true") return;
    event.preventDefault();
    const msg = link.closest(".price-card")?.querySelector("[data-intake-msg]");
    if (msg) {
      msg.classList.remove("ok");
      msg.textContent = "Fill and send the project details before opening Stripe.";
    }
  });
});
