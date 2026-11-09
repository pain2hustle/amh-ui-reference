const toggle = document.querySelector(".menu-toggle");
const nav = document.getElementById("primaryNav");

toggle?.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  document.body.classList.toggle("nav-open", !open);
});

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    toggle?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  }
});
