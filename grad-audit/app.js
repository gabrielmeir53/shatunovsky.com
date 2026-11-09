/**
 * app.js: the page. Wires the two inputs (a LionPATH PDF via parser.js, or the course picker via
 * manual.js) to engine.js and renders the result.
 *
 * This is the ONLY file that touches the DOM. It:
 *   - reads the chosen PDF with File.arrayBuffer() (local; nothing is uploaded),
 *   - loads pdf.js from ./vendor only when a PDF is chosen, and points its worker at ./vendor,
 *   - keeps the course picker's rows in a plain array in memory (`picker`) and rebuilds the table
 *     from it; manual.js turns the rows into Course records,
 *   - renders results with textContent only. Transcript text and typed text are never inserted as
 *     HTML, so a crafted PDF cannot inject markup or script (and the CSP in index.html forbids
 *     inline script anyway).
 * It stores nothing: no localStorage, cookies or IndexedDB. Reloading the page clears everything.
 */
// "?v=N": the demo host (Cloudflare) caches .js files for 4 hours. A changed module gets a new
// query string here so visitors load the new version at once. Not needed on a host without that
// cache. Modules that import each other (engine.js → match.js) are unversioned inside; bump the
// importer here when a dependency changes. See IT-HANDOFF.md §3 "Caching".
import * as rules from "./rules.js?v=4";
import catalog from "./data/catalog.js";
import legacy from "./data/legacy-catalog.js";
import lists from "./data/intranet-lists.js?v=3";
import concentrations from "./data/concentrations.js";
import chart from "./data/course-chart.js";
import offeringsSpring2027 from "./data/offerings-spring-2027.js?v=2";
import { parsePdfPages, parseAnyText, extractPdfPages } from "./parser.js?v=3";
import { runAudit, describeCatalog, statusWord } from "./engine.js?v=5";
import { sampleTranscriptLines, sampleReportPages, SAMPLE_TERMS } from "./sample.js?v=3";
import { gradeChoices, termList, firstYearPicks, pickableCourses, topicSuggestions, buildManualCourses } from "./manual.js?v=2";

// offerings: one verified LionPATH section list per term; add the next term's file here.
const DATA = { rules, catalog, legacy, lists, concentrations, chart, offerings: [offeringsSpring2027] };

// ---------------------------------------------------------------------------------------------
// Tiny DOM helper. Children that are strings become TEXT nodes, never HTML.
// h("td", { class: "num" }, "3")  →  <td class="num">3</td>
// ---------------------------------------------------------------------------------------------
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
const $ = (id) => document.getElementById(id);

const PILL = {
  met: ["is-met", "Met"],
  projected: ["is-projected", "On track"],
  open: ["is-open", "Open"],
  confirm: ["is-info", "Confirm"],
};
/**
 * Status pill. `via` ("UP"/"DL") adds which 303(c) list the course came from: "Met – UP" (A13).
 * `selfReported` adds "(self-reported)" when the status rests on a P grade from the picker (A12).
 */
const pill = (status, via = null, selfReported = false) =>
  h("span", { class: `ga-pill ${PILL[status][0]}${selfReported ? " is-self" : ""}` },
    PILL[status][1] + (via ? ` – ${via}` : "") + (selfReported ? " (self-reported)" : ""));
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
/** Grade as shown in tables: the self-reported "P" is spelled out so nobody mistakes it for a Pass grade. */
const gradeText = (g) => (g === rules.SELF_REPORTED_GRADE ? "C or better (self-reported)" : g);
/** Does a requirement's status rest on at least one self-reported grade? */
const restsOnSelfReport = (q) => q.courses.some((c) => c.grade === rules.SELF_REPORTED_GRADE);

// ---------------------------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------------------------
let lastCourses = null; // kept in memory only so the Professional Development checkbox can re-run

function setStatus(msg, isError = false) {
  const s = $("status");
  s.textContent = msg;
  s.classList.toggle("is-error", isError);
}

async function handleFile(file) {
  if (!file) return;
  if (file.type && file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
    setStatus("That isn't a PDF. Save the LionPATH advising transcript or requirements report as a PDF and try again.", true);
    return;
  }
  setStatus("Reading the PDF on this device…");
  let pages;
  try {
    const pdfjs = await import("./vendor/pdf.min.js");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdf.worker.min.js", import.meta.url).href;
    pages = await extractPdfPages(pdfjs, new Uint8Array(await file.arrayBuffer()));
  } catch (err) {
    console.error(err);
    setStatus("The PDF couldn't be read. Try the \"paste the text\" option below.", true);
    return;
  }
  audit(parsePdfPages(pages), "your PDF");
}

const FORMAT_NAMES = { advisingTranscript: "read as a LionPATH advising transcript", requirementsReport: "read as a LionPATH requirements report", manual: "entered by hand" };

