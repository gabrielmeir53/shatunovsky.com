/**
 * app.js: the page. Wires the file input to parser.js and engine.js and renders the result.
 *
 * This is the ONLY file that touches the DOM. It:
 *   - reads the chosen PDF with File.arrayBuffer() (local; nothing is uploaded),
 *   - loads pdf.js from ./vendor only when a PDF is chosen, and points its worker at ./vendor,
 *   - renders results with textContent only. Transcript text is never inserted as HTML, so a crafted
 *     PDF cannot inject markup or script (and the CSP in index.html forbids inline script anyway).
 * It stores nothing: no localStorage, cookies or IndexedDB. Reloading the page clears everything.
 */
import * as rules from "./rules.js";
import catalog from "./data/catalog.js";
import lists from "./data/intranet-lists.js";
import concentrations from "./data/concentrations.js";
import chart from "./data/course-chart.js";
import { parseTranscriptText, extractPdfLines } from "./parser.js";
import { runAudit, describeCatalog, statusWord } from "./engine.js";
import { sampleTranscriptLines } from "./sample.js";

const DATA = { rules, catalog, lists, concentrations, chart };
const REGISTRAR = "registrar@pennstatelaw.psu.edu";

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
const pill = (status) => h("span", { class: `ga-pill ${PILL[status][0]}` }, PILL[status][1]);
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

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
    setStatus("That isn't a PDF. Save the LionPATH advising transcript as a PDF and try again.", true);
    return;
  }
  setStatus("Reading the PDF on this device…");
  try {
    const pdfjs = await import("./vendor/pdf.min.js");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdf.worker.min.js", import.meta.url).href;
    const text = await extractPdfLines(pdfjs, new Uint8Array(await file.arrayBuffer()));
    audit(text, "your transcript");
  } catch (err) {
    console.error(err);
    setStatus("The PDF couldn't be read. Try the \"paste the transcript text\" option below.", true);
  }
}

function audit(text, label) {
  const parsed = parseTranscriptText(text);
  if (!parsed.courses.length) {
    setStatus(parsed.warnings.join(" "), true);
    $("results").hidden = true;
    return;
  }
  lastCourses = parsed;
  render(parsed);
  setStatus(`Audited ${label}: ${parsed.courses.length} courses in ${parsed.terms.length} terms.`);
  $("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function render(parsed) {
  const result = runAudit(parsed.courses, DATA, { asOf: new Date(), profDevConfirmed: $("profdev").checked });
  const root = $("results");
  root.replaceChildren(
    renderBanner(result),
    renderRequirements(result),
    renderAuditErrors(result),
    renderResidency(result),
    renderConcentrations(result),
    renderPlanner(result),
    renderCourses(result, parsed.warnings),
  );
  root.hidden = false;
}

// ---------------------------------------------------------------------------------------------
// Results sections
// ---------------------------------------------------------------------------------------------
function section(title, ...body) {
  return h("section", { class: "ga-section ga-results-section" }, h("h2", {}, title), ...body);
}

function renderBanner(r) {
  const { state, blockers, pending, lastTerm } = r.overall;
  const term = lastTerm ?? "your final term";
  if (state === "complete") {
    return h("div", { class: "ga-banner is-met" }, h("h2", {}, "All requirements met"),
      h("p", {}, "Every requirement this page can check is satisfied by completed courses."));
  }
  if (state === "onTrack") {
    return h("div", { class: "ga-banner is-projected" },
      h("h2", {}, `On track to graduate after ${term}`),
      h("p", {}, "Every requirement is met or will be met if your current and enrolled courses finish with a C or better. Still depending on those courses:"),
      h("ul", {}, pending.map((p) => h("li", {}, p))),
      r.requirements.some((q) => q.status === "confirm") ? h("p", {}, "Also confirm the January 1L Professional Development program (checkbox above).") : null);
  }
  return h("div", { class: "ga-banner is-open" },
    h("h2", {}, `Not yet on track: ${blockers.length} item${blockers.length === 1 ? "" : "s"} open`),
    h("p", {}, "Even counting current and enrolled courses, these are not satisfied:"),
    h("ul", {}, blockers.map((b) => h("li", {}, b))),
    h("p", {}, "See the remaining-semester options below."));
}

function renderRequirements(r) {
  const rows = r.requirements.map((q) =>
    h("tr", {},
      h("td", {}, q.requirement.label),
      h("td", {}, pill(q.status)),
      h("td", { class: "small" }, q.detail, q.verify.length ? h("div", { class: "ga-warn" }, "Verify: ", q.verify.join("; ")) : null),
      h("td", { class: "small" }, q.requirement.lionpath
        ? h("span", { class: "ga-warn" }, q.courses.length ? "LionPATH can't count this (see below)" : "LionPATH line is miscoded")
        : h("span", { class: "ga-muted" }, "Counts correctly"))));
  return section("Graduation requirements",
    h("div", { class: "ga-table-wrap" }, h("table", { class: "ga-table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Requirement"), h("th", {}, "Status"), h("th", {}, "How it's met"), h("th", {}, "LionPATH audit"))),
      h("tbody", {}, rows))),
    h("p", { class: "ga-note" },
      `Credits: ${fmt(r.totals.earned)} earned, ${fmt(r.totals.inProgress)} in progress, ${fmt(r.totals.enrolled)} enrolled for a future term = ${fmt(r.totals.projected)} projected. "On track" assumes a C or better in every unfinished course.`));
}

