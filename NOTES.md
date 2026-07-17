# NLN — build notes

Static visual mockup for a founder presentation. Pure HTML/CSS/vanilla JS, no
build step, no backend. Serve the folder with any static server
(`python3 -m http.server`) or open `index.html`.

Files: `index.html` · `t-levels.html` · `about.html` · `apply.html` ·
`events.html` · `resources.html` · `styles.css` · `app.js` · `data.js` ·
`fonts/` · `NOTES.md`

---

## REPLACE BEFORE LAUNCH

1. **T Level pathway names + total count — VERIFY AGAINST THE OFFICIAL LIST FIRST.**
   `data.js` (ROUTES) is the single source of truth and is a best-effort DRAFT.
   Two areas are known-uncertain: (a) Animal Care & Management and Legal
   Services statuses have changed over time; (b) several pathway names are
   approximations of official titles. **Verify every pathway name and the total
   against the current IfATE / gov.uk T Level list before launch.** The current
   draft totals **20 pathways across 10 routes** — if that changes, update:
   `data.js`, the T Levels page list + header ("all 20…"), and the mono strip
   on t-levels.html ("20 Pathways"). Grep the repo for `20` and `Pathways`.
   Launching with a wrong subject list destroys credibility with the exact
   audience (T Level students) who can check it.

2. **Founder details (about.html + apply framing).**
   - Eliud's **college** — currently `[college — TBC]`.
   - Eliud's **bio** — currently the bracketed placeholder paragraph. Must be
     written in his own words. Cannot ship as placeholder.
   - Founder **photo** — the "PHOTO — TBC" block. Phone-quality is fine; a real
     face beats a stock shot. Never use stock imagery.

3. **Social + contact links.** Footer "Connect" (Instagram / TikTok / Email us)
   all point to `href="#"`. Add the real handles/mailto before launch.

4. **Application queue date.** "Currently reviewing applications from 30 June"
   appears on Apply steps 1 & 2 and in the confirmation. This is a placeholder
   and must be **maintained as a real, current date** — a stale queue date reads
   worse than none.

5. **The two placeholder resource items** on resources.html:
   - "Digital placement at [company name] →" (fill the company name, or remove).
   - "Digital · Employers taking T Level placements →".
   Both link to `href="#"`. Wire to real content or mark clearly. The mono strip
   says "2 Published" — keep it in sync with how many real items exist.

6. **The autumn-2026 events promise.** events.html states the first events will
   land "probably by autumn 2026." This is a public commitment — keep it true or
   update it as plans firm up.

7. **There are no Terms of Service or Privacy Policy pages, and the footer does
   not link to any.** A scaffolded pair was built and then **deliberately
   removed** per founder decision: unreviewed legal text must not exist on the
   site at all, not even as a marked placeholder. That is the honest trade —
   no legal page beats a fake one — but it is a launch blocker, not a
   resolved item. Both pages need writing and checking by someone qualified,
   then the footer needs a Legal column back. Two questions need a real answer
   rather than a careful guess: **age** (the audience is 16-20 and much of it is
   under 18, so consent and whether a parent/guardian must be involved are open)
   and the **lawful basis for collecting a WhatsApp number** via apply.html,
   which is the most sensitive field the site asks for.

---

## FONT STATUS

**Stack Sans, self-hosted — no fallback needed.** The three role tokens in
`:root`:
- `--font-display: "Stack Sans Headline", "Inter", system-ui, sans-serif`
  (Headline 700 — hero H1 and section H2 only)
- `--font-sans: "Stack Sans Text", "Inter", system-ui, sans-serif`
  (Text 400/500/600 — everything else)
- `--font-mono: "IBM Plex Mono", monospace` (400/500 — labels, strips)

woff2 files (latin) live in `fonts/`, copied from the `@fontsource/*` packages,
loaded via `@font-face` with `font-display: swap`. Every CSS `font-family`
usage goes through the three custom properties; the only literal font names are
the required `@font-face` definitions. Inter is listed as a fallback in the
stack but is not required or bundled.

---

## DEVIATIONS

1. **Pathway count is 20 (computed), not the spec's stated 21.** An earlier
   draft of the ROUTES array summed to **22** (it carried "Legal Services" under
   Legal, Finance & Accounting and "Animal Care & Management" under Agriculture).
   A correction spec directed removing **both** of those pathways and expected
   the total to land on **21** — but 22 − 2 = **20**, so "remove both" and "= 21"
   were mutually inconsistent. Per founder decision, both pathways were removed
   and the copy was aligned to the **true computed total of 20** (marquee,
   t-levels mono strip + intro, this file). The count is always computed from
   the data (never hardcoded), so the marquee and Apply flow follow
   automatically. Both the count and the pathway names still require official
   verification (item 1 above) — 20 is the number the data currently yields, not
   a confirmed-correct total.

