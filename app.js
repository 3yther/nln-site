/* NLN — app.js
   Vanilla, no build. In-memory state only (no storage APIs).
   Handles: mobile nav overlay, scroll reveal, mono-strip overflow trim,
   and the three-view Apply flow with route→pathway filtering. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

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

  /* ---------- Homepage motion (GSAP) ----------
     Everything in here is additive: each block no-ops unless GSAP loaded and
     the user allows motion. The resting DOM/CSS is always the finished state,
     so no-JS and reduced-motion users get the full page with nothing hidden.

     BOUNCE: back.out(1.7) is GSAP's twin of the --ease-bounce token in
     styles.css (cubic-bezier(0.34, 1.56, 0.64, 1)). Change one, change both. */

  var BOUNCE = "back.out(1.7)";

  /* ---------- The climb: off-screen pause ----------
     The field is ten continuously-running CSS animations. Once the hero has
     left the viewport there is nobody to see them, so stop ticking. Paused
     rather than removed: scrolling back up resumes mid-climb instead of
     snapping all ten words to their start, which would be exactly the visible
     "restart" the whole design is built to avoid.
     Deliberately outside the gsapReady branch — the climb is pure CSS and owes
     the CDN nothing. */
  var heroEl = document.querySelector(".hero");
  if (heroEl && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      heroEl.classList.toggle("climb-idle", !entries[0].isIntersecting);
    }).observe(heroEl);
  }

  /* ---------- The climb: drift guard ----------
     The route names are static markup so that no-JS and reduced-motion hold the
     finished state without running anything. That buys robustness and costs a
     second copy of the list, so shout if the copy drifts from data.js. NOTES.md
     item 1 is explicit that a wrong route list is the one error this audience
     will catch, and the climb is now the largest text on the site. */
  var climbEl = document.querySelector("[data-climb]");
  if (climbEl && typeof ROUTES !== "undefined") {
    var inDom = Array.prototype.map.call(climbEl.children, function (li) {
      return li.textContent.trim();
    });
    var inData = ROUTES.map(function (r) {
      return r.route;
    });
    var missing = inData.filter(function (n) {
      return inDom.indexOf(n) === -1;
    });
    var extra = inDom.filter(function (n) {
      return inData.indexOf(n) === -1;
    });
    if (missing.length || extra.length) {
      console.warn(
        "[NLN] Hero climb has drifted from data.js → ROUTES. " +
          "Fix index.html .climb-field to match.",
        { missingFromClimb: missing, notARoute: extra }
      );
    }
  }

  if (gsapReady) {
    var gsap = window.gsap;

    /* ---------- H1: character cascade ----------
       Chars rise into place, matching the climb's direction. Once, on load.
       SplitType rather than GSAP's SplitText: SplitText is a Club plugin in
       the 3.12.5 pinned here, and that pin is shared by all six pages (see
       NOTES.md → DEVIATIONS 17).
       The split spans are visual only — the accessible name is pinned to the
       whole phrase first, so assistive tech reads a sentence and not sixteen
       separate letters. If SplitType fails to load, the H1 is already real
       text in the DOM and simply doesn't cascade. */
    var h1El = document.querySelector("[data-h1]");
    if (h1El && typeof window.SplitType !== "undefined") {
      h1El.setAttribute(
        "aria-label",
        h1El.textContent.replace(/\s+/g, " ").trim()
      );
      var split = new window.SplitType(h1El, {
        types: "chars",
        tagName: "span",
      });
      Array.prototype.forEach.call(h1El.children, function (child) {
        child.setAttribute("aria-hidden", "true");
      });
      if (split.chars && split.chars.length) {
        gsap.fromTo(
          split.chars,
          { yPercent: 110, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.7,
            stagger: 0.026,
            ease: "power3.out",
            delay: 0.12,
            // Drop the inline transforms once landed, so the resting DOM is
            // the finished state and nothing is left mid-matrix.
            clearProps: "transform,opacity,visibility",
          }
        );
      }
    }

    /* Sub and CTA follow the headline up, not alongside it. */
    var heroFollow = document.querySelectorAll(".hero-sub, .hero-cta");
    if (heroFollow.length) {
      gsap.fromTo(
        heroFollow,
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.62,
          clearProps: "transform,opacity,visibility",
        }
      );
    }

    /* Section reveals, grouped per <section> so members stagger together. The
       levels staircase and the "Who's behind" block opt out — they have their
       own choreography below. */
    document.querySelectorAll("main section").forEach(function (sec) {
      var els = sec.querySelectorAll(
        ".reveal:not(.level-card):not([data-behind])"
      );
      if (!els.length) return;
      els.forEach(function (el) {
        el.style.transition = "none"; // CSS .reveal transition would fight GSAP
      });
      gsap.fromTo(
        els,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: BOUNCE,
          scrollTrigger: { trigger: sec, start: "top 82%", once: true },
        }
      );
    });

    /* The staircase: cards climb in one at a time, each swinging in off its
       own Y axis. Tighter 0.1s stagger so the four read as one ascent. */
    var levelCards = document.querySelectorAll(".level-card");
    if (levelCards.length) {
      levelCards.forEach(function (el) {
        el.style.transition = "none";
      });
      gsap.fromTo(
        levelCards,
        { autoAlpha: 0, y: 40, rotateY: 3, scale: 0.95 },
        {
          autoAlpha: 1,
          y: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: BOUNCE,
          scrollTrigger: { trigger: ".levels", start: "top 85%", once: true },
          // Drop the inline transform so :hover isn't fighting a leftover
          // matrix once the reveal has finished.
          clearProps: "transform",
        }
      );
    }

    /* "Who's behind": copy slides in from the left. The spec's avatar zoom has
       nothing to zoom — there's no founder photo on this page (NOTES.md keeps
       it TBC and bars stock imagery), so the text carries the moment alone. */
    var behind = document.querySelector("[data-behind]");
    if (behind) {
      behind.style.transition = "none";
      gsap.fromTo(
        behind,
        { autoAlpha: 0, x: -40 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.8,
          ease: BOUNCE,
          scrollTrigger: { trigger: behind, start: "top 82%", once: true },
        }
      );
    }

    /* Divider rules wipe in from the left / top. */
    document.querySelectorAll("[data-rule]").forEach(function (el) {
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        }
      );
    });

    var readyRule = document.querySelector(".ready-rule");
    if (readyRule) {
      gsap.fromTo(
        readyRule,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".ready-section",
            start: "top 80%",
            once: true,
          },
        }
      );
    }
  }

  /* Scroll progress. Deliberately outside the gsapReady/reduced-motion guard:
     the bar only ever reflects the scroll position the user is already
     driving, so it isn't autonomous motion. Falls back to a rAF-throttled
     scroll listener when GSAP is absent. */
  var progress = document.querySelector("[data-progress]");
  if (progress && gsapReady) {
    window.gsap.to(progress, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3,
      },
    });
  } else if (progress) {
    var progressTicking = false;
    function updateProgress() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? window.scrollY / max : 0;
      progress.style.transform = "scaleX(" + Math.min(1, Math.max(0, pct)) + ")";
      progressTicking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!progressTicking) {
          progressTicking = true;
          window.requestAnimationFrame(updateProgress);
        }
      },
      { passive: true }
    );
    updateProgress();
  }

  /* ---------- Scroll reveal fallbacks ----------
     Only reached when GSAP is unavailable:
       1. IntersectionObserver → the original one-time fade-in.
       2. Reduced motion / no IO → show everything immediately. */

  var reveals = document.querySelectorAll(".reveal");
  if (!gsapReady && (reduceMotion || !("IntersectionObserver" in window))) {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  } else if (!gsapReady) {
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

  /* ---------- Signup (homepage) ----------
     There is no backend. The form sends nothing, so the submit state says
     nothing was sent. The 48-hour review line is kept as the stated policy,
     framed as what happens once this is live — printing it as a receipt would
     be a fake success, and "peer honesty" is the entire product.
     Native validation runs first (required + type=email), so the honest state
     only ever appears for input that would really have been submittable. */
  var signupForm = document.querySelector("[data-signup]");
  var signupState = document.querySelector("[data-signup-state]");
  if (signupForm && signupState) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!signupForm.checkValidity()) {
        signupForm.reportValidity();
        var firstInvalid = signupForm.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      // Curly apostrophes to match the rest of the site's copy, and a span
      // rather than <em>: the second line is a quieter aside, not emphasis.
      signupState.innerHTML =
        "<strong>Nothing was sent.</strong> This page is a design mockup and the " +
        "form isn&rsquo;t wired up yet, so your details didn&rsquo;t go anywhere." +
        "<span class=\"signup-state-note\">When it&rsquo;s live: we review every " +
        "application by hand, and you&rsquo;ll hear back within 48 hours.</span>";
      signupState.hidden = false;
    });
  }

  /* ---------- Footer year (kept as static © 2026 per copy spec) ---------- */
})();
