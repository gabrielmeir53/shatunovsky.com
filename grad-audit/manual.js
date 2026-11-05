/**
 * manual.js: the "pick your courses" input path. Turns the student's selections on the page into
 * the same Course records that parser.js produces from a LionPATH PDF, so engine.js audits both the
 * same way.
 *
 * WHY IT EXISTS
 *   Not every student has the LionPATH PDF at hand, and the PDF layouts can change. This module lets
 *   a student (or an advisor) rebuild a record by hand: the ten first-year courses in one step, then
 *   each upper-level course chosen from the Bulletin catalog with its term, credits and grade.
 *
 * PURE MODULE: no DOM, no network, no storage. app.js owns the form; this file owns the data shape.
 * The tests exercise it directly.
 *
 * GRADES
 *   A student may enter the letter grade, or leave it as "P" (SELF_REPORTED_GRADE in rules.js):
 *   "completed with a C or better, grade not entered". P satisfies the C-or-better rules and earns
 *   the credits (ASSUMPTION A12) but carries no quality points, so the GPA-based checks report
 *   "unknown" until letter grades are given. "In progress / enrolled" leaves the grade empty, and
 *   engine.js decides in-progress vs enrolled from the term (A3).
 */

/** Grades that earn no credit. Same set as parser.js (kept local so this module imports nothing). */
const NO_CREDIT_GRADES = new Set(["W", "WN", "WF", "LD", "F", "NC", "I", "NR"]);

/**
 * Choices for the grade select, in display order. `value: ""` means "no grade yet".
 * Built from rules.GRADE_ORDER so the two never drift apart.
 * @param {object} rules  the rules.js module
 */
export function gradeChoices(rules) {
  return [
    { value: rules.SELF_REPORTED_GRADE, label: "Completed, C or better (grade not entered)" },
    ...rules.GRADE_ORDER.map((g) => ({ value: g, label: g })),
    { value: "CR", label: "CR (credit, no grade)" },
    { value: "W", label: "W (withdrawn)" },
    { value: "", label: "In progress / enrolled (no grade yet)" },
  ];
}

/**
 * Fall/Spring/Summer terms from the student's first fall through the sixth fall/spring semester.
 * Fall 2024 → Fall 2024, Spring 2025, Summer 2025, Fall 2025, Spring 2026, Summer 2026, Fall 2026, Spring 2027.
 * @param {number} startYear  year of the student's first fall semester
 * @returns {string[]}
 */
export function termList(startYear) {
  const out = [];
  for (let y = 0; y < 3; y++) {
    out.push(`Fall ${startYear + y}`, `Spring ${startYear + y + 1}`);
    if (y < 2) out.push(`Summer ${startYear + y + 1}`);
  }
  return out;
}

/**
 * Picks for the ten first-year courses (rules.FIRST_YEAR_COURSES), Fall of `startYear` and the
 * following Spring. `grades` may give a letter grade per code; otherwise the self-reported "P".
 * @returns {Pick[]}
 */
export function firstYearPicks(startYear, rules, grades = {}) {
  const mk = (term) => (c) => ({
    code: c.code,
    title: c.title,
    term,
    credits: c.credits,
    grade: grades[c.code] ?? rules.SELF_REPORTED_GRADE,
    topic: null,
    firstYear: true,
  });
  return [
    ...rules.FIRST_YEAR_COURSES.fall.map(mk(`Fall ${startYear}`)),
    ...rules.FIRST_YEAR_COURSES.spring.map(mk(`Spring ${startYear + 1}`)),
  ];
}

/**
 * Courses a student can pick: every catalog course, with the credit value the picker should
 * prefill (the minimum of a range, e.g. "1-5" → 1) and whether it is a Special Topics number
 * (then the picker asks for the topic, A9). `search` is the lower-cased text the filter box matches.
 * @param {object} data  { rules, catalog }
 */
