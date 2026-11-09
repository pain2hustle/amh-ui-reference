let installPrompt = null;
const installButtons = document.querySelectorAll("[data-install-app]");
const installBanners = document.querySelectorAll("[data-install-banner]");
const closeButtons = document.querySelectorAll("[data-install-close]");
const dismissed = localStorage.getItem("amhFieldScanInstallDismissed") === "1";

if (dismissed) {
  installBanners.forEach((banner) => {
    banner.hidden = true;
  });
}

function setInstallState(enabled) {
  installButtons.forEach((button) => {
    button.hidden = false;
    button.disabled = false;
    button.title = enabled ? "Install AMH FieldScan as an app" : "If the install prompt is not available, use your browser menu to add to home screen";
    button.textContent = enabled ? "Install" : "Open";
  });
}

setInstallState(false);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  setInstallState(true);
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    localStorage.setItem("amhFieldScanInstallDismissed", "1");
    installBanners.forEach((banner) => {
      banner.hidden = true;
    });
  });
});

installButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (!installPrompt) {
      window.location.href = "/fieldproof";
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    installPrompt = null;
    setInstallState(false);
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}