2. **Hero height = `calc(100svh - nav)`, not a literal `100svh`.** The nav is
   `position: fixed` (per spec). A literal `100svh` hero under a fixed 72/60px
   nav pushes the hero bottom (disclaimer + ▽) off-screen. To honour the
   stronger requirement — "hero fully visible on load" — the hero fills the
   screen *below* the nav. `100vh` fallback declared first, then `100svh`.

3. **Mobile hero H1 is fluid, not a fixed 44px.** ~~`clamp(28px, 7.8vw, 44px)`~~
   → **`clamp(34px, 9.4vw, 44px)`** as of the hero-climb branch. The deviation
   stands but its arithmetic moved: "You're not on your own." is now the *sub*,
   not the H1's second line, so the H1 only has to fit "Doing a T Level?"
   (~292px at 36px) inside the ~327px available at 375. The old 28px floor was
   sized for a phrase this H1 no longer carries, and a 16-character headline at
   28px is the "H1 shrunk to illegibility" the brief bans. Desktop H1 is still
   the spec's 72px.

4. **apply.html contains three `<h1>` elements** (one per view: step 1, step 2,
   confirmation) because the spec explicitly mandates an H1 for each view. The
   views are mutually exclusive (`display:none`), so exactly one h1 is visible
   and exposed to assistive tech at any time — satisfying both the per-view H1
   instruction and the one-visible-h1 principle.

5. **Apply grid uses `minmax(0, …fr)` tracks + `min-width:0` on items.** Plain
   `fr` tracks let a grid item's intrinsic min-content blow the track past its
   container (observed as horizontal overflow of the form inputs at 375px). This
   is the standard grid-blowout guard and does not change the intended layout.

### Homepage redesign — bold/motion pass

6. **Primary button text stays `--on-accent` on hover, not white.** The spec
   asked for white on hover. White on `--accent-hover` (#e64a2a) measures
   **3.9:1** — under the 4.5:1 AA floor for 15px text. The existing near-black
   is **4.7:1** and passes. Hover still reads as a response: the glow stops
   pulsing, settles at full strength and widens.

7. **Key-word highlight is a text tint, not a 0.2 background.** The spec asked
   for an orange background at 0.2 opacity. Over the navy canvas that
   composites to `rgb(77,43,73)` — red and blue land 4 apart, so it desaturates
   to mauve — and an inline background fills the whole font content area, so it
   rendered as a Word-style selection box. Warming the glyphs (`#ffd9cd`) gives
   the same "faint orange tint, just presence" and survives the dark canvas.

8. **No avatar zoom in "Who's behind".** The spec animates a founder avatar
   0.8 → 1. There is no photo on the homepage, and item 2 above keeps the
   founder photo TBC while barring stock imagery. The copy slides in from the
   left on its own. Revisit once a real photo exists.

9. **The staircase stayed a staircase.** The spec proposed making the first
   "What's Inside" card 1.5x width (or a 2x2 offset grid) to break the
   4-column layout. That section is now "How it works" and is already
   asymmetrical — the four cards climb (`margin-top` 132/88/44/0) along a
   stepped connector, which is what the Level 01–04 ascend metaphor rests on.
   Arbitrary width asymmetry would have flattened a meaningful one, so the
   cards keep the climb and take the new motion instead (rotateY + scale
   reveal, 0.1s stagger). `.cols-3` in styles.css is dead CSS from the real
   "What's Inside" section and is left alone here.

10. **Card hover animates the mono "Level 0X", not a Lucide icon.** The spec
    animates card icons; the homepage cards have none, and Lucide is not a
    dependency of this deliberately no-build-step site. The numeral is the
    card's anchor, so it takes the 15deg Y-axis rotate. (The spec's other icon
    note — a 360deg spin — would read as a gimmick on a text numeral.) Same
    reason there is no footer social-icon rotation: those are text links.

