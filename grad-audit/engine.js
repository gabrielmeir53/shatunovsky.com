/**
 * engine.js: the graduation audit itself. Pure functions: courses in, audit result out.
 *
 * INPUT  : Course[] from parser.js, plus the data modules (rules.js, data/*.js) and an `asOf` date.
 * OUTPUT : AuditResult (see runAudit) — requirement statuses, which course satisfies each one, the
 *          LionPATH audit lines that disagree, credit/residency totals, caps, concentration progress.
 *
 * NO DOM, NO NETWORK, NO STORAGE. Every number the audit uses comes from rules.js or the data files;
 * this file only interprets them. Judgment calls are marked "ASSUMPTION An" and listed, with the same
 * ids, in rules.js ASSUMPTIONS and IT-HANDOFF.md.
 */
import { normalizeTitle, titleKey, indexEntries, entryKeys } from "./match.js";

// ASSUMPTION A3: approximate first day of each term, used only to decide "in progress" (term has
// started) vs "enrolled" (term in the future) for courses without a grade. Month is 0-based.
export const TERM_START = { Spring: [0, 5], Summer: [4, 15], Fall: [7, 15] };

/** Sortable number for a term: "Spring 2027" → 2027.1, "Summer 2027" → 2027.2, "Fall 2027" → 2027.3 */
export function termOrder(term) {
  const [season, year] = term.split(" ");
  return Number(year) + { Spring: 0.1, Summer: 0.2, Fall: 0.3 }[season];
}

/** Date a term starts (ASSUMPTION A3). */
export function termStartDate(term) {
  const [season, year] = term.split(" ");
  const [m, d] = TERM_START[season];
  return new Date(Number(year), m, d);
}

/**
 * Status of one course.
 *   "done"       : has a grade (any grade; whether it MEETS a minimum is gradeMeets()'s job)
 *   "withdrawn"  : W / WN / WF / LD — no credit, satisfies nothing (A11)
 *   "inProgress" : no grade, term already started (A3)
 *   "enrolled"   : no grade, term starts after asOf (A3)
 * @param {import("./parser.js").Course} c
 * @param {Date} asOf
 */
export function courseStatus(c, asOf) {
  if (c.grade && /^W|^LD$/.test(c.grade)) return "withdrawn";
  if (c.grade) return "done";
  return termStartDate(c.term) <= asOf ? "inProgress" : "enrolled";
}

/**
 * Does a grade meet a minimum like "C"?
 *   - letter grades: compare positions in GRADE_ORDER ("C+" meets "C"; "C-" does not)
 *   - "CR": meets it, but the caller flags it "verify" (ASSUMPTION A2)
 *   - null (no grade yet): returns "pending" — counts as projected, not done
 *   - anything else (F, NC, I, NR, W…): does not meet it (A11)
 * @returns {true|false|"pending"}
 */
export function gradeMeets(grade, minGrade, gradeOrder) {
  if (grade == null) return "pending";
  if (grade === "CR") return true;
  if (grade === "P") return true; // self-reported "C or better" from the manual picker (ASSUMPTION A12)
  const g = gradeOrder.indexOf(grade);
  const m = gradeOrder.indexOf(minGrade);
  return g !== -1 && m !== -1 && g <= m && grade !== "F";
}

/**
 * Credits a course is worth for totals. Earned credits once graded; attempted credits while in
 * progress/enrolled (projected). Withdrawn and failed courses are worth 0.
 */
function creditValue(c) {
  if (c.status === "withdrawn") return 0;
  if (c.status === "done") return c.earned;
  return c.attempted;
}

/**
 * Every title key a STUDENT's course can match a list on (ASSUMPTION A9):
 *   - the official catalog title for its code (unless the catalog title is just "Special Topics")
 *   - the "Course Topic:" from the transcript, if any
 *   - the transcript description, but ONLY for Special Topics codes or codes missing from the
 *     catalog — elsewhere the transcript abbreviates ("Energy Lw and Pol") and the catalog title wins.
 */
export function courseTitleKeys(c, catalogByCode, aliases, specialTopicsRe) {
  const cat = catalogByCode.get(c.code);
  const keys = new Set();
  const generic = !cat || specialTopicsRe.test(cat.title);
  if (cat && !generic) keys.add(titleKey(cat.title, aliases));
  if (c.topic) keys.add(titleKey(c.topic, aliases));
  if (generic && !specialTopicsRe.test(c.description)) keys.add(titleKey(c.description, aliases));
  keys.delete("");
  return keys;
}

/** Best display title for a course: topic, then catalog title, then transcript text. */
function displayTitle(c, catalogByCode, specialTopicsRe) {
  const cat = catalogByCode.get(c.code);
  if (c.topic) return c.topic;
  if (cat && !specialTopicsRe.test(cat.title)) return cat.title;
  return c.description;
}