/** Render an audit for parser/manual output, or show the warnings if no courses were found. */
function audit(parsed, label) {
  if (!parsed.courses.length) {
    setStatus(parsed.warnings.join(" "), true);
    $("results").hidden = true;
    return;
  }
  lastCourses = parsed;
  render(parsed);
  const kind = FORMAT_NAMES[parsed.format] ? ` (${FORMAT_NAMES[parsed.format]})` : "";
  setStatus(`Audited ${label}${kind}: ${parsed.courses.length} courses in ${parsed.terms.length} terms.${parsed.warnings.length ? " Some rows were skipped; see the warnings in the course table." : ""}`);
  $("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function render(parsed) {
  const result = runAudit(parsed.courses, DATA, { asOf: new Date(), profDevConfirmed: $("profdev").checked, includeApplicationOnly: plannerOpts.includeApplicationOnly });
  const root = $("results");
  root.replaceChildren(
    renderBanner(result, parsed.format),
    renderRequirements(result),
    renderAuditErrors(result),
    renderResidency(result),
    renderConcentrations(result),
    renderPlanner(result),
    renderCourses(result, parsed.warnings, parsed.format),
  );
  root.hidden = false;
}

// ---------------------------------------------------------------------------------------------
// Results sections
// ---------------------------------------------------------------------------------------------
function section(title, ...body) {
  return h("section", { class: "ga-section ga-results-section" }, h("h2", {}, title), ...body);
}

function renderBanner(r, format) {
  const { state, blockers, pending, lastTerm } = r.overall;
  const term = lastTerm ?? "your final term";
  const confirms = r.requirements.filter((q) => q.status === "confirm").map((q) => q.requirement.label);
  const confirmNote = confirms.length ? h("p", {}, "Still to confirm (not counted either way): ", confirms.join("; "), ".") : null;
  const selfCount = r.requirements.filter(restsOnSelfReport).length;
  const selfReported = format === "manual"
    ? h("p", { class: "ga-warn" }, `This record was entered by hand${selfCount ? `, and ${selfCount} requirement${selfCount === 1 ? "" : "s"} rest on grades you reported without the letter grade` : ""}. Check it against your LionPATH transcript before relying on it.`)
    : null;
  const verify = h("p", { class: "ga-muted small" }, "Unofficial. Only the Registrar's Office certifies graduation; confirm anything you rely on with registrar@pennstatelaw.psu.edu.");
  if (state === "complete") {
    return h("div", { class: "ga-banner is-met" }, h("h2", {}, "All requirements met"),
      h("p", {}, "Every requirement this page can check is satisfied by completed courses."), confirmNote, selfReported, verify);
  }
  if (state === "onTrack") {
    return h("div", { class: "ga-banner is-projected" },
      h("h2", {}, `On track to graduate after ${term}`),
      h("p", {}, "Every requirement is met or will be met if your current and enrolled courses finish with a C or better. Still depending on those courses:"),
      h("ul", {}, pending.map((p) => h("li", {}, p))),
      confirmNote, selfReported, verify);
  }
  return h("div", { class: "ga-banner is-open" },
    h("h2", {}, `Not yet on track: ${blockers.length} item${blockers.length === 1 ? "" : "s"} open`),
    h("p", {}, "Even counting current and enrolled courses, these are not satisfied:"),
    h("ul", {}, blockers.map((b) => h("li", {}, b))),
    h("p", {}, "See the remaining-semester options below."), confirmNote, selfReported, verify);
}

function renderRequirements(r) {
  const rows = r.requirements.map((q) =>
    h("tr", {},
      h("td", {}, q.requirement.label),
      h("td", {}, pill(q.status, q.via, restsOnSelfReport(q))),
      h("td", { class: "small" }, q.detail, q.verify.length ? h("div", { class: "ga-warn" }, "Verify: ", q.verify.join("; ")) : null),
      h("td", { class: "small" }, q.requirement.lionpath
        ? h("span", { class: "ga-warn" }, q.courses.length ? "LionPATH can't count this (see below)" : "LionPATH line is miscoded")
        : q.requirement.source === "flowchart"
          ? h("span", { class: "ga-muted" }, "Not an audit line (flowchart rule)")
          : h("span", { class: "ga-muted" }, "Counts correctly"))));
  const up = lists.aba303c.universityPark;
  const gpaText = r.gpa.gpa == null
    ? (r.gpa.selfReported ? "GPA not computed: some grades were self-reported without the letter." : "GPA not computed: no letter grades yet.")
    : `Reconstructed GPA ${r.gpa.gpa.toFixed(2)} from ${fmt(r.gpa.units)} letter-graded credits (A14; the official figure is on your transcript).`;
  return section("Graduation requirements",
    h("div", { class: "ga-table-wrap" }, h("table", { class: "ga-table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Requirement"), h("th", {}, "Status"), h("th", {}, "How it's met"), h("th", {}, "LionPATH audit"))),
      h("tbody", {}, rows))),
    h("dl", { class: "ga-key" },
      h("div", {}, h("dt", {}, "Met – UP:"), h("dd", {}, "the course is on the Intranet's ", h("a", { href: up.source, rel: "noopener" }, "ABA 303(c) Course Requirement – University Park"), ` page, written for students admitted to Penn State Law, University Park, Fall 2023 and later, prior to reunification (last updated ${fmtDate(up.lastUpdated)}).`)),
      h("div", {}, h("dt", {}, "Met – DL:"), h("dd", {}, "the course is only on the unified ", h("a", { href: lists.aba303c.source, rel: "noopener" }, "ABA Standard 303(c) – Civil Rights, Equal Protection and Social Justice Courses"), ` page for all Dickinson Law students (last updated ${fmtDate(lists.aba303c.lastUpdated)}). Every UP-list course is also on it. Ask the registrar which list governs your cohort before relying on a DL-only course (A13).`)),
      h("div", {}, h("dt", {}, "(self-reported):"), h("dd", {}, "the status rests on a grade you entered as \"C or better\" without the letter grade. It is taken at your word (A12); check it against your transcript."))),
    h("p", { class: "ga-note" },
      `Credits: ${fmt(r.totals.earned)} earned, ${fmt(r.totals.inProgress)} in progress, ${fmt(r.totals.enrolled)} enrolled for a future term = ${fmt(r.totals.projected)} projected. "On track" assumes a C or better in every unfinished course. ${gpaText}`));
}