function renderAuditErrors(r) {
  if (!r.auditErrors.length) {
    return section("LionPATH audit errors", h("p", {}, "None found: no course on your record is affected by the miscoded LionPATH lines."));
  }
  const email = buildEmail(r);
  const box = h("textarea", { class: "ga-email", rows: 14, readonly: true, "aria-label": "Email text for the registrar" }, email);
  return section(`LionPATH audit errors to send to the registrar (${r.auditErrors.length})`,
    h("p", {}, "LionPATH's degree audit for this cohort only recognizes pre-merger course codes, so it shows these requirements as not satisfied. Each one is satisfied (or on track) under the written rules:"),
    h("ul", { class: "ga-errors" }, r.auditErrors.map((e) =>
      h("li", {},
        h("h3", {}, e.requirement),
        h("dl", {},
          h("dt", {}, "Your courses"), h("dd", {}, e.satisfiedBy.join("; ")),
          h("dt", {}, "LionPATH accepts"), h("dd", {}, e.lionpathAccepts),
          h("dt", {}, "Why it fails"), h("dd", {}, e.problem),
          h("dt", {}, "Fix"), h("dd", {}, e.fix))))),
    h("h3", {}, "Ready-to-send email"),
    h("p", { class: "ga-muted small" }, `Add your name and PSU ID before sending to ${REGISTRAR}. The page never reads them from the transcript.`),
    box,
    h("div", { class: "ga-actions ga-no-print" },
      h("button", { type: "button", class: "ga-btn", onclick: async (ev) => {
        try { await navigator.clipboard.writeText(email); ev.target.textContent = "Copied"; }
        catch { box.select(); ev.target.textContent = "Press ⌘C / Ctrl+C to copy"; }
      } }, "Copy email text"),
      h("button", { type: "button", class: "ga-btn ga-btn-secondary", onclick: () => window.print() }, "Print this audit")));
}

