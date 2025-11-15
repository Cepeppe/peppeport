document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;

  /* ---------- NAVIGATION & SMOOTH SCROLL ---------- */

  const navButtons = document.querySelectorAll(".nav-link[data-section]");
  const allSections = Array.from(document.querySelectorAll("section[id]"));

  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.section;
      scrollToSection(id);
    });
  });

  // Anche bottoni/card con data-section
  document.querySelectorAll("[data-section]").forEach((btn) => {
    if (!btn.classList.contains("nav-link")) {
      btn.addEventListener("click", () => {
        const id = btn.dataset.section;
        scrollToSection(id);
      });
    }
  });

  // Evidenzia la sezione attiva nella navbar
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navButtons.forEach((btn) => {
            btn.classList.toggle(
              "nav-link--active",
              btn.dataset.section === id
            );
          });
        }
      });
    },
    {
      threshold: 0.35,
    }
  );

  allSections.forEach((section) => observer.observe(section));

  /* ---------- LANGUAGE TOGGLE ---------- */

  const langButtons = document.querySelectorAll("[data-lang-btn]");
  const storedLang = (() => {
    try {
      return localStorage.getItem("preferred-lang");
    } catch (e) {
      return null;
    }
  })();

  const defaultLang =
    storedLang === "it" || storedLang === "en" ? storedLang : "en";

  function setLang(lang) {
    root.setAttribute("data-lang", lang);
    langButtons.forEach((btn) => {
      btn.classList.toggle("lang-btn--active", btn.dataset.langBtn === lang);
    });
    try {
      localStorage.setItem("preferred-lang", lang);
    } catch (e) {
      // storage non disponibile: ignora
    }
  }

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.langBtn;
      setLang(lang);
    });
  });

  setLang(defaultLang);

  /* ---------- FOOTER YEAR ---------- */

  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
