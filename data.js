/* NLN — single source of truth for T Level routes & pathways.
   Used by the Apply route→pathway selects (apply.html) and mirrored by the
   static T Levels page (t-levels.html). If you edit this list, update
   t-levels.html to match AND every place that states the pathway total
   (the mono strip and the T Levels header) — grep the codebase for the count.

   NOTE: The names and the total below are a best-effort DRAFT and must be verified
   against the current official IfATE / gov.uk T Level list before launch.
   See NOTES.md → REPLACE BEFORE LAUNCH (first item). */

const ROUTES = [
  {
    route: "Digital",
    pathways: [
      "Digital Support Services",
      "Digital Business Services",
      "Digital Production, Design & Development",
    ],
  },
  {
    route: "Construction",
    pathways: [
      "Design, Surveying & Planning",
      "Onsite Construction",
      "Building Services Engineering",
    ],
  },
  {
    route: "Engineering & Manufacturing",
    pathways: [
      "Design & Development",
      "Maintenance, Installation & Repair",
      "Engineering, Manufacturing & Process Control",
    ],
  },
  {
    route: "Health & Science",
    pathways: ["Health", "Healthcare Science", "Science"],
  },
  {
    route: "Education & Early Years",
    pathways: ["Education & Early Years"],
  },
  {
    route: "Business & Administration",
    pathways: ["Management & Administration"],
  },
  {
    route: "Creative & Design",
    pathways: ["Media, Broadcast & Production", "Craft & Design"],
  },
  {
    route: "Legal, Finance & Accounting",
    pathways: ["Accounting", "Finance"],
  },
  {
    route: "Agriculture, Environmental & Animal Care",
    pathways: ["Agriculture, Land Management & Production"],
  },
  {
    route: "Sales, Marketing & Procurement",
    pathways: ["Marketing"],
  },
];

/* Derived totals — always compute, never hardcode, so copy can't drift.
   ROUTES.length === 10 · PATHWAY_COUNT === 20 (draft; verify before launch). */
const ROUTE_COUNT = ROUTES.length;
const PATHWAY_COUNT = ROUTES.reduce(function (n, r) {
  return n + r.pathways.length;
}, 0);