/**
 * Which exclusive requirements (seminar / 303(c) / experiential) a course is ELIGIBLE for, by the
 * rules in rules.js — before deciding which one it is actually used for.
 *
 * @returns {{reason:string, via:string|null}|null}
 *   reason: human-readable basis ("subject LWSEM", "Intranet list: …")
 *   via:    which list matched when the rule has a `primaryList` (ASSUMPTION A13):
 *             "UP" = the cohort's University Park list, "DL" = only the unified Dickinson Law list.
 *           null for rules without a primary list.
 */
function eligibility(c, req, lists, catalogByCode, firstYearSubjects) {
  if (req.codes && req.codes.includes(c.code)) return { reason: `course ${c.code}`, via: null };
  if (req.subjects && req.subjects.includes(c.subject)) return { reason: `subject ${c.subject}`, via: null };
  if (req.catalogTag && catalogByCode.get(c.code)?.tags.includes(req.catalogTag)) return { reason: "Bulletin description", via: null };
  if (req.list) {
    if (req.excludeFirstYear && firstYearSubjects.includes(c.subject)) return null; // A4
    if (req.primaryList) {
      for (const k of c.titleKeys) if (lists[req.primaryList].has(k)) return { reason: `University Park 303(c) list: "${lists[req.primaryList].get(k)}"`, via: "UP" };
    }
    for (const k of c.titleKeys) {
      if (lists[req.list].has(k)) {
        return req.primaryList
          ? { reason: `unified Dickinson Law 303(c) list only: "${lists[req.list].get(k)}"`, via: "DL" }
          : { reason: `Intranet list: "${lists[req.list].get(k)}"`, via: null };
      }
    }
  }
  return null;
}

/**
 * GPA reconstruction (ASSUMPTION A14). Letter-graded courses only, weighted by credits attempted.
 * Also the cumulative GPA after each graded fall/spring term (for the good-standing rule) and the
 * number of F grades.
 * @returns {{gpa:number|null, units:number, unknown:number, fails:number, byTerm:Array<{term:string, cumulative:number}>}}
 *   unknown = graded courses whose grade has no point value (P, CR): with any of these the GPA is
 *   only partial, and with P grades present it is reported as unknown.
 */
export function gpaDetail(courses, gradePoints) {
  const graded = courses.filter((c) => c.status === "done");
  let points = 0, units = 0, unknown = 0, fails = 0;
  const byTerm = [];
  const terms = [...new Set(graded.map((c) => c.term))].filter((t) => /^(Fall|Spring) /.test(t)).sort((a, b) => termOrder(a) - termOrder(b));
  for (const term of terms) {
    for (const c of graded.filter((c) => c.term === term)) {
      if (c.grade === "F") fails++;
      if (c.grade in gradePoints) { points += gradePoints[c.grade] * c.attempted; units += c.attempted; }
      else unknown++;
    }
    if (units > 0) byTerm.push({ term, cumulative: points / units });
  }
  for (const c of graded.filter((c) => !/^(Fall|Spring) /.test(c.term))) {
    if (c.grade === "F") fails++;
    if (c.grade in gradePoints) { points += gradePoints[c.grade] * c.attempted; units += c.attempted; }
    else unknown++;
  }
  const selfReported = graded.some((c) => c.grade === "P");
  return { gpa: units > 0 && !selfReported ? points / units : null, units, unknown, fails, byTerm, selfReported };
}

/**
 * Assign seminar, 303(c) and experiential to courses without double counting (ASSUMPTION A5).
 *
 * The rule (Intranet): one course cannot satisfy two of these requirements. The Intranet adds that
 * "experiential coursework in excess of the 6-credit requirement may be applied toward 303(c)", i.e.
 * an experiential course MAY be the 303(c) course, but then it no longer counts toward the 6
 * experiential credits. Excluding the seminar and 303(c) courses from the experiential total below
 * implements exactly that.
 *
 * Candidate lists are short (a student has a handful of seminar / 303(c) / experiential courses), so
 * this tries every (seminar course, 303(c) course) pair, gives experiential every other eligible
 * course, and keeps the best assignment by, in order:
 *   1. most requirements satisfied, counting in-progress/enrolled courses;
 *   2. most requirements satisfied by completed courses with a qualifying grade;
 *   3. most experiential credits.
 * Courses whose grade is below the minimum are never candidates.
 *
 * @param {object[]} courses  normalized courses from runAudit (with .eligible, .meets, .credits)
 * @param {object[]} reqs     rules.js REQUIREMENTS
 * @returns {{seminar:object|null, aba303c:object|null, experiential:object[], expCredits:number, expDone:number}}
 */
