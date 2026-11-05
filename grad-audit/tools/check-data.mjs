#!/usr/bin/env node
/**
 * check-data.mjs: consistency report for the data files. Run it after editing rules.js or any
 * file in data/, or after re-running build-catalog.mjs.
 *
 *   node grad-audit/tools/check-data.mjs
 *
 * ERRORS (exit code 1):
 *   - a TITLE_ALIASES target that isn't a catalog title (unless marked specialTopic)
 *   - a requirement with an unknown `kind` or a `list` that doesn't exist
 * INFORMATION (exit code 0):
 *   - list entries (concentrations, seminar, 303(c), course chart) that match no catalog course.
 *     These are normal for Special Topics courses and discontinued courses: they can still match a
 *     student's transcript by topic/description. Review the list for typos and true renames; a
 *     rename belongs in rules.js TITLE_ALIASES.
 */
import * as rules from "../rules.js";
import catalog from "../data/catalog.js";
import lists from "../data/intranet-lists.js";
import concentrations from "../data/concentrations.js";
import chart from "../data/course-chart.js";
import { normalizeTitle, entryKeys, parseQualifiers } from "../match.js";

const aliases = Object.fromEntries(rules.TITLE_ALIASES.map((a) => [normalizeTitle(a.from), normalizeTitle(a.to)]));
const catalogKeys = new Set(catalog.courses.map((c) => normalizeTitle(c.title)));
const errors = [];

for (const a of rules.TITLE_ALIASES) {
  if (!a.specialTopic && !catalogKeys.has(normalizeTitle(a.to))) errors.push(`Alias target not in catalog: "${a.to}" (from "${a.from}")`);
  if (!a.note) errors.push(`Alias without a note: "${a.from}"`);
}
const KINDS = new Set(["totalCredits", "residency", "allOf", "oneCourse", "credits", "attestation", "gpaCondition", "gpaMinimum"]);
const LISTS = ["seminar", "aba303c", "aba303cUP"];
for (const r of rules.REQUIREMENTS) {
  if (!KINDS.has(r.kind)) errors.push(`Requirement ${r.id}: unknown kind "${r.kind}"`);
  if (r.list && !LISTS.includes(r.list)) errors.push(`Requirement ${r.id}: unknown list "${r.list}"`);
  if (r.primaryList && !LISTS.includes(r.primaryList)) errors.push(`Requirement ${r.id}: unknown primaryList "${r.primaryList}"`);
  if (!rules.SOURCES[r.source]) errors.push(`Requirement ${r.id}: unknown source "${r.source}"`);
}
// The University Park 303(c) list must be a subset of the unified list (A13 relies on this: a course
// is "UP" or "DL only", never "UP only"). If the Intranet changes that, the engine still works, but
// the wording on the page ("DL list only") would need a look.
{
  const unified = new Set(lists.aba303c.courses.flatMap((e) => entryKeys(e.title, aliases)));
  for (const e of lists.aba303c.universityPark.courses) {
    if (!entryKeys(e.title, aliases).some((k) => unified.has(k))) errors.push(`303(c): UP-list entry "${e.title}" is not on the unified list (add it there, or an alias in rules.js)`);
  }
}
// Every first-year course in rules.FIRST_YEAR_COURSES must be one the 1L requirements expect, and vice versa.
{
  const expected = new Set(rules.REQUIREMENTS.filter((r) => r.kind === "allOf").flatMap((r) => r.codes));
  const listed = new Set([...rules.FIRST_YEAR_COURSES.fall, ...rules.FIRST_YEAR_COURSES.spring].map((c) => c.code));
  for (const c of expected) if (!listed.has(c)) errors.push(`FIRST_YEAR_COURSES is missing ${c}`);
  for (const c of listed) if (!expected.has(c)) errors.push(`FIRST_YEAR_COURSES lists ${c}, which no 1L requirement expects`);
}

// Which list entries don't resolve to a catalog course?
const unmatched = new Map(); // entry → set of where it appears
const note = (where, entry) => {
  if (parseQualifiers(entry).llmOnly) return;
  if (entryKeys(entry, aliases).some((k) => catalogKeys.has(k))) return;
  if (!unmatched.has(entry)) unmatched.set(entry, new Set());
  unmatched.get(entry).add(where);
};
for (const c of concentrations.concentrations) for (const e of [...c.courses, ...c.clinics]) note(`concentration: ${c.name}`, e);
for (const e of lists.seminar.currentLWSEM) note("seminar list (current LWSEM)", e.title);
for (const e of lists.aba303c.courses) note("303(c) list (unified)", e.title);
for (const e of lists.aba303c.universityPark.courses) note("303(c) list (University Park)", e.title);
for (const e of [...lists.experiential.clinics, ...lists.experiential.universityParkLWEXP]) note("experiential list (University Park)", e.title);
for (const [k, s] of Object.entries(rules.SOURCES)) if (!s.label || !s.url || !s.note) errors.push(`SOURCES.${k} needs label, url and note`);
for (const r of chart.rows) if (r.prefix !== "LWLLM") note(`course chart (${r.prefix})`, r.name);

console.log(`Catalog: ${catalog.courses.length} courses, snapshot ${catalog.snapshot}`);
console.log(`Aliases: ${rules.TITLE_ALIASES.length}   Requirements: ${rules.REQUIREMENTS.length}   Concentrations: ${concentrations.concentrations.length}`);
console.log(`\nList entries with no catalog course of their own (${unmatched.size}). Normal for Special Topics and`);
console.log("discontinued courses, which match by the topic on a transcript; check for typos and renames:\n");
for (const [entry, where] of [...unmatched].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`  ${entry}\n      ${[...where].slice(0, 3).join("; ")}${where.size > 3 ? `; +${where.size - 3} more` : ""}`);
}
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✖ ${e}`);
  process.exit(1);
}
console.log("\nNo errors.");