/**
 * Reference only: which LionPATH audit lines disagree with this audit, and why. Nothing is sent
 * anywhere; the corresponding fix for each line is in rules.js (lionpath.fix) and IT-HANDOFF.md.
 */
function renderAuditErrors(r) {
  if (!r.auditErrors.length) {
    return section("Where LionPATH's audit differs", h("p", {}, "Nowhere: no course on this record is affected by the miscoded LionPATH lines."));
  }
  return section(`Where LionPATH's audit differs (${r.auditErrors.length})`,
    h("p", {}, "LionPATH's degree audit for this cohort only recognizes pre-merger course codes, so it shows these requirements as not satisfied. Under the written rules, each one is satisfied (or on track) by the courses below. This is for reference; nothing here changes LionPATH."),
    h("ul", { class: "ga-errors" }, r.auditErrors.map((e) =>
      h("li", {},
        h("h3", {}, e.requirement),
        h("dl", {},
          h("dt", {}, "Your courses"), h("dd", {}, e.satisfiedBy.join("; ")),
          h("dt", {}, "LionPATH accepts"), h("dd", {}, e.lionpathAccepts),
          h("dt", {}, "Why it misses them"), h("dd", {}, e.problem))))),
    h("div", { class: "ga-actions ga-no-print" },
      h("button", { type: "button", class: "ga-btn ga-btn-secondary", onclick: () => window.print() }, "Print this audit")));
}

function renderResidency(r) {
  const req = rules.REQUIREMENTS.find((q) => q.kind === "residency");
  const capRows = r.caps.filter((c) => c.checkable && c.total > 0);
  return section("Credits by semester",
    h("div", { class: "ga-table-wrap" }, h("table", { class: "ga-table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Term"), h("th", { class: "num" }, "Credits"), h("th", {}, "Full-time (12–17)"))),
      h("tbody", {}, r.residency.terms.map((t) => h("tr", {},
        h("td", {}, t.term, t.projected ? h("span", { class: "ga-muted" }, " (not final)") : null),
        h("td", { class: "num" }, fmt(t.credits)),
        h("td", {}, t.overMax ? h("span", { class: "ga-warn" }, `Over ${req.maxCredits}`) : t.fullTime ? "Yes" : h("span", { class: "ga-warn" }, "No"))))))),
    capRows.length
      ? h("p", { class: "ga-note" }, "Credit caps: ", capRows.map((c) => `${c.label} ${fmt(c.total)} of ${c.max} max`).join(" · "))
      : null,
    h("p", { class: "ga-muted small" }, "Summer terms never count toward the six full-time semesters. Full tuition and the 20-hours-per-week work limit can't be checked from a transcript."));
}

