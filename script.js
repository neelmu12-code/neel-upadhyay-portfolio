const header = document.querySelector("[data-site-header]");
const nav = document.querySelector("[data-site-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = Array.from(document.querySelectorAll(".site-nav a[href^='#']"));
const revealElements = document.querySelectorAll(".reveal");
const yearNode = document.getElementById("year");

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const syncHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
};

syncHeaderState();
window.addEventListener("scroll", syncHeaderState, { passive: true });

const isNavigationOpen = () => navToggle?.getAttribute("aria-expanded") === "true";

const closeNavigation = ({ returnFocus = false } = {}) => {
  const wasOpen = isNavigationOpen();
  nav?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
  document.documentElement.classList.remove("nav-open");

  if (returnFocus && wasOpen) {
    navToggle?.focus();
  }
};

navToggle?.addEventListener("click", () => {
  const willOpen = !isNavigationOpen();

  if (!willOpen) {
    closeNavigation();
    return;
  }

  navToggle.setAttribute("aria-expanded", String(willOpen));
  nav?.classList.toggle("is-open", willOpen);
  document.documentElement.classList.toggle("nav-open", willOpen);
  window.requestAnimationFrame(() => navLinks[0]?.focus());
});

navLinks.forEach((link) => link.addEventListener("click", closeNavigation));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isNavigationOpen()) {
    closeNavigation({ returnFocus: true });
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 980) {
    closeNavigation();
  }
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.09,
      rootMargin: "0px 0px -48px 0px",
    }
  );

  revealElements.forEach((element) => revealObserver.observe(element));

  const trackedSections = Array.from(document.querySelectorAll("main section[id]"));
  const navObserver = new IntersectionObserver(
    (entries) => {
      const visibleSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleSection) {
        return;
      }

      navLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${visibleSection.target.id}`;
        link.classList.toggle("is-active", isCurrent);

        if (isCurrent) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    },
    {
      rootMargin: "-28% 0px -58% 0px",
      threshold: [0.01, 0.2, 0.5],
    }
  );

  trackedSections.forEach((section) => navObserver.observe(section));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}
