/* =====================================================================
   Giuseppe Sorgentone - Portfolio
   Navigation, theming, i18n, scroll effects and micro-interactions.
   ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const store = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        /* storage unavailable: ignore */
      }
    },
  };

  /* ---------- SCROLL REVEAL ----------
     Set up first: whatever happens further down, the content shows up. */

  const revealItems = $$(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealItems.forEach((el) => revealObserver.observe(el));

    // safety net: anything already on screen once everything has loaded
    window.addEventListener("load", () => {
      revealItems.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add("is-visible");
        }
      });
    });
  }

  /* ---------- TOAST ---------- */

  const toastEl = $("#toast");
  let toastTimer;

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2200);
  }

  /* ---------- THEME ---------- */

  const themeToggle = $("#themeToggle");

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    store.set("preferred-theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
    }
  }

  setTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* ---------- LANGUAGE ---------- */

  const langButtons = $$("[data-lang-btn]");
  const langThumb = $("#langThumb");

  const COPY = {
    en: { copied: "Email copied to clipboard", copyFail: "Could not copy - select it manually" },
    it: { copied: "Email copiata negli appunti", copyFail: "Copia non riuscita - selezionala a mano" },
  };

  function moveLangThumb() {
    const active = langButtons.find((b) => b.classList.contains("lang-btn--active"));
    if (!langThumb || !active || !active.offsetParent) return;
    langThumb.style.width = active.offsetWidth + "px";
    langThumb.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  function setLang(lang) {
    root.setAttribute("data-lang", lang);
    root.lang = lang;
    langButtons.forEach((btn) => {
      const on = btn.dataset.langBtn === lang;
      btn.classList.toggle("lang-btn--active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    store.set("preferred-lang", lang);
    moveLangThumb();
    // widths of nav labels change with the language
    requestAnimationFrame(moveNavPill);
  }

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.langBtn));
  });

  const storedLang = store.get("preferred-lang");
  setLang(storedLang === "it" || storedLang === "en" ? storedLang : "en");

  function t(key) {
    return (COPY[root.getAttribute("data-lang")] || COPY.en)[key];
  }

  /* ---------- NAVIGATION ---------- */

  const topBar = $("#topBar");
  const mainNav = $("#mainNav");
  const navPill = $("#navPill");
  const mobileNav = $("#mobileNav");
  const menuBtn = $("#menuBtn");
  const navBackdrop = $("#navBackdrop");
  const desktopLinks = mainNav ? $$(".nav-link[data-section]", mainNav) : [];
  const mobileLinks = mobileNav ? $$(".nav-link[data-section]", mobileNav) : [];
  const sections = $$("main section[id]");

  function moveNavPill() {
    const active = desktopLinks.find((b) => b.classList.contains("nav-link--active"));
    if (!navPill || !active) return;
    if (!active.offsetParent) {
      navPill.style.opacity = "0";
      return;
    }
    navPill.style.opacity = "1";
    navPill.style.width = active.offsetWidth + "px";
    navPill.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  let activeSectionId = null;

  function setActiveSection(id) {
    if (id === activeSectionId) return; // avoids a layout read on every scroll frame
    activeSectionId = id;
    [...desktopLinks, ...mobileLinks].forEach((btn) => {
      const on = btn.dataset.section === id;
      btn.classList.toggle("nav-link--active", on);
      if (on) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });
    moveNavPill();
  }

  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    setActiveSection(id);
  }

  $$("[data-section]").forEach((el) => {
    el.addEventListener("click", () => {
      closeMenu();
      scrollToSection(el.dataset.section);
    });
  });

  /* mobile drawer */

  function openMenu() {
    if (!mobileNav) return;
    mobileNav.classList.add("is-open");
    navBackdrop && navBackdrop.classList.add("is-open");
    menuBtn && menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-locked");
  }

  function closeMenu() {
    if (!mobileNav) return;
    mobileNav.classList.remove("is-open");
    navBackdrop && navBackdrop.classList.remove("is-open");
    menuBtn && menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      mobileNav.classList.contains("is-open") ? closeMenu() : openMenu();
    });
  }

  navBackdrop && navBackdrop.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- SCROLL STATE: header, progress, spy, back-to-top ---------- */

  const progressBar = $("#scrollProgress");
  const toTop = $("#toTop");
  let ticking = false;

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    topBar && topBar.classList.toggle("is-stuck", y > 12);
    toTop && toTop.classList.toggle("is-visible", y > window.innerHeight * 0.7);

    if (progressBar) {
      progressBar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    }

    // scroll spy: the last section whose top has crossed the reading line
    const line = y + window.innerHeight * 0.32;
    let current = sections.length ? sections[0].id : null;
    sections.forEach((section) => {
      if (section.offsetTop <= line) current = section.id;
    });
    if (max > 0 && y >= max - 4 && sections.length) {
      current = sections[sections.length - 1].id;
    }
    if (current) setActiveSection(current);

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    moveNavPill();
    moveLangThumb();
    if (window.innerWidth > 900) closeMenu();
  });

  toTop &&
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

  /* ---------- CARD CURSOR SPOTLIGHT ---------- */

  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });

    /* subtle 3D tilt on the profile photo */
    const photoCard = $("#photoCard");
    if (photoCard) {
      const wrap = photoCard.parentElement;
      wrap.addEventListener("pointermove", (e) => {
        const r = photoCard.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        photoCard.style.transform = `rotateY(${dx * 7}deg) rotateX(${-dy * 7}deg) translateZ(0)`;
      });
      wrap.addEventListener("pointerleave", () => {
        photoCard.style.transform = "";
      });
    }
  }

  /* ---------- LOCAL TIME IN BOLOGNA ---------- */

  const clockEl = $("#localClock");
  if (clockEl) {
    try {
      // Intl derives CET / CEST from the date, so it never goes stale
      const clockFmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Rome",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
        timeZoneName: "short",
      });
      const paintClock = () => {
        clockEl.textContent = clockFmt.format(new Date());
      };
      // re-aim at the next whole second every time, so it never drifts
      const tickClock = () => {
        paintClock();
        setTimeout(tickClock, 1000 - (Date.now() % 1000) + 15);
      };
      tickClock();
      clockEl.hidden = false;
      // a throttled background tab can leave it stale
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) paintClock();
      });
    } catch (e) {
      /* no Intl or no tz database: the pill just shows the city */
    }
  }

  /* ---------- PROFILE PHOTO SWAP ---------- */

  const photoCircle = $("#photoCircle");
  const photoSwap = $("#photoSwap");

  if (photoCircle && photoSwap) {
    photoSwap.addEventListener("click", () => {
      const showingAlt = photoCircle.classList.toggle("is-alt");
      photoSwap.classList.toggle("is-alt", showingAlt);

      // only the visible one should be announced
      const main = $(".photo-img--main", photoCircle);
      const alt = $(".photo-img--alt", photoCircle);
      if (main) main.setAttribute("aria-hidden", String(showingAlt));
      if (alt) alt.setAttribute("aria-hidden", String(!showingAlt));

      if (!reduceMotion) {
        photoCircle.classList.remove("is-swapping");
        void photoCircle.offsetWidth; // restart the animation
        photoCircle.classList.add("is-swapping");
      }
    });
  }

  /* ---------- COPY TO CLIPBOARD ---------- */

  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.dataset.copy;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(value);
        } else {
          const tmp = document.createElement("textarea");
          tmp.value = value;
          tmp.style.position = "fixed";
          tmp.style.opacity = "0";
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand("copy");
          document.body.removeChild(tmp);
        }
        toast("✓ " + t("copied"));
      } catch (e) {
        toast(t("copyFail"));
      }
    });
  });

  /* ---------- PROJECT FILTERS ---------- */

  const filterBar = $("#projectFilters");
  const projectCards = $$("#projectsGrid .card");

  if (filterBar) {
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;

      $$(".filter-btn", filterBar).forEach((b) => {
        const on = b === btn;
        b.classList.toggle("filter-btn--active", on);
        b.setAttribute("aria-pressed", String(on));
      });

      const filter = btn.dataset.filter;
      projectCards.forEach((card) => {
        const match = filter === "all" || card.dataset.tech === filter;
        card.classList.toggle("is-filtered", !match);
        card.classList.remove("is-entering");
        if (match && !reduceMotion) {
          // restart the entry animation
          void card.offsetWidth;
          card.classList.add("is-entering");
        }
      });
    });
  }

  /* ---------- SUGGESTED VIDEOS: lazy facade + titles ---------- */

  const scroller = $("#videoScroller");
  const videoCards = $$(".video-card[data-video]");

  const PLAY_SVG =
    '<span class="play-badge"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>';

  function buildVideoCard(card) {
    const id = card.dataset.video;
    const url = "https://www.youtube.com/watch?v=" + id;

    card.innerHTML = `
      <div class="video-frame">
        <button class="video-facade" type="button" aria-label="Play video">
          <img class="video-thumb" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" draggable="false" />
          ${PLAY_SVG}
        </button>
      </div>
      <p class="video-caption">YouTube</p>
      <p class="video-sub">
        <a class="link-underline" href="${url}" target="_blank" rel="noopener">Open on YouTube ↗</a>
      </p>`;

    // real title / channel, when YouTube's oEmbed endpoint is reachable
    return fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (data.title) {
          $(".video-caption", card).textContent = data.title;
          $(".video-facade", card).setAttribute("aria-label", `Play: ${data.title}`);
        }
        if (data.author_name) {
          const sub = $(".video-sub", card);
          const channel = document.createElement("span");
          channel.textContent = data.author_name;
          const dot = document.createElement("span");
          dot.setAttribute("aria-hidden", "true");
          dot.textContent = "·";
          sub.prepend(channel, dot);
        }
      })
      .catch(() => {
        /* offline or blocked: the generic caption stays */
      });
  }

  const videosReady = Promise.all(videoCards.map(buildVideoCard));

  /* ---------- CAROUSEL: auto-scroll, arrows, drag ---------- */

  if (scroller) {
    const wrap = scroller.parentElement;
    const prevBtn = $("#scrollPrev");
    const nextBtn = $("#scrollNext");
    const autoBtn = $("#scrollAuto");

    const AUTO_SPEED = 32; // px per second - a slow drift, not a slideshow
    const RESUME_AFTER = 5000; // ms of quiet before the drift takes over again

    const step = () => Math.max(scroller.clientWidth * 0.8, 280);

    let looping = false; // cloned track in place, safe to wrap around
    let loopWidth = 0;
    let autoPos = 0; // fractional position; scrollLeft alone would round it away
    let rafId = null;
    let lastTs = 0;

    // every reason we might not be drifting right now
    let userPaused = false;
    let hovering = false;
    let focusWithin = false;
    let dragging = false;
    let interacting = false;
    let inView = false;
    let interactTimer = null;

    function canDrift() {
      return (
        looping &&
        !userPaused &&
        !hovering &&
        !focusWithin &&
        !dragging &&
        !interacting &&
        inView &&
        !document.hidden
      );
    }

    function syncAutoBtn() {
      if (!autoBtn) return;
      autoBtn.hidden = !looping;
      autoBtn.classList.toggle("is-paused", userPaused);
    }

    /* -- manual interaction takes precedence over the drift -- */

    function noteInteraction() {
      interacting = true;
      clearTimeout(interactTimer);
      interactTimer = setTimeout(() => {
        interacting = false;
      }, RESUME_AFTER);
    }

    function stopDrift() {
      userPaused = true;
      syncAutoBtn();
    }

    /* -- edges & arrows -- */

    function updateScrollerEdges() {
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      wrap.classList.toggle("has-overflow", maxScroll > 4);
      wrap.classList.toggle("at-end", !looping && scroller.scrollLeft >= maxScroll - 4);
      // with a looping track there is no first or last card
      if (prevBtn) prevBtn.disabled = !looping && scroller.scrollLeft <= 2;
      if (nextBtn) nextBtn.disabled = !looping && scroller.scrollLeft >= maxScroll - 4;
    }

    function nudge(direction) {
      noteInteraction();
      // going back from the very start: hop a full cycle forward first,
      // so the carousel stays endless in both directions
      if (looping && direction < 0 && scroller.scrollLeft < step()) {
        scroller.scrollLeft += loopWidth;
        autoPos = scroller.scrollLeft;
      }
      scroller.scrollBy({
        left: direction * step(),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }

    prevBtn && prevBtn.addEventListener("click", () => nudge(-1));
    nextBtn && nextBtn.addEventListener("click", () => nudge(1));

    autoBtn &&
      autoBtn.addEventListener("click", () => {
        userPaused = !userPaused;
        if (!userPaused) {
          interacting = false;
          clearTimeout(interactTimer);
          autoPos = scroller.scrollLeft;
        }
        syncAutoBtn();
      });

    scroller.addEventListener(
      "scroll",
      () => {
        updateScrollerEdges();
        // a scroll we did not cause: adopt it as the new drift origin
        if (Math.abs(scroller.scrollLeft - autoPos) > 2) autoPos = scroller.scrollLeft;
      },
      { passive: true }
    );

    /* -- pause triggers -- */

    scroller.addEventListener("mouseenter", () => {
      hovering = true;
    });
    scroller.addEventListener("mouseleave", () => {
      hovering = false;
    });
    scroller.addEventListener("focusin", () => {
      focusWithin = true;
    });
    scroller.addEventListener("focusout", () => {
      focusWithin = false;
    });
    scroller.addEventListener("wheel", noteInteraction, { passive: true });
    scroller.addEventListener("touchstart", noteInteraction, { passive: true });
    document.addEventListener("visibilitychange", () => {
      lastTs = 0; // do not jump ahead by however long the tab was hidden
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          inView = entries[0].isIntersecting;
        },
        { threshold: 0 }
      ).observe(scroller);
    } else {
      inView = true;
    }

    /* -- playing a video wins over everything -- */

    scroller.addEventListener("click", (e) => {
      const facade = e.target.closest(".video-facade");
      if (!facade) return;
      if (facade.dataset.dragged === "1") {
        facade.dataset.dragged = "0";
        return;
      }
      const card = facade.closest(".video-card");
      const frame = facade.closest(".video-frame");
      if (!card || !frame) return;

      const caption = $(".video-caption", card);
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${card.dataset.video}?autoplay=1&rel=0`;
      iframe.title = (caption && caption.textContent) || "YouTube video player";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      frame.replaceChildren(iframe);

      stopDrift(); // never scroll a playing video out of view
    });

    /* -- drag to scroll -- */

    let startX = 0;
    let startScroll = 0;
    let moved = 0;

    scroller.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return; // native touch scrolling is better
      dragging = true;
      moved = 0;
      startX = e.clientX;
      startScroll = scroller.scrollLeft;
      scroller.classList.add("is-dragging");
    });

    scroller.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const delta = e.clientX - startX;
      moved = Math.abs(delta);
      scroller.scrollLeft = startScroll - delta;
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      scroller.classList.remove("is-dragging");
      if (moved > 6) {
        noteInteraction();
        const facade = e.target && e.target.closest && e.target.closest(".video-facade");
        if (facade) facade.dataset.dragged = "1";
      }
    };

    scroller.addEventListener("pointerup", endDrag);
    scroller.addEventListener("pointerleave", endDrag);
    scroller.addEventListener("pointercancel", endDrag);

    /* -- the drift itself -- */

    function tick(ts) {
      rafId = requestAnimationFrame(tick);
      const dt = lastTs ? Math.min(ts - lastTs, 60) : 0;
      lastTs = ts;
      if (!dt || !canDrift()) return;

      autoPos += (AUTO_SPEED * dt) / 1000;
      // the second half of the track is a copy of the first: rewinding by
      // one cycle lands on an identical frame, so the seam is invisible
      if (autoPos >= loopWidth) autoPos -= loopWidth;
      scroller.scrollLeft = autoPos;
    }

    function measureLoop() {
      const first = scroller.children[0];
      const firstClone = scroller.querySelector('[data-clone="1"]');
      if (!first || !firstClone) return;
      loopWidth = firstClone.offsetLeft - first.offsetLeft;
      looping = loopWidth > 10;
    }

    // clone the track only once the real titles are in, so both halves match
    videosReady.then(() => {
      updateScrollerEdges();
      if (reduceMotion || videoCards.length < 2) return;

      Array.from(scroller.children).forEach((card) => {
        const clone = card.cloneNode(true);
        clone.dataset.clone = "1";
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("a, button").forEach((el) => {
          el.tabIndex = -1;
        });
        scroller.appendChild(clone);
      });

      measureLoop();
      syncAutoBtn();
      updateScrollerEdges();
      if (looping && rafId === null) rafId = requestAnimationFrame(tick);
    });

    window.addEventListener("resize", () => {
      if (looping) measureLoop();
      updateScrollerEdges();
    });

    updateScrollerEdges();
    setTimeout(updateScrollerEdges, 600); // thumbnails settle the layout
  }

  /* ---------- FOOTER YEAR + FIRST PAINT ---------- */

  const yearSpan = $("#year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  onScroll();
  requestAnimationFrame(() => {
    moveNavPill();
    moveLangThumb();
  });

  // web fonts change label widths: recompute once they are ready
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      moveNavPill();
      moveLangThumb();
    });
  }
});