function renderConcentrations(r) {
  const BAND = { complete: ["is-met", "Complete"], projected: ["is-projected", "On track"], close: ["is-info", "Close"], far: ["", "Far"] };
  const shown = r.concentrations.filter((c) => c.matched.length);
  return section("Concentrations",
    h("p", {}, `12 credits from a concentration's list, each with a C or better. Spring graduates apply by ${fmtDate(concentrations.deadlines.spring2027)}; fall graduates by ${fmtDate(concentrations.deadlines.fall2026)}. Courses not on a list need Associate Dean approval before the application.`),
    h("p", { class: "ga-note" }, "The rules don't say whether one course can count toward more than one concentration. This table counts it toward every list it appears on (A1); ask the registrar before relying on overlap."),
    h("div", { class: "ga-table-wrap" }, h("table", { class: "ga-table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Concentration"), h("th", {}, "Status"), h("th", { class: "num" }, "Done"), h("th", { class: "num" }, "With current"), h("th", {}, "Your courses on its list"))),
      h("tbody", {}, shown.map((c) => h("tr", {},
        h("td", {}, c.name),
        h("td", {}, h("span", { class: `ga-pill ${BAND[c.band][0]}` }, BAND[c.band][1])),
        h("td", { class: "num" }, fmt(c.done)),
        h("td", { class: "num" }, fmt(c.total)),
        h("td", { class: "small" }, c.matched.map((m, i) => [
          i ? "; " : "",
          `${m.course.code} ${m.course.title} (${fmt(m.course.credits)}${m.course.grade ? `, ${m.course.grade}` : ", " + statusWord(m.course.status)})`,
          !m.counts ? h("span", { class: "ga-warn" }, " below C, not counted") : null,
          m.verify ? h("span", { class: "ga-warn" }, " CR: verify") : null,
        ]))))))),
    h("p", { class: "ga-muted small" }, `${r.concentrations.length - shown.length} other concentrations have none of your courses yet. Externships, moot court and other "additional opportunities" can count only with Associate Dean approval and are not counted here.`));
}

/** Planner options the student can change on the page (re-runs the audit). */
const plannerOpts = { includeApplicationOnly: false };

function renderPlanner(r) {
  const p = r.planner;
  if (!p.terms.length) return section("Remaining semesters", h("p", {}, "No semester after the current one is on the course chart or in a verified section list."));
  const title = `Options for ${p.terms.join(", ")}`;

  // Verified section list (data/offerings-*.js): real LionPATH codes, sections, credits, times.
  if (p.source === "lionpath") {
    const ao = p.applicationOnly ?? {};
    const closed = ao.treatClosedFrom && new Date() >= new Date(ao.treatClosedFrom + "T00:00:00");
    const toggle = h("label", { class: "ga-check" },
      h("input", { type: "checkbox", id: "include-apps", checked: plannerOpts.includeApplicationOnly ? true : null,
        onchange: (ev) => { plannerOpts.includeApplicationOnly = ev.target.checked; if (lastCourses) render(lastCourses); } }),
      closed
        ? `Also show clinics, externships and independent study (${p.hiddenApplicationOnly} hidden). These are application-only placements, and enrollment for ${p.terms[0]} opened on ${fmtDate(ao.treatClosedFrom)}, so their application window is treated as closed. Ask the clinic director whether a seat is still open.`
        : "Show clinics, externships and independent study (application-only placements).");
    const seats = (s) => s.status ? `${s.status}${s.seats ? ` · ${s.seats.available} of ${s.seats.capacity} open` : ""}` : "see LionPATH";
    const row = (s) => h("tr", {},
      h("td", { class: "code" }, `${s.code}-${s.section}`, h("div", { class: "ga-muted small" }, s.classNbr ? `#${s.classNbr}` : "class # pending")),
      h("td", {}, s.name,
        s.application ? h("span", { class: "ga-tag" }, "application") : null,
        s.note ? h("div", { class: "ga-muted small" }, s.note) : null),
      h("td", { class: "num" }, s.credits === "?" ? h("span", { class: "ga-warn small" }, `check LionPATH (${s.creditsSource})`) : s.credits),
      h("td", { class: "small" }, s.meets ?? "see LionPATH", h("div", { class: "ga-muted" }, s.mode)),
      h("td", { class: "small" }, seats(s)),
      h("td", { class: "small" }, s.reasons.join("; ")));
    const head = h("thead", {}, h("tr", {}, h("th", {}, "Class"), h("th", {}, "Course"), h("th", { class: "num" }, "Credits"), h("th", {}, "Meets"), h("th", {}, "Status"), h("th", {}, "Would count toward")));
    const top = p.suggestions.slice(0, 15);
    const rest = p.suggestions.slice(15);
    return section(title,
      h("p", {}, `${p.terms[0]} sections at University Park as LionPATH listed them on ${fmtDate(p.readOn)}, with their class codes and section numbers. Only sections that would close an open requirement or move a concentration within 6 credits of complete are listed, most useful first. Seats change hourly: LionPATH is the live source.`),
      toggle,
      p.suggestions.length
        ? h("div", { class: "ga-table-wrap" }, h("table", { class: "ga-table" }, head, h("tbody", {}, top.map(row))))
        : h("p", { class: "ga-note" }, "Nothing offered this term would close an open requirement or a concentration within 6 credits."),
      rest.length ? h("details", {}, h("summary", {}, `Show ${rest.length} more`),
        h("div", { class: "ga-table-wrap" }, h("table", { class: "ga-table" }, head.cloneNode(true), h("tbody", {}, rest.map(row))))) : null,
      h("p", { class: "ga-muted small" },
        `Status and seats were read only for Special Topics (997) sections. "Point-to-point from Carlisle" means in-person attendance in the assigned University Park classroom. Last day to add: ${fmtDate(p.dates.lastDayToAdd)}. Watch the 17-credit maximum.`));
  }

  // Course chart fallback (names only).
  if (!p.suggestions.length) return section(title, h("p", {}, "Nothing on the course chart would close an open requirement or a concentration within 6 credits."));
  const row = (s) => h("tr", {},
    h("td", { class: "code" }, s.code ?? s.prefix),
    h("td", {}, s.name, s.temporary ? h("span", { class: "ga-muted" }, " *") : null, s.clinic ? h("span", { class: "ga-tag" }, "application") : null),
    h("td", { class: "num" }, s.credits === "?" ? h("span", { class: "ga-muted" }, "check LionPATH") : s.credits),
    h("td", { class: "small" }, s.reasons.join("; ")));
  const head = h("thead", {}, h("tr", {}, h("th", {}, "Code"), h("th", {}, "Course"), h("th", { class: "num" }, "Credits"), h("th", {}, "Would count toward")));
  const top = p.suggestions.slice(0, 12);
  const rest = p.suggestions.slice(12);
  return section(title,
    h("p", {}, "Courses the course chart lists for the coming semester that would close an open requirement or move a concentration that's within 6 credits of complete. Courses on the most lists come first. No verified LionPATH section list exists for this term yet."),
    h("div", { class: "ga-table-wrap" }, h("table", { class: "ga-table" }, head, h("tbody", {}, top.map(row)))),
    rest.length ? h("details", {}, h("summary", {}, `Show ${rest.length} more`),
      h("div", { class: "ga-table-wrap" }, h("table", { class: "ga-table" }, head.cloneNode(true), h("tbody", {}, rest.map(row))))) : null,
    h("p", { class: "ga-muted small" }, "* not a permanent part of the curriculum. Clinics require an application. Offerings are anticipated and subject to change; adjunct-taught courses aren't on the chart. Watch the 17-credit semester maximum."));
}

