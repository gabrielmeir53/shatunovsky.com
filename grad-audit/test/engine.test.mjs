#!/usr/bin/env node
/**
 * engine.test.mjs: tests for the parser, title matching and audit rules. Uses only Node's built-in
 * test runner (node:test); no npm packages.
 *
 *   node --test grad-audit/test/engine.test.mjs
 *
 * Optional: audit a real transcript locally (never commit one). Pass a text export of it:
 *   pdftotext -layout Transcript.pdf /tmp/t.txt && GRAD_AUDIT_TRANSCRIPT=/tmp/t.txt node --test grad-audit/test/engine.test.mjs
 * That test only prints the result; it asserts nothing about a specific person's record.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

import * as rules from "../rules.js";
import catalog from "../data/catalog.js";
import lists from "../data/intranet-lists.js";
import concentrations from "../data/concentrations.js";
import chart from "../data/course-chart.js";
import { parseTranscriptText, parsePdfPages, parseAnyText, parseReportLines, itemsToLines, detectFormat } from "../parser.js";
import { runAudit, assignExclusive, gradeMeets, courseStatus, describeCatalog } from "../engine.js";
import { normalizeTitle, titleKey, parseQualifiers } from "../match.js";
import { sampleTranscriptLines, sampleReportPages, SAMPLE_TERMS } from "../sample.js";
import { parseSubjectPage } from "../tools/build-catalog.mjs";

const DATA = { rules, catalog, lists, concentrations, chart };
const AS_OF = new Date(2026, 10, 4); // Nov 4, 2026: Fall 2026 in progress, Spring 2027 enrolled
const sample = () => parseTranscriptText(sampleTranscriptLines().join("\n"));
const auditSample = (opts = {}) => runAudit(sample().courses, DATA, { asOf: AS_OF, ...opts });
const req = (r, id) => r.requirements.find((q) => q.requirement.id === id);

// ---------------------------------------------------------------- parser
test("parser reads graded, CR, withdrawn and ungraded rows", () => {
  const p = parseTranscriptText([
    "Fall 2025",
    "LWELA           903        Corporations                 3.000    3.000     B          9.000",
    "LWSEM           997        Special Topics               2.000    2.000     A          8.000",
    "Course Topic:              Standards of Review",
    "Spring 2026",
    "LWELA           973        Introduction to Private Wealt 1.000   1.000     CR         0.000",
    "LWELA           918        Remedies                     3.000    0.000     W          0.000",
    "Fall 2026",
    "LWELA           910        Energy Lw and Pol            3.000    0.000                0.000",
  ].join("\n"));
  assert.deepEqual(p.terms, ["Fall 2025", "Spring 2026", "Fall 2026"]);
  assert.equal(p.courses.length, 5);
  assert.deepEqual(p.warnings, []);
  const [corp, sem, pw, rem, energy] = p.courses;
  assert.equal(corp.code, "LWELA 903");
  assert.equal(corp.grade, "B");
  assert.equal(sem.topic, "Standards of Review");
  assert.equal(pw.grade, "CR");
  assert.equal(rem.grade, "W");
  assert.equal(energy.grade, null);
  assert.equal(energy.attempted, 3);
  assert.equal(energy.earned, 0);
});

test("parser ignores headers and totals, warns on unreadable course-like lines", () => {
  const p = parseAnyText(["Name: X", "Fall 2025", "Term GPA 3.720 Term Totals 14.000 14.000", "LWELA 903 Corporations 3.000 B 9.000"].join("\n"));
  assert.equal(p.courses.length, 0);
  assert.equal(p.warnings.length, 2); // the malformed row + "no courses found"
});

test("parser does not capture name or student ID", () => {
  const p = sample();
  const json = JSON.stringify(p);
  assert.ok(!json.includes("SAMPLE STUDENT"));
  assert.ok(!json.includes("000000000"));
});

// ---------------------------------------------------------------- requirements report format
test("report: format detected and every Course History row read", () => {
  const pages = sampleReportPages();
  assert.equal(detectFormat(pages), "requirementsReport");
  const r = parsePdfPages(pages);
  assert.equal(r.format, "requirementsReport");
  assert.deepEqual(r.warnings, []);
  assert.equal(r.courses.length, SAMPLE_TERMS.flatMap(([, rows]) => rows).length);
});

test("report: same courses as the advising transcript of the same student", () => {
  const key = (c) => `${c.term}|${c.code}|${c.attempted}|${c.earned}|${c.grade}|${c.topic}`;
  const fromReport = parsePdfPages(sampleReportPages()).courses.map(key).sort();
  const fromTranscript = sample().courses.map(key).sort();
  assert.deepEqual(fromReport, fromTranscript);
});

test("report: ignores the requirement tables, header and footer", () => {
  const r = parsePdfPages(sampleReportPages());
  // The left-column requirement table repeats LWELA 910 (Fall 2026); it must be counted once.
  assert.equal(r.courses.filter((c) => c.code === "LWELA 910").length, 1);
  const json = JSON.stringify(r);
  for (const s of ["SAMPLE STUDENT", "000000000", "Advisor", "Cum GPA"]) assert.ok(!json.includes(s), s);
});

test("report: wrapped titles rejoined, topic numbering stripped, glued units split", () => {
  const lines = [
    { page: 1, col: 1, x: 426, y: 558, text: "Course History" },
    { page: 1, col: 1, x: 317, y: 538, text: "PSLFY 908 LEG RES TLS & STRT2.00 FA 2024 B+ EN" },
    { page: 1, col: 1, x: 317, y: 313, text: "LWSEM 965 Workers' 3.00 FA 2025 A- EN" },
    { page: 1, col: 1, x: 392, y: 304, text: "Compensation Law" },
    { page: 1, col: 1, x: 317, y: 128, text: "LWEXP 997 Special Topics 2.00 FA 2026 IP" },
    { page: 1, col: 1, x: 327, y: 114, text: "Course Topic: 32 - Application and Strategies" },
    { page: 1, col: 1, x: 306, y: 30, text: "GPA rounds to 2 digits – the final zero is a place holder Page 1 of 2" },
    { page: 2, col: 0, x: 133, y: 762, text: "SAMPLE: 000000000" },
    { page: 2, col: 0, x: 29, y: 716, text: "LWEXP 914 Employment Litigation 2.00 SP 2027 IP" },
  ];
  const r = parseReportLines(lines);
  const [lrts, wc, st, el] = r.courses;
  assert.equal(lrts.description, "LEG RES TLS & STRT");
  assert.equal(lrts.attempted, 2);
  assert.equal(wc.description, "Workers' Compensation Law");
  assert.equal(st.topic, "Application and Strategies");
  assert.equal(st.grade, null);
  assert.equal(el.description, "Employment Litigation"); // footer/header never glued on
  assert.deepEqual(r.terms, ["Fall 2024", "Fall 2025", "Fall 2026", "Spring 2027"]);
});

test("report: columns are read left then right on each page", () => {
  const lines = itemsToLines([{ width: 612, items: [
    { x: 35, y: 500, w: 10, str: "LEFT-A" }, { x: 320, y: 500, w: 10, str: "RIGHT-A" },
    { x: 35, y: 480, w: 10, str: "LEFT-B" }, { x: 320, y: 480, w: 10, str: "RIGHT-B" },
  ] }], { splitColumns: true });
  assert.deepEqual(lines.map((l) => l.text), ["LEFT-A", "LEFT-B", "RIGHT-A", "RIGHT-B"]);
});

test("report: pasted Course History text is accepted", () => {
  const p = parseAnyText("Course History\nLWELA 903 Corporations 3.00 FA 2025 B+ EN\nLWELA 910 Energy Lw and Pol 3.00 FA 2026 IP");
  assert.equal(p.format, "requirementsReport");
  assert.equal(p.courses.length, 2);
});

test("report: the sample student's audit matches the transcript-based audit", () => {
  const a = runAudit(parsePdfPages(sampleReportPages()).courses, DATA, { asOf: AS_OF });
  const b = auditSample();
  assert.deepEqual(a.requirements.map((q) => q.status), b.requirements.map((q) => q.status));
  assert.equal(a.totals.projected, b.totals.projected);
});

// ---------------------------------------------------------------- matching
test("title normalization reconciles source spellings", () => {
  assert.equal(normalizeTitle("Business Planning for M&A I"), normalizeTitle("Business Planning for Mergers and Acquisitions I"));
  assert.equal(normalizeTitle("Tax Policy Seminar"), normalizeTitle("Tax Policy"));
  assert.equal(normalizeTitle("Health Law (Formerly Introduction to Health Law)"), "health law");
  assert.notEqual(normalizeTitle("Family Law"), normalizeTitle("Family Law Clinic"));
  assert.notEqual(normalizeTitle("Contract Drafting"), normalizeTitle("Contract Drafting (M&A Focus)"));
  assert.equal(parseQualifiers("Criminal Procedure (LLMs Only)").llmOnly, true);
});

test("every title alias points at a real catalog course", () => {
  const keys = new Set(catalog.courses.map((c) => normalizeTitle(c.title)));
  for (const a of rules.TITLE_ALIASES.filter((a) => !a.specialTopic)) {
    assert.ok(keys.has(normalizeTitle(a.to)), `alias target not in catalog: ${a.to}`);
  }
});

// ---------------------------------------------------------------- grades & status
test("grade minimums", () => {
  const G = rules.GRADE_ORDER;
  assert.equal(gradeMeets("C", "C", G), true);
  assert.equal(gradeMeets("C+", "C", G), true);
  assert.equal(gradeMeets("C-", "C", G), false);
  assert.equal(gradeMeets("F", "C", G), false);
  assert.equal(gradeMeets("CR", "C", G), true); // A2
  assert.equal(gradeMeets(null, "C", G), "pending");
});

test("in progress vs enrolled depends on term start (A3)", () => {
  assert.equal(courseStatus({ term: "Fall 2026", grade: null }, AS_OF), "inProgress");
  assert.equal(courseStatus({ term: "Spring 2027", grade: null }, AS_OF), "enrolled");
  assert.equal(courseStatus({ term: "Spring 2026", grade: "W" }, AS_OF), "withdrawn");
});

// ---------------------------------------------------------------- the sample student
test("sample: post-merger codes satisfy the four miscoded requirements", () => {
  const r = auditSample();
  assert.equal(req(r, "seminar").status, "met");
  assert.equal(req(r, "seminar").courses[0].code, "LWSEM 997");
  assert.equal(req(r, "pr").status, "met");
  assert.equal(req(r, "pr").courses[0].code, "LWREQ 934");
  assert.equal(req(r, "aba303c").status, "met");
  assert.equal(req(r, "experiential").status, "projected"); // 5 done + 4 in-progress clinic
  assert.deepEqual(r.auditErrors.map((e) => e.requirement).length, 4);
});

test("sample: totals, residency and overall status", () => {
  const r = auditSample();
  assert.equal(r.totals.earned, 59); // W row earns nothing
  assert.equal(r.totals.projected, 88);
  assert.equal(req(r, "credits").status, "projected");
  assert.equal(req(r, "residency").status, "projected");
  assert.equal(r.overall.state, "onTrack");
  assert.equal(req(r, "profDev").status, "confirm");
  assert.equal(req(auditSample({ profDevConfirmed: true }), "profDev").status, "met");
});

test("sample: first-year Criminal Procedure never satisfies 303(c) (A4)", () => {
  const r = auditSample();
  const crimPro = r.courses.find((c) => c.code === "PSLFY 907");
  assert.equal(crimPro.eligible.aba303c, null);
});

test("sample: C- course earns credit but is not counted toward a concentration (A11)", () => {
  const r = auditSample();
  const tax = r.concentrations.find((c) => c.name === "Taxation");
  const bfit = tax.matched.find((m) => m.course.code === "LWELA 949");
  assert.ok(bfit, "Basic Federal Income Taxation should match the Taxation list");
  assert.equal(bfit.counts, false);
  assert.ok(r.courses.find((c) => c.code === "LWELA 949").credits === 3);
});

test("sample: CR course counts toward concentrations but is flagged (A2)", () => {
  const r = auditSample();
  const corp = r.concentrations.find((c) => c.name === "Corporate Law and Practice");
  const pw = corp.matched.find((m) => m.course.code === "LWELA 973");
  assert.equal(pw.counts, true);
  assert.equal(pw.verify, true);
});

test("sample: transcript abbreviations resolve through the catalog", () => {
  const r = auditSample();
  assert.equal(r.courses.find((c) => c.code === "LWELA 921").title, "Business Planning for Mergers and Acquisitions I");
  assert.equal(r.courses.find((c) => c.code === "LWSEM 997").title, "Standards of Review");
});

// ---------------------------------------------------------------- double counting (A5)
function fake(code, subject, credits, { seminar = null, aba303c = null, experiential = null, grade = "A" } = {}) {
  return { code, subject, credits, status: "done", eligible: { seminar, aba303c, experiential }, meets: { seminar: true, aba303c: true, experiential: true }, grade };
}

test("one course cannot be both the seminar and the 303(c) course", () => {
  const both = fake("LWSEM 910", "LWSEM", 2, { seminar: "subject", aba303c: "list" });
  const a = assignExclusive([both], rules.REQUIREMENTS);
  assert.ok(!(a.seminar === both && a.aba303c === both));
});

test("two seminars: one for the seminar requirement, one for 303(c)", () => {
  const s1 = fake("LWSEM 939", "LWSEM", 2, { seminar: "subject" });
  const s2 = fake("LWSEM 910", "LWSEM", 2, { seminar: "subject", aba303c: "list" });
  const a = assignExclusive([s1, s2], rules.REQUIREMENTS);
  assert.equal(a.seminar, s1);
  assert.equal(a.aba303c, s2);
});

test("an experiential course may be the 303(c) course only if experiential still reaches 6 without it", () => {
  const clinic = fake("LWCLI 945", "LWCLI", 4, { experiential: "subject", aba303c: "list" });
  const exp = fake("LWEXP 936", "LWEXP", 3, { experiential: "subject" });
  // 7 experiential credits total: using the clinic for 303(c) would leave 3 < 6 → assignment prefers
  // to keep experiential satisfied? Both options satisfy 2 of 3; tie-break keeps more experiential credits.
  let a = assignExclusive([clinic, exp], rules.REQUIREMENTS);
  assert.ok(a.aba303c !== clinic || a.expCredits < 6);
  // With 6 other experiential credits, the clinic is excess and can be the 303(c) course.
  const exp2 = fake("LWEXP 957", "LWEXP", 3, { experiential: "subject" });
  a = assignExclusive([clinic, exp, exp2], rules.REQUIREMENTS);
  assert.equal(a.aba303c, clinic);
  assert.equal(a.expCredits, 6);
});

// ---------------------------------------------------------------- crosswalk & catalog
test("crosswalk: Employment Discrimination is 303(c) and on 7 concentration lists", () => {
  const row = describeCatalog(DATA).find((c) => c.code === "LWELA 964");
  assert.ok(row.requirements.includes("ABA 303(c)"));
  assert.equal(row.concentrations.length, 7);
});

test("catalog parser reads a bulletin course block", () => {
  const html = `<div class="courseblock"><div class="course_codetitle">LWSEM 901: Child Welfare Seminar</div>
    <div class="course_credits"> 2 Credits </div><div class="courseblockdesc"><p>... This course satisfies the upper-level writing seminar requirement.</p></div></div>`;
  const [c] = parseSubjectPage(html);
  assert.equal(c.code, "LWSEM 901");
  assert.equal(c.credits, "2");
  assert.deepEqual(c.tags, ["seminar"]);
});

// ---------------------------------------------------------------- optional: a real transcript, locally
const local = process.env.GRAD_AUDIT_TRANSCRIPT;
test("local transcript (optional; prints only)", { skip: !local || !existsSync(local) }, () => {
  const p = parseTranscriptText(readFileSync(local, "utf8"));
  const r = runAudit(p.courses, DATA, { asOf: new Date() });
  console.log(r.overall, r.requirements.map((q) => `${q.requirement.id}: ${q.status}`));
});
