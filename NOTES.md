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

3. **Mobile hero H1 is fluid `clamp(28px, 7.8vw, 44px)`, not a fixed 44px.**
   At 44px the longer line ("You're not on your own.") is ~456px wide and cannot
   fit two clean lines at 375px (~327px available) — it would wrap to four lines,
   the exact regression the spec flags. The clamp keeps two clean lines from
   375px up while reaching 44px by the 768 breakpoint. Desktop H1 is the spec's
   72px.

4. **apply.html contains three `<h1>` elements** (one per view: step 1, step 2,
   confirmation) because the spec explicitly mandates an H1 for each view. The
   views are mutually exclusive (`display:none`), so exactly one h1 is visible
   and exposed to assistive tech at any time — satisfying both the per-view H1
   instruction and the one-visible-h1 principle.

5. **Apply grid uses `minmax(0, …fr)` tracks + `min-width:0` on items.** Plain
   `fr` tracks let a grid item's intrinsic min-content blow the track past its
   container (observed as horizontal overflow of the form inputs at 375px). This
   is the standard grid-blowout guard and does not change the intended layout.

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