export function assignExclusive(courses, reqs) {
  const exp = reqs.find((r) => r.id === "experiential");
  const usable = (c, id) => Boolean(c.eligible[id]) && c.meets[id] !== false;
  const completed = (c, id) => c.meets[id] === true; // graded, and grade meets the minimum
  const seminarOptions = [null, ...courses.filter((c) => usable(c, "seminar"))];
  const abaOptions = [null, ...courses.filter((c) => usable(c, "aba303c"))];
  const expPool = courses.filter((c) => usable(c, "experiential"));

  let best = null;
  for (const s of seminarOptions) {
    for (const a of abaOptions) {
      if (s && s === a) continue; // the same course can't be both the seminar and the 303(c) course
      const expUsed = expPool.filter((c) => c !== s && c !== a);
      const expCredits = expUsed.reduce((n, c) => n + c.credits, 0);
      const expDone = expUsed.filter((c) => completed(c, "experiential")).reduce((n, c) => n + c.credits, 0);
      const satisfied = (s ? 1 : 0) + (a ? 1 : 0) + (expCredits >= exp.min ? 1 : 0);
      const satisfiedDone =
        (s && completed(s, "seminar") ? 1 : 0) + (a && completed(a, "aba303c") ? 1 : 0) + (expDone >= exp.min ? 1 : 0);
      const score = [satisfied, satisfiedDone, expCredits];
      if (!best || compare(score, best.score) > 0) {
        best = { score, seminar: s, aba303c: a, experiential: expUsed, expCredits, expDone };
      }
    }
  }
  return best;
}

