/* NLN — app.js
   Vanilla, no build. In-memory state only (no storage APIs).
   Handles: mobile nav overlay, scroll reveal, mono-strip overflow trim,
   and the three-view Apply flow with route→pathway filtering. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // The Aurora homepage runs its own GSAP motion (initHomeMotion). All other
  // pages keep the shared three-tier scroll reveal below.
  var isHome = document.body.classList.contains("home");

  /* ---------- Smooth scroll (Lenis) + GSAP wiring (Feature 1) ----------
     Progressive enhancement. Both libraries come from a CDN; if either fails
     to load — or the user prefers reduced motion — every guard below is false
     and we fall through to native scroll + the one-time reveal further down.
     Lenis default (wrapper: window) drives native scroll, so it does NOT wrap
     the page in a transform — the fixed grain and fixed nav stay intact. */

  var lenis = null;
  var gsapReady =
    !reduceMotion &&
    typeof window.gsap !== "undefined" &&
    typeof window.ScrollTrigger !== "undefined";

  if (!reduceMotion && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
  }

  if (lenis && gsapReady) {
    // Let GSAP's ticker drive Lenis and keep ScrollTrigger in sync with it.
    window.gsap.registerPlugin(window.ScrollTrigger);
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add(function (time) {
      lenis.raf(time * 1000); // gsap ticker is in seconds, lenis wants ms
    });
    window.gsap.ticker.lagSmoothing(0);
  } else if (lenis) {
    // Lenis loaded but GSAP didn't: run our own rAF loop.
    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })(0);
  } else if (gsapReady) {
    // GSAP loaded but Lenis didn't: ScrollTrigger works off native scroll.
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  // Scroll-to helper used by the Apply flow: prefer Lenis, else native.
  function smoothScrollTop() {
    if (lenis) {
      lenis.scrollTo(0, { immediate: reduceMotion });
    } else {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  /* ---------- Mobile nav overlay ---------- */

  var toggle = document.querySelector(".nav-toggle");
  var overlay = document.getElementById("nav-overlay");
  var closeBtn = overlay ? overlay.querySelector(".nav-close") : null;

  function openNav() {
    overlay.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
    if (closeBtn) closeBtn.focus();
  }

  function closeNav() {
    overlay.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
    toggle.focus();
  }

  if (toggle && overlay) {
    toggle.addEventListener("click", openNav);
    if (closeBtn) closeBtn.addEventListener("click", closeNav);
    // Tapping any link closes the overlay
    overlay.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        overlay.classList.remove("open");
        document.body.classList.remove("no-scroll");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) {
        closeNav();
      }
    });
  }

  /* ---------- Nav: transparent at top, solid bar fades in on scroll ----------
     Toggles .scrolled on the nav past 80px. rAF throttles so we compute at
     most once per frame. Initial-load check covers refresh/back at scroll>80.
     Reduced-motion is handled in CSS (fade only, no slide). */

  var nav = document.querySelector(".nav");
  if (nav) {
    var SCROLL_THRESHOLD = 80;
    var navTicking = false;

    function updateNavState() {
      nav.classList.toggle("scrolled", window.scrollY > SCROLL_THRESHOLD);
      navTicking = false;
    }

    function onNavScroll() {
      if (!navTicking) {
        navTicking = true;
        window.requestAnimationFrame(updateNavState);
      }
    }

    window.addEventListener("scroll", onNavScroll, { passive: true });
    updateNavState(); // apply correct state on load (handles refresh while scrolled)
  }

  /* ---------- Mono meta-strip: drop last segment if it would wrap ---------- */

  function fitStrip() {
    document.querySelectorAll("[data-strip]").forEach(function (el) {
      if (!el.dataset.full) el.dataset.full = el.textContent;
      var parts = el.dataset.full.split(" · ");
      el.textContent = parts.join(" · ");
      while (el.scrollWidth > el.clientWidth && parts.length > 1) {
        parts.pop();
        el.textContent = parts.join(" · ");
      }
    });
  }
  fitStrip();
  window.addEventListener("resize", fitStrip);

  /* ---------- Scroll reveal ----------
     Three tiers, best available wins:
       1. GSAP + ScrollTrigger loaded → continuous scroll-LINKED reveal:
          each element scrubs from (y:40, faded) to (y:0, visible) tied to its
          scroll position — the "dramatic scrolling" feel.
       2. IntersectionObserver → the original one-time fade-in.
       3. Neither / reduced motion → show everything immediately. */

  if (isHome) {
    initHomeMotion();
  } else {
    var reveals = document.querySelectorAll(".reveal");
    if (gsapReady) {
      reveals.forEach(function (el) {
        // Drop the CSS transition so it can't lag behind GSAP's scrub updates.
        el.style.transition = "none";
        window.gsap.fromTo(
          el,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              end: "top 52%",
              scrub: true,
            },
          }
        );
      });
    } else if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) {
        el.classList.add("in");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var group = entry.target.parentNode.querySelectorAll(":scope > .reveal");
              var idx = Array.prototype.indexOf.call(group, entry.target);
              entry.target.style.transitionDelay = Math.max(0, idx) * 80 + "ms";
              entry.target.classList.add("in");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      );
      reveals.forEach(function (el) {
        io.observe(el);
      });
    }
  }

  /* ---------- Aurora homepage motion (Feature: index.html only) ----------
     A restrained GSAP program: a hero load-in timeline (~1.2s total) plus
     scroll-triggered reveals for the sections below. Respects reduced motion
     and degrades to instantly-visible content if GSAP didn't load. All
     animated elements carry .reveal, so CSS pre-hides them (no flash) and the
     fallback path simply flips them to .in. */
  function initHomeMotion() {
    // No GSAP (failed to load) or reduced motion → show everything at once.
    // (Under reduced motion the .reveal media query already reveals; adding
    // .in makes the non-reduced no-GSAP case safe too.)
    if (!gsapReady) {
      document.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("in");
      });
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    // Kill the .reveal CSS transition so GSAP owns the timing.
    gsap.utils.toArray(".reveal").forEach(function (el) {
      el.style.transition = "none";
    });

    // fromTo helper: end state always makes the element visible (autoAlpha:1),
    // overriding the .reveal opacity:0 pre-hide.
    function reveal(target, fromVars, toVars, st) {
      var to = Object.assign({ autoAlpha: 1, x: 0, y: 0 }, toVars);
      if (st) to.scrollTrigger = st;
      return gsap.fromTo(target, Object.assign({ autoAlpha: 0 }, fromVars), to);
    }

    // HERO — load-in timeline (total under ~1.2s). Each step ends at
    // autoAlpha:1 / y:0 to override the .reveal opacity:0 pre-hide.
    var tl = gsap.timeline({
      defaults: { ease: "power2.out", autoAlpha: 1, y: 0 },
    });
    tl.fromTo(".hero .meta-strip", { autoAlpha: 0, y: 8 }, { duration: 0.5 }, 0)
      .fromTo(".hero .level-tag", { autoAlpha: 0, y: 8 }, { duration: 0.5 }, 0.1)
      .fromTo(".hero .h1", { autoAlpha: 0, y: 16 }, { duration: 0.7 }, 0.2)
      .fromTo(".hero .hero-sub", { autoAlpha: 0, y: 12 }, { duration: 0.5 }, 0.35)
      .fromTo(".hero .hero-cta", { autoAlpha: 0, y: 12 }, { duration: 0.5 }, 0.5)
      .fromTo(".hero .hero-disclaimer", { autoAlpha: 0 }, { duration: 0.4 }, 0.7);

    // SECTION TITLES — fade + slide up when they enter at 85%.
    gsap.utils.toArray(".section-heading").forEach(function (el) {
      reveal(el, { y: 12 }, { duration: 0.6, ease: "power2.out" }, {
        trigger: el,
        start: "top 85%",
      });
    });

    // "HOW IT WORKS" step cards — staggered when the section is 20% in view.
    reveal(
      ".levels .level-card",
      { y: 20 },
      { duration: 0.6, ease: "power3.out", stagger: 0.08 },
      { trigger: ".levels", start: "top 80%" }
    );

    // "WHO'S BEHIND NLN" split — text up, visual in from the right, together.
    var behindST = { trigger: ".behind-split", start: "top 82%" };
    reveal(".behind-text", { y: 16 }, { duration: 0.7 }, behindST);
    reveal(".behind-visual", { x: 30 }, { duration: 0.7 }, behindST);

    // "READY?" — title scales in, body follows, when the section enters.
    var readyST = { trigger: ".ready-section", start: "top 80%" };
    reveal(".ready-title", { scale: 0.96 }, { scale: 1, duration: 0.9, ease: "power3.out" }, readyST);
    reveal(".ready-body", { y: 16 }, { duration: 0.6, ease: "power2.out" }, readyST);
  }

  /* ---------- Apply flow ---------- */

  var applyForm = document.getElementById("apply-root");
  if (applyForm && typeof ROUTES !== "undefined") {
    initApply();
  }

  function initApply() {
    var views = {
      1: document.getElementById("view-1"),
      2: document.getElementById("view-2"),
      done: document.getElementById("view-done"),
    };
    var strip = document.querySelector("[data-strip]");
    var stripText = {
      1: "NLN · Apply · 1 / 2",
      2: "NLN · Apply · 2 / 2",
      done: "NLN · Apply · Submitted",
    };

    // In-memory state (no storage APIs)
    var state = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      route: "",
      pathway: "",
      year: "",
      college: "",
      heard: "",
    };

    var f = {
      firstName: document.getElementById("firstName"),
      lastName: document.getElementById("lastName"),
      email: document.getElementById("email"),
      phone: document.getElementById("phone"),
      route: document.getElementById("route"),
      pathway: document.getElementById("pathway"),
      year: document.getElementById("year"),
      college: document.getElementById("college"),
      heard: document.getElementById("heard"),
    };

    var form1 = document.getElementById("form-1");
    var form2 = document.getElementById("form-2");
    var backBtn = document.getElementById("back-btn");

    // Populate route select from the single source of truth
    ROUTES.forEach(function (r) {
      var o = document.createElement("option");
      o.value = r.route;
      o.textContent = r.route;
      f.route.appendChild(o);
    });

    function populatePathways(routeName, keep) {
      f.pathway.innerHTML = "";
      var placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.disabled = true;
      if (!routeName) {
        placeholder.textContent = "Choose a route first";
        placeholder.selected = true;
        f.pathway.appendChild(placeholder);
        f.pathway.disabled = true;
        return;
      }
      placeholder.textContent = "Choose a pathway";
      placeholder.selected = !keep;
      f.pathway.appendChild(placeholder);
      var route = ROUTES.filter(function (r) {
        return r.route === routeName;
      })[0];
      route.pathways.forEach(function (p) {
        var o = document.createElement("option");
        o.value = p;
        o.textContent = p;
        if (keep && p === keep) o.selected = true;
        f.pathway.appendChild(o);
      });
      f.pathway.disabled = false;
    }

    // Initial pathway state
    populatePathways("", null);

    f.route.addEventListener("change", function () {
      state.route = f.route.value;
      state.pathway = ""; // changing route resets pathway
      populatePathways(f.route.value, null);
    });

    function show(view) {
      views[1].classList.add("is-hidden");
      views[2].classList.add("is-hidden");
      views.done.classList.add("is-hidden");
      views[view].classList.remove("is-hidden");
      if (strip) {
        // keep the cached full text in sync so a resize won't revert the strip
        strip.dataset.full = stripText[view];
        strip.textContent = stripText[view];
      }
      smoothScrollTop();
      // View swap changes document height; let ScrollTrigger recompute.
      if (gsapReady) window.ScrollTrigger.refresh();
    }

    // Step 1 → 2
    form1.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form1.checkValidity()) {
        form1.reportValidity();
        return;
      }
      state.firstName = f.firstName.value;
      state.lastName = f.lastName.value;
      state.email = f.email.value;
      state.phone = f.phone.value;
      show(2);
    });

    // Back → 1 (values intact)
    backBtn.addEventListener("click", function () {
      // capture any step-2 edits so forward keeps them
      state.route = f.route.value;
      state.pathway = f.pathway.value;
      state.year = f.year.value;
      state.college = f.college.value;
      state.heard = f.heard.value;
      show(1);
    });

    // Step 2 → confirmation
    form2.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form2.checkValidity()) {
        form2.reportValidity();
        return;
      }
      state.route = f.route.value;
      state.pathway = f.pathway.value;
      state.year = f.year.value;
      state.college = f.college.value;
      state.heard = f.heard.value;
      show("done");
    });

    // Restore field values from state whenever a form view is shown
    function restore() {
      f.firstName.value = state.firstName;
      f.lastName.value = state.lastName;
      f.email.value = state.email;
      f.phone.value = state.phone;
      f.year.value = state.year;
      f.college.value = state.college;
      f.heard.value = state.heard;
      if (state.route) {
        f.route.value = state.route;
        populatePathways(state.route, state.pathway);
      }
    }
    // Re-restore on every Back/Continue by wrapping show
    var _show = show;
    show = function (view) {
      _show(view);
      if (view === 1 || view === 2) restore();
    };
  }

  /* ---------- Routes marquee (homepage only) ----------
     Built from data.js so it can never drift from the source of truth.
     Counts use the derived ROUTE_COUNT / PATHWAY_COUNT (data.js computes
     PATHWAY_COUNT === 20) rather than hardcoded numbers. */

  var marquee = document.querySelector("[data-marquee]");
  if (marquee && typeof ROUTES !== "undefined") {
    var marqueeContent = [ROUTE_COUNT + " ROUTES", PATHWAY_COUNT + " PATHWAYS"]
      .concat(
        ROUTES.map(function (r) {
          return r.route.toUpperCase();
        })
      )
      .join(" · ");

    // Scrolling row: two identical copies so the tail of A meets the head of
    // B. Each copy carries a trailing " · " so the seam reads continuously,
    // and translateX(-50%) lands exactly one copy over for a jump-free loop.
    var track = document.createElement("div");
    track.className = "routes-marquee-track";
    track.setAttribute("aria-hidden", "true");
    for (var c = 0; c < 2; c++) {
      var copy = document.createElement("span");
      copy.className = "routes-marquee-copy";
      copy.textContent = marqueeContent + " · ";
      track.appendChild(copy);
    }
    marquee.appendChild(track);

    // Static fallback shown (via CSS) under prefers-reduced-motion.
    var stat = document.createElement("div");
    stat.className = "routes-marquee-static";
    stat.setAttribute("aria-hidden", "true");
    stat.textContent = marqueeContent;
    marquee.appendChild(stat);
  }

  /* ---------- Footer year (kept as static © 2026 per copy spec) ---------- */
})();
