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
const KINDS = new Set(["totalCredits", "residency", "allOf", "oneCourse", "credits", "attestation"]);
for (const r of rules.REQUIREMENTS) {
  if (!KINDS.has(r.kind)) errors.push(`Requirement ${r.id}: unknown kind "${r.kind}"`);
  if (r.list && !["seminar", "aba303c"].includes(r.list)) errors.push(`Requirement ${r.id}: unknown list "${r.list}"`);
  if (!rules.SOURCES[r.source]) errors.push(`Requirement ${r.id}: unknown source "${r.source}"`);
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
for (const e of lists.aba303c.courses) note("303(c) list", e.title);
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