/** Plain-text email to the registrar. Contains course data only; no name or ID. */
function buildEmail(r) {
  const lines = [
    `To: ${REGISTRAR}`,
    "Subject: Degree audit miscoding: pre-merger requirement lines (UP J.D., admitted before Fall 2025)",
    "",
    "Hello,",
    "",
    "My LionPATH degree audit shows the requirements below as not satisfied because the requirement lines only recognize pre-merger course codes. Could you correct them on my record?",
    "",
  ];
  r.auditErrors.forEach((e, i) => {
    lines.push(`${i + 1}. ${e.requirement}`);
    lines.push(`   Satisfied by: ${e.satisfiedBy.join("; ")}`);
    lines.push(`   LionPATH accepts only: ${e.lionpathAccepts}`);
    lines.push("");
  });
  lines.push("Thank you,", "[Name]", "[PSU ID]");
  return lines.join("\n");
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

function renderPlanner(r) {
  const p = r.planner;
  if (!p.terms.length) return section("Remaining semesters", h("p", {}, "The course chart doesn't list any semester after the current one."));
  if (!p.suggestions.length) return section(`Options for ${p.terms.join(", ")}`, h("p", {}, "Nothing on the course chart would close an open requirement or a concentration within 6 credits."));
  const row = (s) => h("tr", {},
    h("td", { class: "code" }, s.code ?? s.prefix),
    h("td", {}, s.name, s.temporary ? h("span", { class: "ga-muted" }, " *") : null, s.clinic ? h("span", { class: "ga-tag" }, "application") : null),
    h("td", { class: "num" }, s.credits === "?" ? h("span", { class: "ga-muted" }, "check LionPATH") : s.credits),
    h("td", { class: "small" }, s.reasons.join("; ")));
  const head = h("thead", {}, h("tr", {}, h("th", {}, "Code"), h("th", {}, "Course"), h("th", { class: "num" }, "Credits"), h("th", {}, "Would count toward")));
  const top = p.suggestions.slice(0, 12);
  const rest = p.suggestions.slice(12);
  return section(`Options for ${p.terms.join(", ")}`,
    h("p", {}, "Courses the course chart lists for the coming semester that would close an open requirement or move a concentration that's within 6 credits of complete. Courses on the most lists come first."),
    h("div", { class: "ga-table-wrap" }, h("table", { class: "ga-table" }, head, h("tbody", {}, top.map(row)))),
    rest.length ? h("details", {}, h("summary", {}, `Show ${rest.length} more`),
      h("div", { class: "ga-table-wrap" }, h("table", { class: "ga-table" }, head.cloneNode(true), h("tbody", {}, rest.map(row))))) : null,
    h("p", { class: "ga-muted small" }, "* not a permanent part of the curriculum. Clinics require an application. Offerings are anticipated and subject to change; adjunct-taught courses aren't on the chart. Watch the 17-credit semester maximum."));
}

function renderCourses(r, warnings) {
  const usedFor = new Map();
  for (const q of r.requirements) for (const c of q.courses) {
    if (["oneCourse", "credits"].includes(q.requirement.kind)) usedFor.set(c, [...(usedFor.get(c) ?? []), q.requirement.label.replace(/ \(C or better\)$/, "")]);
  }
  return section("Your courses as read from the transcript",
    warnings.length ? h("div", { class: "ga-note ga-warn" }, h("strong", {}, "Reading warnings: "), warnings.join(" ")) : null,
    h("div", { class: "ga-table-wrap is-tall" }, h("table", { class: "ga-table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Term"), h("th", {}, "Code"), h("th", {}, "Course (official title)"), h("th", { class: "num" }, "Credits"), h("th", {}, "Grade"), h("th", {}, "Used for"))),
      h("tbody", {}, r.courses.map((c) => h("tr", {},
        h("td", { class: "small" }, c.term),
        h("td", { class: "code" }, c.code),
        h("td", {}, c.title, c.title !== c.description ? h("div", { class: "ga-muted small" }, `Transcript: ${c.description}`) : null,
          !c.inCatalog ? h("div", { class: "ga-muted small" }, "Not in the current Bulletin") : null),
        h("td", { class: "num" }, fmt(c.status === "done" || c.status === "withdrawn" ? c.earned : c.attempted)),
        h("td", {}, c.grade ?? h("span", { class: "ga-muted" }, statusWord(c.status))),
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
  $("sources").replaceChildren(...Object.values(rules.SOURCES).map((s) => h("li", {}, s)),
    h("li", {}, `Course catalog snapshot: ${catalog.snapshot}`));
  $("assumptions").replaceChildren(...rules.ASSUMPTIONS.map((a) =>
    h("li", {}, h("strong", {}, `${a.id}. `), a.text, " ", h("span", { class: "where" }, `(${a.where})`))));
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
  $("try-sample").addEventListener("click", () => audit(sampleTranscriptLines().join("\n"), "the synthetic sample transcript"));
  $("use-paste").addEventListener("click", () => audit($("paste").value, "the pasted text"));
  $("profdev").addEventListener("change", () => lastCourses && render(lastCourses));
  renderCatalog();
  renderHow();
}

init();
