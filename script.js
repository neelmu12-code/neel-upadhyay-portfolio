document.documentElement.classList.add("js");

const header = document.querySelector("[data-site-header]");
const nav = document.querySelector("[data-site-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const revealElements = document.querySelectorAll(".reveal");
const yearNodes = document.querySelectorAll("[data-year]");

yearNodes.forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

const isNavOpen = () => navToggle?.getAttribute("aria-expanded") === "true";

const closeNav = ({ restoreFocus = false } = {}) => {
  const wasOpen = isNavOpen();
  nav?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
  document.documentElement.classList.remove("nav-open");

  if (restoreFocus && wasOpen) {
    navToggle?.focus();
  }
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

navToggle?.addEventListener("click", () => {
  const opening = !isNavOpen();
  navToggle.setAttribute("aria-expanded", String(opening));
  nav?.classList.toggle("is-open", opening);
  document.documentElement.classList.toggle("nav-open", opening);

  if (opening) {
    window.requestAnimationFrame(() => nav?.querySelector("a")?.focus());
  }
});

nav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    closeNav();
  }
});

document.addEventListener("click", (event) => {
  if (isNavOpen() && !header?.contains(event.target)) {
    closeNav();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isNavOpen()) {
    closeNav({ restoreFocus: true });
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 980) {
    closeNav();
  }
});

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
    { threshold: 0.08, rootMargin: "0px 0px -36px" }
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}