11. **Trust pills carry existing copy only, and there are two, not three.**
    They are the old hero button note ("Manually reviewed · Usually within 48
    hours") split in two, so no pill is a new claim needing verification. An
    "Independent student project" pill was cut: it duplicated the hero
    disclaimer sitting ~100px below it in the same viewport.

12. **Bounce easing kept against `impeccable`'s advice.** `impeccable detect`
    flags `cubic-bezier(0.34, 1.56, 0.64, 1)` as dated/tacky and prefers
    ease-out-expo. The curve was explicitly specified, so it stays. Changing it
    means `--ease-bounce` (styles.css) **and** `BOUNCE` (app.js) — they are a
    matched pair.

    The same run reports 3 new `low-contrast` hits on index.html, all
    `… on #ff5a36`. They are false positives: the orange elements added here
    (`.section-rule` ×3, `.ready-rule`, the progress bar) are empty 1–2px
    decorative spans with no text. Baseline main = 46 findings, this branch =
    51 (+3 bounce, +3 false-positive contrast, −1 all-caps).

### Hero climb (`feat/nln-hero-climb`)

13. **Stack Sans stays self-hosted. The spec's GitHub raw `@font-face` URL was
    not implemented.** The spec asked to load Stack Sans from a raw
    githubusercontent URL and to stop if it failed. It was not adopted, because
    it introduces the failure it warns about: `raw.githubusercontent.com` serves
    `content-type: text/plain`, is rate-limited, is explicitly not a supported
    CDN, and gives no cache guarantees — and this site deploys to GitHub Pages,
    where the woff2 files in `fonts/` are already same-origin. It would trade a
    local file for a slower, throttleable cross-origin fetch that can hard-fail
    the page. FONT STATUS above is unchanged and verified rendering (not a
    system substitute) at 1440 and 375.

14. **Headline 800 does not exist, so the mark and H1 are 700.** The spec asked
    for "Stack Sans Headline 700/800". `fonts/` ships headline **500 and 700**
    only, and only 700 is declared. Specifying 800 would make the browser
    synthesise it by smearing the 700, which looks worse than the real 700. The
    unused 500 face is available if a lighter step is ever wanted.

15. **There is no NLN logo, so the climb's destination is the existing
    wordmark.** The spec describes "an N-L-N where the L is an upward arrow" as
    an existing mark. No such asset exists in this repo — there are no image
    assets at all — and `styles.css` states that the orange T *is* the brand
    signature. Per founder decision the climb resolves to the committed
    wordmark, set as a three-line stack so the N/L/N initials column up its left
    edge. **No logo was invented.** If a real N-L-N mark is ever supplied, it
    drops into `.climb-mark` and nothing else changes.

16. **Climb back-tier peak opacity is floored at `.5`.** The spec wants far
    words "dimmer"; white below ~`.47` over the navy drops under 4.5:1, and the
    back tier computes ≥15px at desktop. `.5` measures **4.9:1**. Depth is
    carried instead by all three cues at once — size (`--s` 1 / .8 / .55), speed
    (`--dur` 12.5s / 16s / ~19.5s) and opacity (.95 / .7 / .5). Precedent 6–12:
    the accessible value wins and the deviation is logged. Note the fade *transit*
    necessarily passes below 4.5:1 — inherent to any fade — so the floor is
    enforced at peak, and the reduced-motion resting state (the one actually
    read at rest) uses `--text-secondary`, **9.5:1**.

17. **SplitType, not GSAP SplitText.** SplitText is a Club plugin in the
    **3.12.5** pinned here, and that pin is loaded by **all six pages**, so
    bumping to the free 3.13 line would mean editing five pages this branch is
    not allowed to touch. `split-type@0.3.4` is loaded instead. The H1 keeps an
    `aria-label` of the whole phrase and its char spans are `aria-hidden`, so
    screen readers get a sentence, not sixteen letters. If the CDN fails the H1
    is already real text and simply doesn't cascade.

18. **The 375px climb thins to 5 of 10 routes.** The ten desktop lanes total
    ~2100px of text; no re-laning fits that into 375px without same-tier words
    smearing through each other. Per the spec's "fewer words in flight" the
    climb drops to five (`.climb-thin`), keeping all three depth tiers and the
    largest routes by cohort. **All ten return under `prefers-reduced-motion`**,
    where nothing is moving and there is nothing to thin. The climb is
    atmosphere and never claims to be the list; t-levels.html is canonical.

19. **The homepage signup form was built, then removed. `apply.html` is the
    single canonical apply page.** The spec asked for an inline signup section;
    it shipped, and was then cut per founder decision because it was a second
    front door collecting *different* fields from apply.html (which asks route →
    pathway). Every CTA on the homepage — hero, nav, "Ready?" — now points at
    `apply.html`. The honesty problem the inline form raised is gone with it:
    there is no longer a form that could imply an application was received when
    nothing was sent. apply.html's own confirmation view remains a mockup (see
    KNOWN LIMITATIONS).

    Links stay **relative** (`apply.html`, not `/apply.html`). This deploys to
    GitHub Pages as a *project* page at `3yther.github.io/nln-site/` with no
    custom domain, so a root-absolute `/apply.html` resolves to
    `3yther.github.io/apply.html` and 404s. Every link on the site is relative
    for this reason.