function renderCourses(r, warnings, format) {
  const usedFor = new Map();
  for (const q of r.requirements) for (const c of q.courses) {
    if (["oneCourse", "credits"].includes(q.requirement.kind)) usedFor.set(c, [...(usedFor.get(c) ?? []), q.requirement.label.replace(/ \(C or better\)$/, "")]);
  }
  const manual = format === "manual";
  return section(manual ? "Your courses as entered" : "Your courses as read from the transcript",
    warnings.length ? h("div", { class: "ga-note ga-warn" }, h("strong", {}, manual ? "Skipped rows: " : "Reading warnings: "), warnings.join(" ")) : null,
    h("div", { class: "ga-table-wrap is-tall" }, h("table", { class: "ga-table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Term"), h("th", {}, "Code"), h("th", {}, "Course (official title)"), h("th", { class: "num" }, "Credits"), h("th", {}, "Grade"), h("th", {}, "Used for"))),
      h("tbody", {}, r.courses.map((c) => h("tr", {},
        h("td", { class: "small" }, c.term),
        h("td", { class: "code" }, c.code),
        h("td", {}, c.title, c.title !== c.description && !manual ? h("div", { class: "ga-muted small" }, `Transcript: ${c.description}`) : null,
          c.legacy ? h("div", { class: "ga-muted small" }, "Pre-reunification Penn State Law code; title from the 2024-25 Bulletin archive") : null,
          !c.inCatalog ? h("div", { class: "ga-muted small" }, "Not in the current Bulletin or the 2024-25 Penn State Law archive; title as printed") : null),
        h("td", { class: "num" }, fmt(c.status === "done" || c.status === "withdrawn" ? c.earned : c.attempted)),
        h("td", {}, c.grade ? gradeText(c.grade) : h("span", { class: "ga-muted" }, statusWord(c.status))),
        h("td", { class: "small" }, (usedFor.get(c) ?? []).join(", "))))))));
}