export function pickableCourses(data) {
  const { rules, catalog, legacy } = data;
  const current = new Set(catalog.courses.map((c) => c.code));
  const row = (c, isLegacy) => ({
    code: c.code,
    subject: c.subject,
    title: c.title,
    credits: c.credits,
    defaultCredits: c.minCredits,
    variableCredits: c.minCredits !== c.maxCredits,
    specialTopics: rules.SPECIAL_TOPICS_TITLE.test(c.title),
    legacy: isLegacy, // pre-reunification code from the 2024-25 Bulletin archive
    search: `${c.code} ${c.title}`.toLowerCase(),
  });
  return [
    ...catalog.courses.map((c) => row(c, false)),
    // Legacy codes come after the current ones in search results; first-year PSLFY courses are
    // excluded because the picker adds them as a block (firstYearPicks).
    ...(legacy?.courses ?? []).filter((c) => !current.has(c.code) && !rules.FIRST_YEAR_SUBJECTS.includes(c.subject)).map((c) => row(c, true)),
  ];
}

/**
 * Suggested topics for a Special Topics course: every title on the seminar lists, both 303(c) lists,
 * and course-chart rows whose name is not a catalog title (those are taught under Special Topics
 * numbers). Free text is still allowed; these only feed the datalist.
 * @param {object} data  { catalog, lists, chart }
 */
export function topicSuggestions(data) {
  const { catalog, lists, chart } = data;
  const catalogTitles = new Set(catalog.courses.map((c) => c.title.toLowerCase()));
  const titles = new Set();
  for (const e of [...lists.seminar.currentLWSEM, ...lists.seminar.formerUniversityParkULWR]) titles.add(e.title);
  for (const e of [...lists.aba303c.universityPark.courses, ...lists.aba303c.courses]) titles.add(e.title);
  for (const e of lists.experiential.universityParkLWEXP) titles.add(e.title);
  for (const r of chart.rows) if (!catalogTitles.has(r.name.toLowerCase())) titles.add(r.name);
  return [...titles].filter((t) => !/^selected non-law/i.test(t)).sort((a, b) => a.localeCompare(b));
}

/**
 * @typedef {Object} Pick   one row of the picker
 * @property {string} code        "LWSEM 997"
 * @property {string} title       catalog title (or the student's title for a course not in the catalog)
 * @property {string} term        "Fall 2025"
 * @property {number} credits     credits for this enrollment
 * @property {string} grade       letter grade, "CR", "W", "P" (self-reported C or better) or "" (no grade yet)
 * @property {string|null} topic  topic for Special Topics numbers
 */

/**
 * Build Course records (the parser.js shape) from picks. Rows with problems are skipped and reported
 * in `warnings`, so the audit never silently counts a half-filled row.
 * @param {Pick[]} picks
 * @returns {{format:"manual", courses:object[], terms:string[], warnings:string[]}}
 */
export function buildManualCourses(picks) {
  const courses = [];
  const warnings = [];
  const seen = new Map(); // "term|code|topic" → count, to catch accidental duplicates
  picks.forEach((p, i) => {
    const label = `${p.code || "(no code)"} ${p.title || ""}`.trim();
    const m = /^([A-Z]{2,6})\s+(\d{3}[A-Z]?)$/.exec(String(p.code || "").trim().toUpperCase());
    if (!m) { warnings.push(`Row ${i + 1} (${label}): the course code must look like "LWELA 903".`); return; }
    if (!/^(Fall|Spring|Summer) \d{4}$/.test(p.term || "")) { warnings.push(`Row ${i + 1} (${label}): choose a term.`); return; }
    const credits = Number(p.credits);
    if (!Number.isFinite(credits) || credits <= 0 || credits > 17) { warnings.push(`Row ${i + 1} (${label}): credits must be between 0.5 and 17.`); return; }
    const grade = p.grade ? String(p.grade).trim().toUpperCase() : null;
    const topic = p.topic ? String(p.topic).trim() : null;
    const key = `${p.term}|${m[1]} ${m[2]}|${topic ?? ""}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if (seen.get(key) > 1) warnings.push(`Row ${i + 1} (${label}): listed more than once in ${p.term}; both rows are counted.`);
    courses.push({
      term: p.term,
      subject: m[1],
      number: m[2],
      code: `${m[1]} ${m[2]}`,
      description: p.title || `${m[1]} ${m[2]}`,
      topic,
      attempted: credits,
      earned: grade && !NO_CREDIT_GRADES.has(grade) ? credits : 0,
      grade,
      line: i + 1,
    });
  });
  const terms = [...new Set(courses.map((c) => c.term))];
  if (!courses.length) warnings.push("No courses yet. Add your first-year courses and at least one upper-level course, then run the audit.");
  return { format: "manual", courses, terms, warnings };
}