function compare(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

/**
 * Run the full audit.
 * @param {import("./parser.js").Course[]} rawCourses
 * @param {object} data   { rules, catalog, legacy, lists, concentrations, chart, offerings }  (the imported modules;
 *                        offerings = array of data/offerings-*.js, one per term with a verified LionPATH section list)
 * @param {object} [opts] { asOf: Date, profDevConfirmed: boolean, includeApplicationOnly: boolean }
 * @returns {AuditResult}
 */
export function runAudit(rawCourses, data, opts = {}) {
  const asOf = opts.asOf ?? new Date();
  const { rules, catalog, legacy, lists: listData, concentrations, chart } = data;
  const aliases = Object.fromEntries(rules.TITLE_ALIASES.map((a) => [normalizeTitle(a.from), normalizeTitle(a.to)]));
  // Current Bulletin first; then the archived 2024-25 Penn State Law catalog for pre-reunification
  // codes (PSLFY 1L courses, PRORP, ULWR, EXPR, BAREX…). A legacy entry never overrides a current one.
  const catalogByCode = new Map(catalog.courses.map((c) => [c.code, c]));
  const legacyCodes = new Set();
  for (const c of legacy?.courses ?? []) {
    if (!catalogByCode.has(c.code)) { catalogByCode.set(c.code, c); legacyCodes.add(c.code); }
  }
  const reqs = rules.REQUIREMENTS;

  // Requirement lists, indexed by title key.
  const lists = {
    seminar: indexEntries(
      [...listData.seminar.currentLWSEM, ...listData.seminar.formerCarlisle, ...listData.seminar.formerUniversityParkULWR].map((e) => e.title),
      aliases,
    ),
    aba303c: indexEntries(listData.aba303c.courses.map((e) => e.title), aliases),
    aba303cUP: indexEntries(listData.aba303c.universityPark.courses.map((e) => e.title), aliases),
  };

  // 1. Normalize courses: status, credits, title keys, eligibility, grade checks.
  const courses = rawCourses.map((rc) => {
    const c = { ...rc };
    c.status = courseStatus(c, asOf);
    c.credits = creditValue(c);
    c.title = displayTitle(c, catalogByCode, rules.SPECIAL_TOPICS_TITLE);
    c.titleKeys = courseTitleKeys(c, catalogByCode, aliases, rules.SPECIAL_TOPICS_TITLE);
    c.inCatalog = catalogByCode.has(c.code); // current Bulletin or the 2024-25 Penn State Law archive
    c.legacy = legacyCodes.has(c.code); // resolved through the archive (pre-reunification code)
    c.eligible = {}; // requirement id → reason string (or null)
    c.listVia = {}; // requirement id → "UP" | "DL" | null (which 303(c) list matched, A13)
    c.meets = {};
    for (const r of reqs.filter((r) => r.kind === "oneCourse" || r.kind === "credits")) {
      const e = c.status === "withdrawn" ? null : eligibility(c, r, lists, catalogByCode, rules.FIRST_YEAR_SUBJECTS);
      c.eligible[r.id] = e?.reason ?? null;
      c.listVia[r.id] = e?.via ?? null;
      c.meets[r.id] = gradeMeets(c.grade, r.minGrade, rules.GRADE_ORDER);
    }
    return c;
  });

  // 2. Exclusive assignment (seminar / 303(c) / experiential).
  const assignment = assignExclusive(courses.filter((c) => c.status !== "withdrawn"), reqs);

  // 3. Evaluate each requirement.
  const projectedTotal = courses.reduce((n, c) => n + c.credits, 0);
  const earnedTotal = courses.filter((c) => c.status === "done").reduce((n, c) => n + c.credits, 0);
  const gpa = gpaDetail(courses, rules.GRADE_POINTS);
  const results = reqs.map((r) => evaluate(r, { courses, assignment, earnedTotal, projectedTotal, opts, rules, gpa }));

  // 4. LionPATH discrepancies: requirement lines LionPATH can't satisfy (rules.js `lionpath`) for which
  //    this audit finds qualifying courses. For a credit requirement that includes a partial count
  //    (LionPATH shows 0 of 6 experiential credits; this audit may count 5).
  const auditErrors = results
    .filter((res) => res.requirement.lionpath && res.courses.length > 0)
    .map((res) => ({
      requirement: res.requirement.label,
      status: res.status,
      detail: res.detail,
      satisfiedBy: res.courses.map((c) => `${c.code} ${c.title}${c.grade ? ` (${c.grade}, ${c.term})` : ` (${c.term}, ${statusWord(c.status)})`}`),
      lionpathAccepts: res.requirement.lionpath.accepts,
      problem: res.requirement.lionpath.problem,
      fix: res.requirement.lionpath.fix,
    }));

  // 5. Residency detail, caps, concentrations.
  const residency = residencyDetail(courses, reqs.find((r) => r.kind === "residency"));
  const caps = checkCaps(courses, rules.CAPS);
  const conc = scoreConcentrations(courses, concentrations, aliases, rules.GRADE_ORDER);

  // 6. Overall status.
  const open = results.filter((r) => r.status === "open");
  const projected = results.filter((r) => r.status === "projected");
  const overCap = caps.filter((c) => c.checkable && c.total > c.max);
  const overall =
    open.length || overCap.length
      ? { state: "notOnTrack", blockers: [...open.map((r) => r.requirement.label), ...overCap.map((c) => `Over cap: ${c.label}`)] }
      : projected.length
        ? { state: "onTrack", blockers: [], pending: projected.map((r) => r.requirement.label) }
        : { state: "complete", blockers: [] };
  const lastTerm = [...new Set(courses.map((c) => c.term))].sort((a, b) => termOrder(a) - termOrder(b)).pop() ?? null;

  return {
    asOf,
    overall: { ...overall, lastTerm },
    totals: { earned: earnedTotal, projected: projectedTotal, inProgress: sumBy(courses, "inProgress"), enrolled: sumBy(courses, "enrolled") },
    gpa,
    requirements: results,
    auditErrors,
    residency,
    caps,
    concentrations: conc,
    courses,
    planner: planNext(courses, results, conc, concentrations, chart, data.offerings, catalogByCode, aliases, lists, asOf, { includeApplicationOnly: Boolean(opts.includeApplicationOnly) }),
  };
}

function sumBy(courses, status) {
  return courses.filter((c) => c.status === status).reduce((n, c) => n + c.credits, 0);
}

export function statusWord(s) {
  return { done: "completed", inProgress: "in progress", enrolled: "enrolled", withdrawn: "withdrawn" }[s] ?? s;
}

/**
 * Evaluate one requirement. Returns { requirement, status, courses, detail, verify, via }.
 *   status: "met"       — satisfied by completed courses with qualifying grades
 *           "projected" — will be satisfied if in-progress/enrolled courses finish with C or better
 *           "open"      — not satisfied even counting in-progress/enrolled courses
 *           "confirm"   — needs the student's confirmation (attestation), or letter grades (GPA lines)
 *   via:    for 303(c): "UP" (cohort's University Park list) or "DL" (unified Dickinson Law list
 *           only), shown on the page as "Met – UP" / "Met – DL" (A13); otherwise null.
 */
function evaluate(r, ctx) {
  const { courses, assignment, earnedTotal, projectedTotal, opts, gpa } = ctx;
  const base = { requirement: r, courses: [], detail: "", verify: [], via: null };
  // Anything the student should double-check: CR grades (A2) and self-reported "C or better" grades
  // from the course picker (A12). The page prints these next to the status pill.
  const verifyCR = (cs) => [
    ...(r.crAllowed ? [] : cs.filter((c) => c.grade === "CR").map((c) => `${c.code} has a CR grade (A2)`)),
    ...cs.filter((c) => c.grade === "P").map((c) => `${c.code} grade is self-reported, not from a transcript (A12)`),
  ];
  const g = (n) => n.toFixed(2);

  switch (r.kind) {
    case "totalCredits": {
      const status = earnedTotal >= r.min ? "met" : projectedTotal >= r.min ? "projected" : "open";
      return { ...base, status, detail: `${earnedTotal} earned + ${projectedTotal - earnedTotal} in progress/enrolled = ${projectedTotal} of ${r.min}` };
    }
    case "residency": {
      const res = residencyDetail(courses, r);
      const status = res.fullTimeDone >= r.semesters ? "met" : res.fullTimeProjected >= r.semesters ? "projected" : "open";
      return { ...base, status, detail: `${res.fullTimeDone} full-time semesters completed, ${res.fullTimeProjected} including current/enrolled terms, of ${r.semesters}` };
    }
    case "allOf": {
      const found = r.codes.map((code) => courses.find((c) => c.code === code && c.status !== "withdrawn"));
      const missing = r.codes.filter((_, i) => !found[i]);
      const got = found.filter(Boolean);
      const allDone = !missing.length && got.every((c) => c.status === "done" && c.earned > 0);
      return {
        ...base,
        courses: got,
        status: missing.length ? "open" : allDone ? "met" : "projected",
        detail: missing.length ? `Missing: ${missing.join(", ")}` : `${got.length} of ${r.codes.length} courses`,
        verify: got.some((c) => c.grade === "P") ? [`${got.filter((c) => c.grade === "P").length} of these grades are self-reported (A12)`] : [],
      };
    }
    case "oneCourse": {
      let c;
      if (r.exclusive) c = assignment?.[r.id] ?? null;
      else c = courses.find((x) => x.eligible[r.id] && x.meets[r.id] === true) ?? courses.find((x) => x.eligible[r.id] && x.meets[r.id] === "pending") ?? null;
      if (!c) {
        const below = courses.find((x) => x.eligible[r.id] && x.meets[r.id] === false);
        return { ...base, status: "open", detail: below ? `${below.code} ${below.title} qualifies but the grade (${below.grade}) is below ${r.minGrade}.` : "No qualifying course found." };
      }
      return {
        ...base,
        courses: [c],
        status: c.meets[r.id] === true ? "met" : "projected",
        detail: `${c.code} ${c.title}: qualifies by ${c.eligible[r.id]}`,
        verify: verifyCR([c]),
        via: c.listVia[r.id],
      };
    }
    case "credits": {
      const used = assignment?.experiential ?? [];
      const done = used.filter((c) => c.meets[r.id] === true).reduce((n, c) => n + c.credits, 0);
      const all = assignment?.expCredits ?? 0;
      return {
        ...base,
        courses: used,
        status: done >= r.min ? "met" : all >= r.min ? "projected" : "open",
        detail: `${done} completed + ${all - done} in progress/enrolled = ${all} of ${r.min} credits`,
        verify: verifyCR(used),
      };
    }
    case "attestation":
      return { ...base, status: opts.profDevConfirmed ? "met" : "confirm", detail: r.detail };
    case "gpaCondition": {
      // GPA above the threshold: nothing to do. At or below it: the named course must be on the
      // record (done, in progress or enrolled); otherwise open. Unknown GPA (self-reported grades,
      // or nothing graded yet): ask for letter grades.
      if (gpa.gpa == null) {
        return { ...base, status: "confirm", detail: gpa.selfReported ? "GPA unknown: enter letter grades in the course picker to check this." : "No letter grades yet." };
      }
      // Near the threshold the reconstruction can't be trusted to the hundredth (A14): no verdict
      // unless the course is on the record anyway, and always a pointer to the official figure.
      const near = Math.abs(gpa.gpa - r.threshold) <= (r.nearMargin ?? 0);
      const nearNote = `reconstructed GPA ${g(gpa.gpa)} is within ${r.nearMargin} of ${g(r.threshold)}; use the official GPA on your LionPATH transcript to decide this (A14)`;
      const bar = courses.find((c) => r.codes.includes(c.code) && c.status !== "withdrawn");
      if (!near && gpa.gpa > r.threshold) return { ...base, status: "met", detail: `GPA ${g(gpa.gpa)} is above ${g(r.threshold)}, so the course is not required. ${r.detail}` };
      if (bar) {
        // At or below the threshold, or too close to tell: the course on the record settles it.
        return { ...base, courses: [bar], status: bar.status === "done" && bar.earned > 0 ? "met" : "projected",
          detail: `GPA ${g(gpa.gpa)} reconstructed; ${bar.code} ${bar.title} (${statusWord(bar.status)}, ${bar.term}) covers the condition either way.`, verify: near ? [nearNote] : [] };
      }
      if (near) return { ...base, status: "confirm", detail: `GPA ${g(gpa.gpa)} is too close to ${g(r.threshold)} to call from a reconstruction.`, verify: [nearNote] };
      return { ...base, status: "open", detail: `GPA ${g(gpa.gpa)} is ${g(r.threshold)} or below: ${r.codes[0]} is required in the final spring semester and is not on the record.` };
    }
    case "gpaMinimum": {
      if (gpa.gpa == null) {
        return { ...base, status: "confirm", detail: gpa.selfReported ? "GPA unknown: enter letter grades in the course picker to check this." : "No letter grades yet." };
      }
      // "except for the first semester of the first year": skip the first graded term.
      const low = gpa.byTerm.slice(1).filter((t) => t.cumulative < r.minGpa);
      const near = gpa.byTerm.slice(1).filter((t) => t.cumulative >= r.minGpa && t.cumulative - r.minGpa <= (r.nearMargin ?? 0));
      const problems = [];
      if (low.length) problems.push(`cumulative GPA below ${g(r.minGpa)} after ${low.map((t) => `${t.term} (${g(t.cumulative)})`).join(", ")}`);
      if (gpa.fails > r.maxFails) problems.push(`${gpa.fails} F grades (more than ${r.maxFails})`);
      // A reconstructed GPA just above 2.0 can't be trusted to the hundredth (A14): no verdict.
      const verify = near.length ? [`reconstructed cumulative GPA within ${r.nearMargin} of ${g(r.minGpa)} after ${near.map((t) => `${t.term} (${g(t.cumulative)})`).join(", ")}; use the official GPA on your LionPATH transcript (A14)`] : [];
      return {
        ...base,
        status: problems.length ? "open" : near.length ? "confirm" : "met",
        detail: problems.length ? problems.join("; ") : `Cumulative GPA ${g(gpa.gpa)}; ${gpa.fails} F grade${gpa.fails === 1 ? "" : "s"}. ${gpa.unknown ? `${gpa.unknown} CR course(s) carry no points.` : ""}`.trim(),
        verify,
      };
    }
    default:
      throw new Error(`Unknown requirement kind "${r.kind}" in rules.js (${r.id})`);
  }
}

/**
 * Full-time semester count. Fall and Spring terms only (summer never counts). A term counts as
 * full-time when its credits (earned if graded, attempted if in progress/enrolled) are at least
 * minCredits. Terms over maxCredits are flagged.
 */
function residencyDetail(courses, r) {
  const terms = new Map();
  for (const c of courses) {
    if (!/^(Fall|Spring) /.test(c.term)) continue;
    const t = terms.get(c.term) ?? { term: c.term, credits: 0, projected: false };
    t.credits += c.status === "withdrawn" ? 0 : c.status === "done" ? c.earned : c.attempted;
    if (c.status === "inProgress" || c.status === "enrolled") t.projected = true;
    terms.set(c.term, t);
  }
  const list = [...terms.values()].sort((a, b) => termOrder(a.term) - termOrder(b.term));
  for (const t of list) {
    t.fullTime = t.credits >= r.minCredits;
    t.overMax = t.credits > r.maxCredits;
  }
  return {
    terms: list,
    fullTimeDone: list.filter((t) => t.fullTime && !t.projected).length,
    fullTimeProjected: list.filter((t) => t.fullTime).length,
    overMax: list.filter((t) => t.overMax).map((t) => t.term),
  };
}

/** Totals for the credit caps that subject codes can identify (ASSUMPTION A6). */
export function checkCaps(courses, caps) {
  return caps.map((cap) => {
    if (!cap.checkable) return { ...cap, total: null };
    const total = courses
      .filter((c) => (cap.subjects?.includes(c.subject) || cap.codes?.includes(c.code)) && c.status !== "withdrawn")
      .reduce((n, c) => n + c.credits, 0);
    return { ...cap, total };
  });
}

/**
 * Concentration progress (ASSUMPTIONS A1, A2, A10).
 * For each concentration, every student course whose title keys match an entry on its `courses` or
 * `clinics` list counts, provided the grade is C or better (or pending). A course may count toward
 * several concentrations (A1). `other` entries are never auto-counted (A10).
 * Bands: complete (≥ min, all done), projected (≥ min counting in-progress), close (8–11), far (<8).
 */
export function scoreConcentrations(courses, concData, aliases, gradeOrder) {
  return concData.concentrations
    .map((conc) => {
      const index = indexEntries([...conc.courses, ...conc.clinics], aliases);
      const matched = [];
      for (const c of courses) {
        if (c.status === "withdrawn") continue;
        const hit = [...c.titleKeys].find((k) => index.has(k));
        if (!hit) continue;
        const meets = gradeMeets(c.grade, concData.minGrade, gradeOrder);
        matched.push({ course: c, listedAs: index.get(hit), counts: meets !== false, pending: meets === "pending", verify: c.grade === "CR" });
      }
      const counted = matched.filter((m) => m.counts);
      const done = counted.filter((m) => !m.pending).reduce((n, m) => n + m.course.credits, 0);
      const total = counted.reduce((n, m) => n + m.course.credits, 0);
      const band = done >= concData.minCredits ? "complete" : total >= concData.minCredits ? "projected" : total >= 8 ? "close" : "far";
      return { name: conc.name, matched, done, total, needed: Math.max(0, concData.minCredits - total), band, other: conc.other };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

/**
 * Remaining-semester planner. Uses the course chart's anticipated offerings for terms that have not
 * started yet (as of `asOf`), and lists chart courses that would (a) satisfy an OPEN exclusive
 * requirement or (b) count toward a concentration that is close (within 6 credits).
 * Suggestions only; the chart says offerings are subject to change.
 */
function planNext(courses, results, conc, concData, chart, offerings, catalogByCode, aliases, lists, asOf, opts = {}) {
  const CHART_TERMS = { FA25: "Fall 2025", SP26: "Spring 2026", FA26: "Fall 2026", SP27: "Spring 2027" };
  // Only terms that have not started yet: the current term's registration is already settled.
  const futureTerms = Object.entries(CHART_TERMS).filter(([, t]) => termStartDate(t) > asOf);
  const taken = new Set(courses.flatMap((c) => [...c.titleKeys]));
  const takenCodes = new Set(courses.filter((c) => c.status !== "withdrawn").map((c) => c.code));
  const titleToCatalog = new Map([...catalogByCode.values()].map((c) => [titleKey(c.title, aliases), c]));
  const openReqs = results.filter((r) => r.status === "open").map((r) => r.requirement.id);
  const nearConc = conc.filter((c) => c.band !== "complete" && c.band !== "projected" && c.needed <= 6);
  const listsByName = new Map(concData.concentrations.map((c) => [c.name, [...c.courses, ...c.clinics]]));
  const nearIndexes = nearConc.map((c) => ({ c, idx: indexEntries(listsByName.get(c.name), aliases) }));

  /** Why a course would help: open exclusive requirements, the bar-skills condition, close concentrations. */
  const reasonsFor = (prefix, code, keys) => {
    const reasons = [];
    if (openReqs.includes("seminar") && (prefix === "LWSEM" || keys.some((k) => lists.seminar.has(k)))) reasons.push("Writing seminar");
    if (openReqs.includes("aba303c")) {
      // A13: say which list the course is on, the same way the requirement table does.
      if (keys.some((k) => lists.aba303cUP.has(k))) reasons.push("ABA 303(c) – UP list");
      else if (keys.some((k) => lists.aba303c.has(k))) reasons.push("ABA 303(c) – DL list only");
    }
    if (openReqs.includes("experiential") && ["LWEXP", "LWCLI", "LWEXT"].includes(prefix)) reasons.push("Experiential");
    if (openReqs.includes("gpaBarSkills") && ["LWELB 900", "BAREX 900"].includes(code)) reasons.push("Bar-skills condition (GPA ≤ 2.70)");
    for (const { c, idx } of nearIndexes) if (keys.some((k) => idx.has(k))) reasons.push(`${c.name} (needs ${c.needed})`);
    return reasons;
  };

  // 1. A term with a verified section list (data/offerings-*.js) uses it: real LionPATH codes,
  //    sections, credits and meeting times. Clinics, externships and independent study are
  //    application-only; once enrollment for the term has opened their window is treated as closed
  //    and they are hidden unless opts.includeApplicationOnly is set (the page's checkbox).
  const verified = (offerings ?? []).filter((o) => futureTerms.some(([, t]) => t === o.term));
  if (verified.length) {
    const suggestions = [];
    let hiddenApplicationOnly = 0;
    for (const o of verified) {
      const closed = o.applicationOnly?.treatClosedFrom ? asOf >= new Date(o.applicationOnly.treatClosedFrom + "T00:00:00") : false;
      for (const s of o.sections) {
        if (takenCodes.has(s.code) && !s.topic) continue; // already on the record (numbered course)
        const cat = catalogByCode.get(s.code);
        const generic = !cat || /^special topics?$/i.test(cat.title);
        const keys = new Set();
        if (cat && !generic) keys.add(titleKey(cat.title, aliases));
        if (s.topic) for (const k of entryKeys(s.topic, aliases)) keys.add(k);
        if (generic && !s.topic) for (const k of entryKeys(s.title, aliases)) keys.add(k);
        keys.delete("");
        if ([...keys].some((k) => taken.has(k))) continue;
        const reasons = reasonsFor(s.code.split(" ")[0], s.code, [...keys]);
        if (!reasons.length) continue;
        if (s.application && closed && !opts.includeApplicationOnly) { hiddenApplicationOnly++; continue; }
        suggestions.push({
          term: o.term, verified: true,
          code: s.code, section: s.section, classNbr: s.classNbr, name: s.title, credits: s.credits ?? "?", creditsSource: s.creditsSource,
          meets: s.meets, mode: s.mode, status: s.status, seats: s.seats, application: s.application, applicationClosed: closed, note: s.note,
          prefix: s.code.split(" ")[0], clinic: s.code.startsWith("LWCLI"), reasons,
        });
      }
    }
    const o = verified[0];
    return {
      terms: verified.map((x) => x.term),
      source: "lionpath", readOn: o.readOn, dates: o.dates, applicationOnly: o.applicationOnly, hiddenApplicationOnly,
      suggestions: suggestions.sort((a, b) => b.reasons.length - a.reasons.length || a.code.localeCompare(b.code) || a.section.localeCompare(b.section)),
    };
  }

  // 2. Otherwise the course chart's anticipated offerings (names only; credits from the catalog).
  const suggestions = [];
  for (const row of chart.rows) {
    const terms = row.terms.filter((t) => futureTerms.some(([code]) => code === t)).map((t) => CHART_TERMS[t]);
    if (!terms.length) continue;
    const keys = entryKeys(row.name, aliases);
    if (keys.some((k) => taken.has(k))) continue;
    const cat = keys.map((k) => titleToCatalog.get(k)).find(Boolean);
    const reasons = reasonsFor(row.prefix, cat?.code ?? null, keys);
    if (reasons.length) suggestions.push({ prefix: row.prefix, name: row.name, terms, credits: cat?.credits ?? "?", code: cat?.code ?? null, clinic: row.prefix === "LWCLI", temporary: row.temporary, reasons, verified: false });
  }
  return { terms: futureTerms.map(([, t]) => t), source: "chart", suggestions: suggestions.sort((a, b) => b.reasons.length - a.reasons.length || a.name.localeCompare(b.name)) };
}

/**
 * Course browser rows: every catalog course with the requirements and concentrations it counts
 * toward and the terms the course chart shows it offered. This is the "new code → old requirement"
 * crosswalk the LionPATH audit is missing. Uses the same rules as runAudit, applied to the catalog
 * title (Special Topics rows can't be resolved by code and say so).
 * @param {object} data  { rules, catalog, lists, concentrations, chart }
 * @returns {Array<{code,title,credits,subject,requirements:string[],concentrations:string[],offered:string[],specialTopics:boolean}>}
 */
export function describeCatalog(data) {
  const { rules, catalog, lists: listData, concentrations, chart } = data;
  const aliases = Object.fromEntries(rules.TITLE_ALIASES.map((a) => [normalizeTitle(a.from), normalizeTitle(a.to)]));
  const seminar = indexEntries(
    [...listData.seminar.currentLWSEM, ...listData.seminar.formerCarlisle, ...listData.seminar.formerUniversityParkULWR].map((e) => e.title),
    aliases,
  );
  const aba = indexEntries(listData.aba303c.courses.map((e) => e.title), aliases);
  const abaUP = indexEntries(listData.aba303c.universityPark.courses.map((e) => e.title), aliases);
  const concIdx = concentrations.concentrations.map((c) => ({ name: c.name, idx: indexEntries([...c.courses, ...c.clinics], aliases) }));
  const CHART_TERMS = { FA25: "Fall 2025", SP26: "Spring 2026", FA26: "Fall 2026", SP27: "Spring 2027" };
  const offered = new Map();
  for (const row of chart.rows) for (const k of entryKeys(row.name, aliases)) offered.set(k, row.terms.map((t) => CHART_TERMS[t]));
  const req = (id) => rules.REQUIREMENTS.find((r) => r.id === id);

  return catalog.courses.map((c) => {
    const specialTopics = rules.SPECIAL_TOPICS_TITLE.test(c.title);
    const key = titleKey(c.title, aliases);
    const requirements = [];
    const sem = req("seminar"), exp = req("experiential"), pr = req("pr");
    if (pr.codes.includes(c.code)) requirements.push("Professional Responsibility");
    if (sem.subjects.includes(c.subject) || c.tags.includes("seminar") || (!specialTopics && seminar.has(key))) requirements.push("Writing seminar");
    if (exp.subjects.includes(c.subject) || c.tags.includes("experiential")) requirements.push("Experiential");
    // A13: "– UP" = on the cohort's University Park list; "– DL" = only on the unified list.
    if (!specialTopics && abaUP.has(key)) requirements.push("ABA 303(c) – UP");
    else if (!specialTopics && aba.has(key)) requirements.push("ABA 303(c) – DL");
    return {
      code: c.code,
      title: c.title,
      credits: c.credits,
      subject: c.subject,
      specialTopics,
      requirements,
      concentrations: specialTopics ? [] : concIdx.filter((x) => x.idx.has(key)).map((x) => x.name),
      offered: offered.get(key) ?? [],
    };
  });
}