function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------------------------
// Static reference sections (course crosswalk, sources, assumptions)
// ---------------------------------------------------------------------------------------------
function renderCatalog() {
  const rows = describeCatalog(DATA);
  $("catalog-count").textContent = String(rows.length);
  const table = $("catalog-table");
  const body = h("tbody", {}, rows.map((c) => {
    const tr = h("tr", {},
      h("td", { class: "code" }, c.code),
      h("td", {}, c.title, c.specialTopics ? h("div", { class: "ga-muted small" }, "Topic varies; matched by the topic on the transcript") : null),
      h("td", { class: "num" }, c.credits),
      h("td", {}, c.requirements.map((t) => h("span", { class: "ga-tag is-req" }, t))),
      h("td", { class: "small" }, c.concentrations.join("; ")),
      h("td", { class: "small" }, c.offered.map((t) => t.replace("Spring ", "Sp ").replace("Fall ", "Fa ")).join(", ")));
    tr.dataset.search = [c.code, c.title, ...c.requirements, ...c.concentrations].join(" ").toLowerCase();
    return tr;
  }));
  table.replaceChildren(
    h("thead", {}, h("tr", {}, h("th", {}, "Code"), h("th", {}, "Title"), h("th", { class: "num" }, "Credits"), h("th", {}, "Requirements"), h("th", {}, "Concentrations"), h("th", {}, "Offered"))),
    body);
  table.parentElement.classList.add("is-tall");
  $("course-filter").addEventListener("input", (ev) => {
    const q = ev.target.value.trim().toLowerCase();
    for (const tr of body.rows) tr.hidden = Boolean(q) && !tr.dataset.search.includes(q);
  });
}

function renderHow() {
  // Every source as a link (Intranet links need a Penn State login), with what was checked and when.
  $("sources").replaceChildren(...Object.values(rules.SOURCES).map((s) =>
    h("li", {},
      h("a", { href: s.url, rel: "noopener" }, s.label),
      s.url2 ? [" (", h("a", { href: s.url2, rel: "noopener" }, "Intranet PDF"), ")"] : null,
      s.url.includes("sharepoint.com") || s.url2 ? h("span", { class: "ga-muted small" }, " · Penn State login") : null,
      h("div", { class: "ga-muted small" }, s.note))),
    h("li", {}, `Course catalog snapshot: ${catalog.snapshot}`));
  $("assumptions").replaceChildren(...rules.ASSUMPTIONS.map((a) =>
    h("li", {}, h("strong", {}, `${a.id}. `), a.text, " ", h("span", { class: "where" }, `(${a.where})`))));
}

// ---------------------------------------------------------------------------------------------
// Course picker (the "Pick your courses" tab): a term-by-term checklist, 1L Fall through the final
// Spring, in the order the courses were taken. Each term lists its courses and has its own "add a
// course" search box. State lives in `picker`; the table is rebuilt from it after every change.
// manual.js converts it to Course records when the student runs the audit.
// ---------------------------------------------------------------------------------------------
const picker = {
  startYear: 2024,
  firstYearDone: true, // adds the ten PSLFY courses (rules.FIRST_YEAR_COURSES) to the two 1L terms
  firstYearGrades: {}, // code → letter grade, entered inline on the 1L rows (optional; GPA checks only)
  picks: [], // upper-level rows: { id, code, title, term, credits, grade, topic, specialTopics }
  focusTerm: null, // which term's search box to focus after a re-render
};
const PICKABLE = pickableCourses(DATA);
const GRADES = gradeChoices(rules);
let pickId = 0;

/** All picks in transcript order: the 1L block (if checked) followed by the upper-level rows. */
function allPicks() {
  const fy = picker.firstYearDone ? firstYearPicks(picker.startYear, rules, picker.firstYearGrades) : [];
  return [...fy, ...picker.picks];
}

/** "1L", "2L", "3L" for fall/spring terms; "Summer after 1L" for summers. */
function yearLabel(term) {
  const [season, year] = term.split(" ");
  const y = Number(year) - picker.startYear - (season === "Fall" ? 0 : 1);
  return season === "Summer" ? `Summer after ${y + 1}L` : `${y + 1}L`;
}

function addPick(course, term, overrides = {}) {
  picker.picks.push({
    id: ++pickId,
    code: course.code,
    title: course.title,
    term,
    credits: course.defaultCredits ?? course.credits ?? 3,
    variableCredits: Boolean(course.variableCredits),
    grade: rules.SELF_REPORTED_GRADE,
    topic: null,
    specialTopics: Boolean(course.specialTopics),
    ...overrides,
  });
  picker.focusTerm = term;
  renderPicks();
}

function select(options, value, onchange, attrs = {}) {
  return h("select", { ...attrs, onchange: (ev) => onchange(ev.target.value) },
    options.map((o) => h("option", { value: o.value, selected: o.value === value ? true : null }, o.label)));
}