20. **The founder's name and role are NOT placeholders.** The spec said to mark
    name/role/bio as placeholders. about.html already ships "Eliud Awuah /
    Founder / T Level Digital · Year 12" and index.html already named him, so
    bracketing them would regress a real, live detail into a fake one. The
    homepage About carries the real name and role and keeps the **bio, college
    and photo** marked exactly as about.html marks them. Nothing was invented.

21. **`color-scheme: dark` added to `:root` — affects all pages.** The site is
    dark-only. Without this, UA-rendered chrome the CSS cannot reach (the
    `<select>` dropdown popup, scrollbars, control internals) keeps painting
    from the light system palette. Surfaced by the homepage signup's `<select>`,
    and kept after that form was removed because **apply.html's route/pathway
    selects have the same problem** and always did. One line, strictly an
    improvement, but it *does* change how the other five pages render native
    controls, so it is logged rather than slipped in.

22. **The routes marquee was removed from the homepage.** It rendered the same
    ten route names the climb now carries, on the same page, as a horizontally
    scrolling track — directly undermining the one thing the climb must not read
    as. It is also absent from the spec's page structure. Its JS is gone from
    app.js; `data.js` (and `ROUTE_COUNT` / `PATHWAY_COUNT`) are untouched and
    still drive t-levels.html and apply.html. **Cost:** the homepage no longer
    states "10 routes · 20 pathways" anywhere.

23. **The hero was cut to climb + H1 + sub + CTA ("nothing else").** Removed:
    the mono meta-strip, the "Level 01 — You are here" tag, the phrase cycler,
    the ascending `.hero-line` SVG (its blue→purple→magenta gradient also
    brushed the branch's gradient ban), the ▽ scroll indicator, and the hero
    trust pills. The pills and the independence disclaimer were **promoted, not
    deleted** — both now carry existing copy verbatim in the new TRUST section.
    **Worth a second look:** "Independent · Not affiliated with the DfE or IfATE"
    was the strongest anti-fake signal on the page and it is now below the fold,
    for an audience whose scepticism peaks in the hero. Done per spec; flag it
    if that trade is wrong.

24. **The climb route names are static markup, duplicating `data.js`.** They
    have to be in the DOM for no-JS and reduced-motion to hold the finished
    state, and the motion is pure CSS so it owes the CDN nothing. That costs a
    second copy of the route list, so `app.js` compares the DOM against `ROUTES`
    and `console.warn`s on drift. REPLACE-BEFORE-LAUNCH 1 now matters more: the
    climb is the largest text on the site and the list is still an unverified
    draft.

25. **The only change to the other five pages is the footer contact
    placeholder.** `Email us` (which pointed at `#`) → `[hello@ · TBC]`, so a
    dead link reads as the placeholder it always was (REPLACE BEFORE LAUNCH 3).
    A fourth "Legal" column was added here and then removed again along with the
    legal pages, so `.footer-grid` is back to its original `1fr 2fr 1fr`. If the
    legal pages are ever written, the grid needs a fourth track — three declared
    tracks silently wrap a fourth child onto a second row.

26. **`impeccable detect` baseline: main = 4, this branch = 4.** Same three
    `bounce-easing` hits (deviation 12 — the curve was explicitly specified) and
    the same `numbered-section-markers` hit (deviation 9/10 — the Level 01–04
    numerals encode the ascend metaphor, in the one section this branch is told
    to leave alone). One new **false positive**: the marker sequence now reads
    "01, 02, 03, 04, **12**"; the 12 is scraped from the climb's `--dur:12.5s`
    inline value, not a section label. No new anti-patterns.

---

## KNOWN LIMITATIONS (mockup only)

- **No form submission.** The Apply flow validates (native HTML5 + a confirmation
  view) but sends nothing anywhere. State is in-memory only (no localStorage /
  sessionStorage) — a full page refresh resets the flow. Wiring a real endpoint
  + WhatsApp invite is the main missing backend.
- **Social/contact and resource links are `#` placeholders** (see REPLACE list).
- **Reveal-on-scroll** uses IntersectionObserver and fires once per section on
  gradual scroll. An instant jump to the very bottom can skip intermediate
  sections' reveal until they're scrolled back into view; normal scrolling shows
  all. `prefers-reduced-motion` disables all motion and shows everything.
- **Copy** (member counts, "reviewed within 48 hours", queue date, stats) is
  design-review placeholder unless verified — see REPLACE BEFORE LAUNCH.
