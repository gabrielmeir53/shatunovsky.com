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
import legacy from "../data/legacy-catalog.js";
import lists from "../data/intranet-lists.js";
import concentrations from "../data/concentrations.js";
import chart from "../data/course-chart.js";
import offeringsSpring2027 from "../data/offerings-spring-2027.js";
import { parseTranscriptText, parsePdfPages, parseAnyText, parseReportLines, itemsToLines, detectFormat } from "../parser.js";
import { runAudit, assignExclusive, gradeMeets, courseStatus, describeCatalog } from "../engine.js";
import { normalizeTitle, titleKey, parseQualifiers } from "../match.js";
import { sampleTranscriptLines, sampleReportPages, SAMPLE_TERMS } from "../sample.js";
import * as manual from "../manual.js";
import { parseSubjectPage, parseSubjectIndex } from "../tools/build-catalog.mjs";

const DATA = { rules, catalog, legacy, lists, concentrations, chart, offerings: [offeringsSpring2027] };
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

test("every source has a label, a link and a note; every requirement cites a source", () => {
  for (const [k, s] of Object.entries(rules.SOURCES)) {
    assert.ok(s.label && /^https:\/\//.test(s.url) && s.note, `SOURCES.${k}`);
  }
  for (const r of rules.REQUIREMENTS) assert.ok(rules.SOURCES[r.source], `${r.id} cites unknown source ${r.source}`);
});

test("experiential: a CR grade counts without a verify flag (Intranet page says Credit counts, A2)", () => {
  const p = sample();
  const courses = p.courses.map((c) => (c.code === "LWEXP 957" ? { ...c, grade: "CR" } : c));
  const r = runAudit(courses, DATA, { asOf: AS_OF });
  const exp = req(r, "experiential");
  assert.ok(exp.courses.some((c) => c.code === "LWEXP 957"));
  assert.equal(exp.verify.length, 0);
  // but the same CR grade on the Professional Responsibility course is still flagged
  const r2 = runAudit(p.courses.map((c) => (c.code === "LWREQ 934" ? { ...c, grade: "CR" } : c)), DATA, { asOf: AS_OF });
  assert.ok(req(r2, "pr").verify.some((v) => /CR grade/.test(v)));
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
test("crosswalk: Employment Discrimination is 303(c) (UP list) and on 7 concentration lists", () => {
  const row = describeCatalog(DATA).find((c) => c.code === "LWELA 964");
  assert.ok(row.requirements.includes("ABA 303(c) – UP"));
  assert.equal(row.concentrations.length, 7);
  // Election Law is only on the unified Dickinson Law page (A13)
  assert.ok(describeCatalog(DATA).find((c) => c.code === "LWELB 954").requirements.includes("ABA 303(c) – DL"));
});

// ---------------------------------------------------------------- 303(c): two Intranet lists (A13)
test("303(c): the University Park list is a subset of the unified list, and each UP entry resolves", () => {
  const aliases = Object.fromEntries(rules.TITLE_ALIASES.map((a) => [normalizeTitle(a.from), normalizeTitle(a.to)]));
  const unified = new Set(lists.aba303c.courses.map((e) => titleKey(e.title, aliases)));
  for (const e of lists.aba303c.universityPark.courses) assert.ok(unified.has(titleKey(e.title, aliases)), `not on unified list: ${e.title}`);
  assert.equal(lists.aba303c.universityPark.courses.length, 14); // 13 courses + the non-law-electives line
});

test("303(c): via is UP for a UP-list course and DL for a unified-list-only course", () => {
  // Sample student: Employment Discrimination (UP list, B, Spring 2026) wins over Election Law (DL only, in progress)
  const r = auditSample();
  assert.equal(req(r, "aba303c").via, "UP");
  assert.equal(req(r, "aba303c").courses[0].code, "LWELA 964");
  // Drop Employment Discrimination: Election Law (unified list only) is used and marked DL
  const p = sample();
  const r2 = runAudit(p.courses.filter((c) => c.code !== "LWELA 964"), DATA, { asOf: AS_OF });
  assert.equal(req(r2, "aba303c").status, "projected");
  assert.equal(req(r2, "aba303c").via, "DL");
  assert.equal(req(r2, "aba303c").courses[0].code, "LWELB 954");
});

test("303(c): Trauma Informed Lawyering is experiential, so it is the 303(c) course only as excess experiential credit", () => {
  const p = sample();
  // Replace the sample's 303(c) courses (Employment Discrimination, Election Law, Con Law II) with the
  // LWEXP 997 topic section; experiential already has 9 credits without it.
  const courses = p.courses.filter((c) => !["LWELA 964", "LWELB 954", "LWELA 963"].includes(c.code));
  courses.push({ term: "Spring 2027", subject: "LWEXP", number: "997", code: "LWEXP 997", description: "Special Topics", topic: "Trauma Informed Lawyering", attempted: 2, earned: 0, grade: null, line: 99 });
  const r = runAudit(courses, DATA, { asOf: AS_OF });
  assert.equal(req(r, "aba303c").courses[0]?.code, "LWEXP 997");
  assert.equal(req(r, "aba303c").via, "DL");
  assert.equal(req(r, "experiential").status, "projected"); // still ≥ 6 without it
});

// ---------------------------------------------------------------- manual course picker
test("manual: first-year picks cover the ten PSLFY courses, 32 credits, two terms", () => {
  const picks = manual.firstYearPicks(2024, rules);
  assert.equal(picks.length, 10);
  assert.equal(picks.reduce((n, p) => n + p.credits, 0), 32);
  assert.deepEqual([...new Set(picks.map((p) => p.term))], ["Fall 2024", "Spring 2025"]);
  assert.deepEqual(manual.termList(2024), ["Fall 2024", "Spring 2025", "Summer 2025", "Fall 2025", "Spring 2026", "Summer 2026", "Fall 2026", "Spring 2027"]);
});

test("manual: picks become Course records; bad rows are skipped with a warning", () => {
  const b = manual.buildManualCourses([
    { code: "LWREQ 934", title: "Professional Responsibility", term: "Fall 2025", credits: 3, grade: "P", topic: null },
    { code: "LWSEM 997", title: "Special Topics", term: "Fall 2025", credits: 2, grade: "A-", topic: "Standards of Review" },
    { code: "LWELA 918", title: "Remedies", term: "Spring 2027", credits: 3, grade: "", topic: null },
    { code: "LWELA 955", title: "Evidence", term: "Spring 2026", credits: 3, grade: "W", topic: null },
    { code: "bad", title: "Nonsense", term: "Spring 2026", credits: 3, grade: "B", topic: null },
    { code: "LWELA 903", title: "Corporations", term: "", credits: 3, grade: "B", topic: null },
  ]);
  assert.equal(b.format, "manual");
  assert.equal(b.courses.length, 4);
  assert.equal(b.warnings.length, 2);
  const [pr, sem, rem, ev] = b.courses;
  assert.equal(pr.grade, "P"); assert.equal(pr.earned, 3);
  assert.equal(sem.topic, "Standards of Review"); assert.equal(sem.code, "LWSEM 997");
  assert.equal(rem.grade, null); assert.equal(rem.earned, 0); assert.equal(rem.attempted, 3);
  assert.equal(ev.grade, "W"); assert.equal(ev.earned, 0);
});

test("manual: a self-reported P grade satisfies C-or-better rules but leaves the GPA unknown (A12, A14)", () => {
  assert.equal(gradeMeets("P", "C", rules.GRADE_ORDER), true);
  const picks = [
    ...manual.firstYearPicks(2024, rules),
    { code: "LWREQ 934", title: "Professional Responsibility", term: "Fall 2025", credits: 3, grade: "P", topic: null },
    { code: "LWELA 965", title: "Immigration Law", term: "Spring 2026", credits: 3, grade: "P", topic: null },
  ];
  const r = runAudit(manual.buildManualCourses(picks).courses, DATA, { asOf: AS_OF });
  assert.equal(req(r, "core1lFall").status, "met");
  assert.equal(req(r, "core1lSpring").status, "met");
  assert.equal(req(r, "pr").status, "met");
  assert.equal(req(r, "aba303c").status, "met");
  assert.equal(req(r, "aba303c").via, "UP");
  assert.equal(r.gpa.gpa, null);
  assert.equal(req(r, "gpaBarSkills").status, "confirm");
  assert.equal(req(r, "goodStanding").status, "confirm");
  // Every status that rests on a P grade carries a visible "self-reported" verify note
  for (const id of ["pr", "aba303c", "core1lFall", "core1lSpring"]) assert.ok(req(r, id).verify.some((v) => /self-reported/.test(v)), `${id} should say self-reported`);
});

test("manual: the same record built by hand audits like the sample transcript", () => {
  const picks = SAMPLE_TERMS.flatMap(([term, rows]) =>
    rows.map(([subject, number, description, attempted, , grade, topic]) =>
      ({ code: `${subject} ${number}`, title: description, term, credits: attempted, grade: grade ?? "", topic: topic ?? null })));
  const byHand = runAudit(manual.buildManualCourses(picks).courses, DATA, { asOf: AS_OF });
  const fromPdf = auditSample();
  assert.deepEqual(byHand.requirements.map((q) => [q.requirement.id, q.status]), fromPdf.requirements.map((q) => [q.requirement.id, q.status]));
  assert.equal(byHand.totals.projected, fromPdf.totals.projected);
});

// ---------------------------------------------------------------- GPA-based lines (flowchart)
test("GPA: reconstructed from letter grades; bar-skills condition and good standing", () => {
  const r = auditSample();
  assert.ok(r.gpa.gpa > 2.7 && r.gpa.gpa < 4, `sample GPA ${r.gpa.gpa}`);
  assert.equal(r.gpa.unknown, 1); // the CR course
  assert.equal(req(r, "gpaBarSkills").status, "met");
  assert.equal(req(r, "goodStanding").status, "met");
  // A weak record: C- everywhere → GPA 1.67: bar skills required (open without LWELB 900), standing open
  const weak = sample().courses.map((c) => (c.grade && c.grade !== "W" && c.grade !== "CR" ? { ...c, grade: "C-" } : c));
  const w = runAudit(weak, DATA, { asOf: AS_OF });
  assert.equal(req(w, "gpaBarSkills").status, "projected"); // LWELB 900 is enrolled for Spring 2027 in the sample
  assert.equal(req(w, "goodStanding").status, "open");
  const w2 = runAudit(weak.filter((c) => c.code !== "LWELB 900"), DATA, { asOf: AS_OF });
  assert.equal(req(w2, "gpaBarSkills").status, "open");
});

test("GPA: within 0.05 of a threshold gives no verdict and points to the official figure (A14)", () => {
  // All graded courses at B- (2.67): reconstructed GPA 2.67, within 0.05 of 2.70.
  const nearRecord = sample().courses.map((c) => (c.grade && c.grade !== "W" && c.grade !== "CR" ? { ...c, grade: "B-" } : c));
  const withBar = runAudit(nearRecord, DATA, { asOf: AS_OF });
  assert.ok(Math.abs(withBar.gpa.gpa - 2.67) < 0.01);
  assert.equal(req(withBar, "gpaBarSkills").status, "projected"); // LWELB 900 enrolled covers it either way
  assert.ok(req(withBar, "gpaBarSkills").verify.some((v) => /official GPA/.test(v)));
  const noBar = runAudit(nearRecord.filter((c) => c.code !== "LWELB 900"), DATA, { asOf: AS_OF });
  assert.equal(req(noBar, "gpaBarSkills").status, "confirm");
  assert.ok(req(noBar, "gpaBarSkills").verify.some((v) => /official GPA/.test(v)));
  // Good standing: all C (2.00) sits exactly on the 2.0 line → confirm, not met
  const onLine = sample().courses.map((c) => (c.grade && c.grade !== "W" && c.grade !== "CR" ? { ...c, grade: "C" } : c));
  const gs = runAudit(onLine, DATA, { asOf: AS_OF });
  assert.equal(req(gs, "goodStanding").status, "confirm");
  assert.ok(req(gs, "goodStanding").verify.some((v) => /official GPA/.test(v)));
});

// ---------------------------------------------------------------- planner: verified Spring 2027 sections
test("planner: Spring 2027 options come from the LionPATH section list with real codes and sections", () => {
  // Sample student minus the 303(c) courses and the enrolled Spring 2027 rows: 303(c) is open.
  const courses = sample().courses.filter((c) => !["LWELA 964", "LWELB 954"].includes(c.code) && c.term !== "Spring 2027");
  const r = runAudit(courses, DATA, { asOf: AS_OF });
  assert.equal(req(r, "aba303c").status, "open");
  const p = r.planner;
  assert.equal(p.source, "lionpath");
  assert.deepEqual(p.terms, ["Spring 2027"]);
  assert.equal(p.readOn, "2026-11-04");
  const codes = p.suggestions.map((s) => `${s.code}-${s.section}`);
  assert.ok(codes.includes("LWELA 964-201"), "Employment Discrimination (UP list)");
  assert.ok(codes.includes("LWELA 963-201"), "Con Law II (UP list)");
  assert.ok(codes.includes("LWEXP 997-205"), "Trauma Informed Lawyering (DL list, experiential excess)");
  const ed = p.suggestions.find((s) => s.code === "LWELA 964");
  assert.ok(ed.reasons.includes("ABA 303(c) – UP list"));
  assert.equal(ed.credits, 3);
  assert.match(ed.meets, /T Th 11:15/);
  const ti = p.suggestions.find((s) => s.code === "LWEXP 997" && s.section === "205");
  assert.ok(ti.reasons.includes("ABA 303(c) – DL list only"));
  assert.equal(ti.status, "Waitlist");
  // Already-taken numbered courses never reappear (Evidence is on the sample record, Spring 2026)
  assert.ok(!codes.includes("LWELA 955-201"));
  // Hidden by default: the 7 clinic/externship/independent-study lines (enrollment opened 10/26/2026)
  assert.equal(p.hiddenApplicationOnly, 7);
});

test("planner: clinics are hidden once enrollment opened, and shown with includeApplicationOnly", () => {
  // Experiential open: drop every LWEXP/LWCLI row from the sample.
  const courses = sample().courses.filter((c) => !/^(LWEXP|LWCLI)/.test(c.code) && c.term !== "Spring 2027");
  const r = runAudit(courses, DATA, { asOf: AS_OF });
  assert.equal(req(r, "experiential").status, "open");
  const hidden = r.planner;
  assert.ok(hidden.hiddenApplicationOnly >= 5, `hidden ${hidden.hiddenApplicationOnly}`);
  assert.ok(!hidden.suggestions.some((s) => s.application), "no clinic/externship rows by default");
  assert.ok(hidden.suggestions.some((s) => s.code === "LWEXP 975"), "Litigation Skills is a self-enrolled experiential option");
  const shown = runAudit(courses, DATA, { asOf: AS_OF, includeApplicationOnly: true }).planner;
  assert.equal(shown.hiddenApplicationOnly, 0);
  const cl = shown.suggestions.find((s) => s.code === "LWCLI 905");
  assert.ok(cl && cl.application && cl.applicationClosed);
  assert.ok(cl.reasons.includes("Experiential"));
  // Before enrollment opened (Oct 1, 2026) clinics are not hidden
  const early = runAudit(courses, DATA, { asOf: new Date(2026, 9, 1) }).planner;
  assert.equal(early.hiddenApplicationOnly, 0);
  assert.ok(early.suggestions.some((s) => s.code === "LWCLI 905"));
});

test("planner: falls back to the course chart when no verified list covers the term", () => {
  const noOfferings = { ...DATA, offerings: [] };
  const r = runAudit(sample().courses.filter((c) => c.term !== "Spring 2027"), noOfferings, { asOf: AS_OF });
  assert.equal(r.planner.source, "chart");
  assert.ok(r.planner.suggestions.length > 0);
});

test("offerings data: every section has a code, section, class number (or a pending note) and a credit value or a reason", () => {
  for (const s of offeringsSpring2027.sections) {
    assert.match(s.code, /^LW[A-Z]{3} \d{3}$/, s.code);
    assert.match(s.section, /^\d{3}(-\d{3})?$/, `${s.code} section`);
    if (s.classNbr === null) assert.match(s.note ?? "", /not yet read from LionPATH/, `${s.code}-${s.section} pending class number needs a note`);
    else assert.match(s.classNbr, /^\d{5}$/, `${s.code} class number`);
    assert.ok(s.credits != null || s.creditsSource, `${s.code}-${s.section} credits`);
    assert.equal(s.application, ["LWCLI", "LWEXT", "LWINP"].includes(s.code.split(" ")[0]));
  }
  assert.equal(offeringsSpring2027.sections.filter((s) => s.code === "LWELA 997").length, 6);
  assert.equal(offeringsSpring2027.sections.filter((s) => s.code === "LWEXP 997").length, 6);
  assert.equal(offeringsSpring2027.sections.filter((s) => s.code === "LWSEM 997").length, 3);
});

// ---------------------------------------------------------------- legacy (pre-reunification) codes
test("legacy catalog: first-year PSLFY codes resolve to their official titles and credits", () => {
  const r = auditSample();
  const civ = r.courses.find((c) => c.code === "PSLFY 900");
  assert.equal(civ.title, "Civil Procedure"); // transcript prints "CIVIL PROCEDURE"
  assert.equal(civ.inCatalog, true);
  assert.equal(civ.legacy, true);
  assert.equal(r.courses.find((c) => c.code === "LWELA 903").legacy, false);
  assert.equal(r.courses.find((c) => c.code === "LWELA 903").inCatalog, true);
  // every checklist 1L course exists in the archive with the same credits
  const byCode = new Map(legacy.courses.map((c) => [c.code, c]));
  for (const c of [...rules.FIRST_YEAR_COURSES.fall, ...rules.FIRST_YEAR_COURSES.spring]) {
    assert.equal(byCode.get(c.code)?.minCredits, c.credits, `${c.code} credits`);
  }
  // the old upper-level codes LionPATH's audit lines name are there too
  for (const code of ["PRORP 934", "BAREX 900", "AULWR 997", "ULWR 997", "EXPR 937"]) assert.ok(byCode.has(code), code);
  assert.ok(legacy.courses.length > 200);
});

test("legacy catalog: a current code is never shadowed by a legacy one; unknown codes stay unknown", () => {
  const p = sample();
  p.courses.push({ term: "Fall 2025", subject: "PRORP", number: "934", code: "PRORP 934", description: "Prof Resp", topic: null, attempted: 3, earned: 3, grade: "B", line: 98 });
  p.courses.push({ term: "Fall 2025", subject: "ZZZZ", number: "999", code: "ZZZZ 999", description: "Mystery", topic: null, attempted: 1, earned: 1, grade: "B", line: 99 });
  const r = runAudit(p.courses, DATA, { asOf: AS_OF });
  const pr = r.courses.find((c) => c.code === "PRORP 934");
  assert.equal(pr.title, "Professional Responsibility");
  assert.equal(pr.legacy, true);
  assert.ok(pr.eligible.pr); // the pr rule lists both PRORP 934 and LWREQ 934
  const zz = r.courses.find((c) => c.code === "ZZZZ 999");
  assert.equal(zz.inCatalog, false);
  assert.equal(zz.title, "Mystery");
  // the picker offers legacy codes, but not the PSLFY block (added separately)
  const pick = manual.pickableCourses(DATA);
  assert.ok(pick.some((c) => c.code === "PRORP 934" && c.legacy));
  assert.ok(!pick.some((c) => c.subject === "PSLFY"));
});

test("catalog builder reads an archived subject index", () => {
  const base = "https://bulletins.psu.edu/archive/2024-2025/university-course-descriptions/pennstatelaw/";
  const html = `<a href="/archive/2024-2025/university-course-descriptions/pennstatelaw/pslfy/">x</a>
    <a href="/archive/2024-2025/university-course-descriptions/pennstatelaw/prorp/">y</a>
    <a href="/archive/2024-2025/university-course-descriptions/">index</a>`;
  assert.deepEqual(parseSubjectIndex(html, base), ["prorp", "pslfy"]);
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