/** Search box for one term: matching catalog courses appear underneath; clicking one adds it to that term. */
function addRow(term) {
  const results = h("ul", { class: "ga-results", "aria-label": `Matching courses for ${term}` });
  const input = h("input", {
    type: "search", class: "ga-add-input", autocomplete: "off",
    placeholder: `Add a course to ${term}: type a code or title`,
    "aria-label": `Add a course to ${term}`,
    oninput: (ev) => {
      const q = ev.target.value.trim().toLowerCase();
      if (!q) { results.replaceChildren(); return; }
      const hits = PICKABLE.filter((c) => c.search.includes(q)).slice(0, 25);
      const items = hits.map((c) => h("li", {},
        h("button", { type: "button", onclick: () => addPick(c, term) },
          h("span", { class: "code" }, c.code), h("span", {}, c.title, c.specialTopics ? " (topic varies)" : "", c.legacy ? " (pre-2025 code)" : ""), h("span", { class: "credits" }, `${c.credits} cr`))));
      if (!items.length) items.push(h("li", {}, h("span", { class: "ga-muted small" }, "No match. Use \"Course not in the catalog\" below to add it by code.")));
      results.replaceChildren(...items); // replaceChildren() would print a bare null as text, so never pass one
    },
  });
  if (picker.focusTerm === term) queueMicrotask(() => input.focus());
  return h("tr", { class: "ga-add-row" }, h("td", { colspan: 6 }, input, results));
}

function renderPicks() {
  const table = $("picks-table");
  const terms = termList(picker.startYear);
  const termOptions = terms.map((t) => ({ value: t, label: t }));
  const fy = picker.firstYearDone ? firstYearPicks(picker.startYear, rules, picker.firstYearGrades) : [];
  const fyGradeChoices = GRADES.filter((g) => g.value !== "" && g.value !== "W");
  const body = [];
  let total = 0;
  for (const term of terms) {
    const fyRows = fy.filter((p) => p.term === term);
    const rows = picker.picks.filter((p) => p.term === term);
    const credits = [...fyRows, ...rows].reduce((n, p) => n + (Number(p.credits) || 0), 0);
    total += credits;
    body.push(h("tr", { class: `ga-term-row${term.startsWith("Summer") ? " is-summer" : ""}` },
      h("th", { colspan: 5 }, `${yearLabel(term)} · ${term}`),
      h("th", { class: "num" }, credits ? `${fmt(credits)} cr` : "")));
    for (const p of fyRows) {
      body.push(h("tr", { class: "is-first-year" },
        h("td", { class: "code" }, p.code),
        h("td", {}, p.title, h("div", { class: "ga-muted small" }, "first-year required")),
        h("td", { class: "small" }, p.term),
        h("td", { class: "num" }, fmt(p.credits)),
        h("td", {}, select(fyGradeChoices, picker.firstYearGrades[p.code] ?? rules.SELF_REPORTED_GRADE, (v) => {
          if (v === rules.SELF_REPORTED_GRADE) delete picker.firstYearGrades[p.code]; else picker.firstYearGrades[p.code] = v;
        }, { "aria-label": `Grade for ${p.code}` })),
        h("td", {})));
    }
    for (const p of rows) {
      body.push(h("tr", {},
        h("td", { class: "code" }, p.code),
        h("td", {}, p.title,
          p.specialTopics
            ? h("div", {}, h("label", { class: "ga-visually-hidden", for: `topic-${p.id}` }, "Topic"),
                h("input", { type: "text", id: `topic-${p.id}`, list: "topic-list", placeholder: "Topic as printed on your transcript", value: p.topic ?? "", oninput: (ev) => { p.topic = ev.target.value; } }))
            : null),
        h("td", {}, select(termOptions, p.term, (v) => { p.term = v; picker.focusTerm = null; renderPicks(); }, { "aria-label": "Term" })),
        h("td", { class: "num" }, h("input", { type: "number", min: "0.5", max: "17", step: "0.5", value: p.credits, "aria-label": "Credits", oninput: (ev) => { p.credits = Number(ev.target.value); } }),
          p.variableCredits ? h("div", { class: "ga-muted small" }, "variable credits") : null),
        h("td", {}, select(GRADES, p.grade, (v) => { p.grade = v; }, { "aria-label": "Grade" })),
        h("td", {}, h("button", { type: "button", class: "ga-remove", onclick: () => { picker.picks = picker.picks.filter((x) => x !== p); picker.focusTerm = null; renderPicks(); } }, "Remove"))));
    }
    body.push(addRow(term));
  }
  table.replaceChildren(
    h("thead", {}, h("tr", {}, h("th", {}, "Code"), h("th", {}, "Course"), h("th", {}, "Term"), h("th", { class: "num" }, "Credits"), h("th", {}, "Grade"), h("th", {}, ""))),
    h("tbody", {}, body),
    h("tfoot", {}, h("tr", {}, h("th", { colspan: 5 }, "Total credits entered"), h("th", { class: "num" }, fmt(total)))));
  picker.focusTerm = null;
}

