#!/usr/bin/env node
/**
 * build-catalog.mjs — snapshot every Penn State Dickinson Law course from the public Penn State
 * University Bulletin into grad-audit/data/catalog.js.
 *
 * WHY THIS EXISTS
 *   Students' transcripts abbreviate titles ("Energy Lw and Pol", "Bus Pln for MA I"). The audit
 *   engine therefore never matches on transcript titles directly: it looks the course CODE up in
 *   this catalog to get the official title, credits and the requirement the bulletin says it meets,
 *   and matches requirement / concentration lists against that.
 *
 * WHAT IT DOES
 *   1. Downloads one public page per post-merger law subject (list below) from bulletins.psu.edu.
 *   2. Pulls out each course block: code, title, credits, description.
 *   3. Tags a course when its bulletin description says it satisfies a requirement
 *      ("This course satisfies the upper-level writing seminar requirement." etc.).
 *   4. Writes data/catalog.js (an ES module: export default {…}), sorted by code, with the snapshot date.
 *
 * WHEN TO RUN IT
 *   By hand, when the bulletin changes (new courses, renumbering). It is NEVER run by the web page —
 *   the page only imports the data module this produces. Review the git diff of catalog.js after
 *   running it; that diff is the list of catalog changes.
 *
 *   Usage:  node grad-audit/tools/build-catalog.mjs
 *   Needs:  Node 18+ (built-in fetch). No npm packages.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BASE = "https://bulletins.psu.edu/university-course-descriptions/law/";

// Post-merger Penn State Dickinson Law subjects (Bulletin, "Law" course descriptions index).
// Legacy Carlisle subjects (CORE, SEM, SKILS, TAX, …) are deliberately excluded: no Class of 2027
// University Park student has them on a transcript. The old University Park subjects that LionPATH's
// audit still expects (PRORP, ULWR, EXPR) no longer appear in the Bulletin at all.
const SUBJECTS = {
  LWCLI: "Clinics",
  LWCUR: "Co-Curricular Activities",
  LWELA: "Electives",
  LWELB: "Electives",
  LWEXP: "Experiential Learning",
  LWEXT: "Externships",
  LWINP: "Independent Study",
  LWREQ: "Required",
  LWSAB: "Study Abroad",
  LWSEM: "Seminars",
  LWVIS: "Visiting Away",
};

// Sentences in bulletin descriptions that state which graduation requirement a course meets.
// Each pattern → the requirement id used in rules.json. Kept loose on purpose ("upper-level" vs
// "upper level"); a false positive would show up in the catalog.js diff for review.
const DESCRIPTION_TAGS = [
  [/satisf\w* the upper[- ]level writing (seminar )?requirement/i, "seminar"],
  [/satisf\w* the experiential (learning )?requirement/i, "experiential"],
  [/303\s*\(c\)|civil rights, equal protection,? (and|or) social justice/i, "aba303c"],
];

/** Decode the handful of HTML entities the bulletin uses, and strip tags. */
function text(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#39;|&rsquo;|&#8217;/g, "'").replace(/&quot;/g, '"')
    .replace(/&nbsp;|&#160;/g, " ").replace(/&ndash;|&#8211;/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse one subject page.
 * @param {string} html  Raw page HTML.
 * @returns {Array<{code:string,subject:string,number:string,title:string,credits:string,
 *                  minCredits:number|null,maxCredits:number|null,tags:string[],description:string}>}
 */
export function parseSubjectPage(html) {
  const courses = [];
  // Every course is a <div class="courseblock"> … ; split on that marker rather than parsing the
  // whole DOM (no dependencies, and the markup is generated, so it is regular).
  for (const block of html.split('<div class="courseblock">').slice(1)) {
    // e.g. <div class="course_codetitle">LWSEM 901: Child Welfare Seminar</div>
    const head = block.match(/class="course_codetitle">\s*([A-Z]{3,6})\s+(\d{3}[A-Z]?):\s*([\s\S]*?)<\/div>/);
    if (!head) continue;
    // e.g. <div class="course_credits"> 2 Credits </div>   or  "1-5 Credits" / "2-3 Credits"
    const cr = block.match(/class="course_credits">([\s\S]*?)<\/div>/);
    // Keep only the number part: "2 Credits" → "2"; "2-12 Credits/Maximum of 12" → "2-12".
    const creditsText = cr ? text(cr[1]).split(/\s*Credits?\b/i)[0].trim() : "";
    const range = creditsText.match(/^(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/);
    const desc = block.match(/class="courseblockdesc">([\s\S]*?)<\/div>/);
    const description = desc ? text(desc[1]) : "";
    const [, subject, number, rawTitle] = head;
    courses.push({
      code: `${subject} ${number}`,
      subject,
      number,
      title: text(rawTitle),
      credits: creditsText,                       // as printed, e.g. "3", "2-3", "1-5"
      minCredits: range ? Number(range[1]) : null,
      maxCredits: range ? Number(range[2] ?? range[1]) : null,
      tags: DESCRIPTION_TAGS.filter(([re]) => re.test(description)).map(([, tag]) => tag),
      description,
    });
  }
  return courses;
}

// Comment block written at the top of the generated data/catalog.js.
const HEADER = `/**
 * data/catalog.js: GENERATED by tools/build-catalog.mjs from the public Penn State University
 * Bulletin. Do not edit by hand; re-run the script and review the diff.
 *
 * One entry per course: code, subject, number, official title, credits as printed ("3", "2-3"),
 * min/max credits, tags (requirements the Bulletin description itself says the course satisfies)
 * and the description. Requirement lists maintained by the law school (seminar list, 303(c) list,
 * concentrations) are separate files in this folder.
 */
`;

async function main() {
  const all = [];
  for (const subject of Object.keys(SUBJECTS)) {
    const url = `${BASE}${subject.toLowerCase()}/`;
    const res = await fetch(url, { headers: { "User-Agent": "grad-audit catalog snapshot" } });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const courses = parseSubjectPage(await res.text());
    console.log(`${subject.padEnd(6)} ${String(courses.length).padStart(3)} courses`);
    all.push(...courses);
  }
  all.sort((a, b) => a.code.localeCompare(b.code));
  const out = {
    source: BASE,
    snapshot: new Date().toISOString().slice(0, 10),
    subjects: SUBJECTS,
    courses: all,
  };
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = path.join(here, "..", "data", "catalog.js");
  await writeFile(file, HEADER + "export default " + JSON.stringify(out, null, 1) + ";\n");
  console.log(`wrote ${all.length} courses → ${path.relative(process.cwd(), file)}`);
}

// Run only when executed directly (the test file imports parseSubjectPage).
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