/** Fill the picker with the synthetic sample student (same record as the sample PDFs). */
function fillSample() {
  picker.startYear = 2024;
  $("start-year").value = "2024";
  picker.firstYearDone = true;
  $("fy-done").checked = true;
  picker.firstYearGrades = {};
  picker.picks = [];
  const byCode = new Map(PICKABLE.map((c) => [c.code, c]));
  for (const [term, rows] of SAMPLE_TERMS) {
    for (const [subject, number, description, attempted, , grade, topic] of rows) {
      if (subject === "PSLFY") { if (grade) picker.firstYearGrades[`${subject} ${number}`] = grade; continue; }
      const code = `${subject} ${number}`;
      const cat = byCode.get(code) ?? { code, title: description, credits: attempted };
      picker.picks.push({ id: ++pickId, code, title: cat.title, term, credits: attempted, variableCredits: false, grade: grade ?? "", topic: topic ?? null, specialTopics: Boolean(cat.specialTopics) });
    }
  }
  picker.focusTerm = null;
  renderPicks();
}

function initPicker() {
  $("start-year").addEventListener("change", (ev) => { picker.startYear = Number(ev.target.value); renderPicks(); });
  $("fy-done").addEventListener("change", (ev) => { picker.firstYearDone = ev.target.checked; renderPicks(); });
  $("custom-add").addEventListener("click", () => {
    const code = $("custom-code").value.trim().toUpperCase();
    const title = $("custom-title").value.trim();
    const credits = Number($("custom-credits").value);
    const term = $("custom-term").value;
    if (!/^[A-Z]{2,6} \d{3}[A-Z]?$/.test(code)) { setStatus("The code must look like \"LWELA 903\".", true); return; }
    if (!title) { setStatus("Give the course a title.", true); return; }
    addPick({ code, title, credits, defaultCredits: credits, specialTopics: rules.SPECIAL_TOPICS_TITLE.test(title) }, term);
    $("custom-code").value = ""; $("custom-title").value = "";
    setStatus("");
  });
  const customTerm = $("custom-term");
  const fillCustomTerms = () => customTerm.replaceChildren(...termList(picker.startYear).map((t) => h("option", { value: t }, t)));
  fillCustomTerms();
  $("start-year").addEventListener("change", fillCustomTerms);
  $("run-manual").addEventListener("click", () => audit(buildManualCourses(allPicks()), "your course selections"));
  $("manual-sample").addEventListener("click", fillSample);
  $("manual-clear").addEventListener("click", () => { picker.picks = []; picker.firstYearGrades = {}; renderPicks(); setStatus(""); });
  $("topic-list").replaceChildren(...topicSuggestions(DATA).map((t) => h("option", { value: t })));
  renderPicks();
}

/** The two input tabs. Only the visible panel's controls are used; switching never clears anything. */
function initModes() {
  const modes = [["mode-pdf", "panel-pdf"], ["mode-manual", "panel-manual"]];
  for (const [btn, panel] of modes) {
    $(btn).addEventListener("click", () => {
      for (const [b, p] of modes) {
        const on = b === btn;
        $(b).classList.toggle("is-active", on);
        $(b).setAttribute("aria-selected", on ? "true" : "false");
        $(p).hidden = !on;
      }
    });
  }
}

// ---------------------------------------------------------------------------------------------
// Wire up
// ---------------------------------------------------------------------------------------------
function init() {
  const drop = $("drop");
  $("file").addEventListener("change", (ev) => handleFile(ev.target.files[0]));
  for (const t of ["dragenter", "dragover"]) drop.addEventListener(t, (ev) => { ev.preventDefault(); drop.classList.add("is-over"); });
  for (const t of ["dragleave", "drop"]) drop.addEventListener(t, () => drop.classList.remove("is-over"));
  drop.addEventListener("drop", (ev) => { ev.preventDefault(); handleFile(ev.dataTransfer.files[0]); });
  $("try-sample").addEventListener("click", () => audit(parseAnyText(sampleTranscriptLines().join("\n")), "the synthetic sample"));
  $("try-sample-report").addEventListener("click", () => audit(parsePdfPages(sampleReportPages()), "the synthetic sample"));
  $("use-paste").addEventListener("click", () => audit(parseAnyText($("paste").value), "the pasted text"));
  $("profdev").addEventListener("change", () => lastCourses && render(lastCourses));
  initModes();
  initPicker();
  renderCatalog();
  renderHow();
}

init();
