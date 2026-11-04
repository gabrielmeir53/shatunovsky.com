/**
 * rules.js: THE file to review and maintain. Every graduation rule the audit applies is written
 * here as data, with where it came from. engine.js contains no requirement-specific numbers or course
 * codes of its own; it only interprets this file.
 *
 * Cohort: Penn State Law / Penn State Dickinson Law, University Park, J.D. students admitted BEFORE
 * Fall 2025 (the Class of 2027 and earlier). Students admitted Fall 2025 or later have different
 * requirements and are out of scope.
 *
 * This is an ES module (not .json) for two reasons: (1) the page can import it without a network
 * request, so its Content-Security-Policy can forbid ALL network connections (see index.html), and
 * (2) reviewers can leave comments in it.
 *
 * Every rule has `source` (the document it comes from). Where the documents are silent and the code
 * had to choose, the choice is listed in ASSUMPTIONS at the bottom and referenced by id (A1, A2, …).
 */

/** Where each rule comes from. Referenced by key from the rules below. */
export const SOURCES = {
  checklist: "J.D. Degree Requirements Checklist (University Park students admitted prior to FA2025), last updated 10/20/2025",
  seminarPage: "Dickinson Law Intranet, Seminar Courses page (copied October 2026)",
  aba303cPage: "Dickinson Law Intranet, ABA Standard 303(c) Civil Rights, Equal Protection and Social Justice Courses page (last updated 3/26/2026)",
  concentrationsPdf: "Concentrations - University Park, students admitted prior to Fall 2025 (Intranet, October 2026)",
  lionpath: "LionPATH > Degree Planning and Progress > My Academic Requirements, observed 11/04/2026 for a Class of 2027 student",
  bulletin: "Penn State University Bulletin, Law course descriptions (snapshot date in data/catalog.js)",
};

/**
 * Letter grades in order, best first. "C or better" means any grade up to and including "C".
 * CR (credit) and W (withdrawn) etc. are handled explicitly in engine.js gradeMeets().
 */
export const GRADE_ORDER = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];

/** Subjects that hold first-year required courses (excluded from 303(c), A4). */
export const FIRST_YEAR_SUBJECTS = ["PSLFY"];

/**
 * "Special Topics" course codes: the catalog title is generic, so the course's real title only
 * exists on the transcript (description or "Course Topic:" line). For these, engine.js matches lists
 * on the transcript title/topic instead of the catalog title.
 */
export const SPECIAL_TOPICS_TITLE = /^special topics?$/i;

export const REQUIREMENTS = [
  {
    id: "credits",
    label: "88 total credits",
    kind: "totalCredits",
    min: 88,
    source: "checklist",
    detail: "Earn at least 88 credits, including all first-year required courses.",
  },
  {
    id: "residency",
    label: "Six full-time semesters",
    kind: "residency",
    semesters: 6,
    minCredits: 12,
    maxCredits: 17,
    source: "checklist",
    detail:
      "In residence for six fall/spring semesters with at least 12 credits each; 17 credits maximum " +
      "per semester. Summer credits do not count toward residency.",
    // Not checkable from a transcript: full tuition, and working no more than 20 hours/week.
    // Approved away programs (Semester in Washington/Harrisburg, Externships Everywhere, study abroad)
    // count and appear on the transcript as ordinary terms.
  },
  {
    id: "core1lFall",
    label: "1L Fall required courses",
    kind: "allOf",
    codes: ["PSLFY 900", "PSLFY 910", "PSLFY 908", "PSLFY 912", "PSLFY 925"],
    source: "checklist",
  },
  {
    id: "core1lSpring",
    label: "1L Spring required courses",
    kind: "allOf",
    codes: ["PSLFY 903", "PSLFY 905", "PSLFY 907", "PSLFY 914", "PSLFY 920"],
    source: "checklist",
  },
  {
    id: "seminar",
    label: "Upper-level writing seminar (C or better)",
    kind: "oneCourse",
    minGrade: "C",
    exclusive: true, // takes part in the no-double-counting assignment (see DOUBLE_COUNTING)
    // A course qualifies if ANY of these is true:
    subjects: ["LWSEM", "ULWR", "AULWR"], // checklist: ("ULWR" or "LWSEM"); AULWR is what LionPATH lists
    catalogTag: "seminar", // Bulletin description says it satisfies the seminar requirement
    list: "seminar", // title is on the Intranet seminar list (any of its three sections)
    source: "checklist",
    lionpath: {
      accepts: "AULWR 900-level, ULWR 900-level",
      problem:
        "The audit line only accepts the pre-merger subjects AULWR/ULWR. Post-merger seminars are " +
        "coded LWSEM (the checklist itself says \"ULWR\" or \"LWSEM\"), so no post-merger seminar can satisfy it.",
      fix: "Add LWSEM 900-level (any course in subject LWSEM) to the Upper Level Writing Seminar requirement line.",
    },
  },
  {
    id: "pr",
    label: "Professional Responsibility (C or better)",
    kind: "oneCourse",
    minGrade: "C",
    codes: ["PRORP 934", "LWREQ 934"], // checklist: ("PRORP 934" or "LWREQ 934")
    source: "checklist",
    lionpath: {
      accepts: "PRORP 934",
      problem: "The audit line only accepts PRORP 934. The post-merger course is LWREQ 934 (same number, new subject).",
      fix: "Add LWREQ 934 to the Professional Responsibility requirement line.",
    },
  },
  {
    id: "aba303c",
    label: "ABA 303(c) course (C or better)",
    kind: "oneCourse",
    minGrade: "C",
    exclusive: true,
    list: "aba303c",
    excludeFirstYear: true, // "one course beyond the first-year required courses" (A4)
    source: "aba303cPage",
    lionpath: {
      accepts: "(no course list; the line asks for 1 to 3 units and shows nothing that can satisfy it)",
      problem: "The audit line has no course list attached, so no course on the Intranet 303(c) list can satisfy it.",
      fix:
        "Attach the Intranet 303(c) course list to the ABA 303(c) requirement line, by course ID where the " +
        "course has its own catalog number and by topic for Special Topics sections (see data/intranet-lists.js).",
    },
  },
  {
    id: "experiential",
    label: "Experiential learning, 6 credits (C or better)",
    kind: "credits",
    min: 6,
    minGrade: "C",
    exclusive: true,
    // checklist: "(Externship, Clinic, "EXPR" OR "LWEXP")". Post-merger clinics are LWCLI and
    // externships LWEXT. Regular electives (LWELA/LWELB) never count, even if experiential in nature.
    subjects: ["EXPR", "LWEXP", "LWCLI", "LWEXT"],
    catalogTag: "experiential",
    source: "checklist",
    lionpath: {
      accepts: "(courses not shown; LWEXP courses are not recognized: 0.00 taken)",
      problem:
        "The audit line counts 0 credits for LWEXP courses. Pre-merger experiential courses were EXPR; " +
        "post-merger they are LWEXP (clinics LWCLI, externships LWEXT).",
      fix: "Add LWEXP, LWCLI and LWEXT 900-level courses to the Required Experiential Learning Credits line.",
    },
  },
  {
    id: "profDev",
    label: "1L January Professional Development program",
    kind: "attestation",
    source: "checklist",
    detail:
      "A non-credit program in January of the first year. It does not appear on the transcript, so " +
      "the page asks the student to confirm it (A7).",
  },
];

/**
 * No double counting (Intranet, both pages): one course cannot satisfy two of the exclusive
 * requirements above (seminar, 303(c), experiential). Exceptions written into the rule:
 *   - a student may take two seminars and use one for the seminar requirement and another for 303(c)
 *     (that is just two different courses, so no special handling is needed);
 *   - "Experiential coursework in excess of the 6-credit requirement may be applied toward 303(c)."
 */
export const DOUBLE_COUNTING = {
  exclusive: ["seminar", "aba303c", "experiential"],
  experientialExcessMayCountFor303c: true,
  source: "seminarPage",
};

/**
 * Credit caps shown on the LionPATH audit ("Co-Curricular Credit Rules" and "Elective Course Credit
 * Caps"). The engine can only total the caps it can identify from subject codes; the others are shown
 * as information. See A6.
 */
export const CAPS = [
  { id: "coCurricular", label: "All co-curricular areas", max: 18, subjects: ["LWCLI", "LWEXT", "LWCUR", "LWINP"], checkable: true },
  { id: "externships", label: "Externships", max: 12, subjects: ["LWEXT"], checkable: true },
  { id: "inHouseClinics", label: "In-house clinics", max: 18, subjects: ["LWCLI"], checkable: true },
  { id: "independentStudy", label: "Independent study", max: 4, subjects: ["LWINP"], checkable: true },
  { id: "irws", label: "Individual Research and Writing Seminar", max: 3, codes: ["LWSEM 996"], checkable: true },
  { id: "semesterExternships", label: "Semester externships", max: 10, checkable: false },
  { id: "externshipsEverywhere", label: "Externships Everywhere", max: 12, checkable: false },
  { id: "otherAbaSchool", label: "Credits from another ABA law school", max: 6, checkable: false },
  { id: "nonLaw", label: "400/500/800-level (non-law) courses", max: 12, checkable: false },
  { id: "journal", label: "Law review / journal membership", max: 6, checkable: false },
  { id: "mootCourt", label: "Moot Court Board and Vis competition", max: 4, checkable: false },
  { id: "mockTrial", label: "Mock Trial Competition Team", max: 6, checkable: false },
  { id: "passFail", label: "Pass/Fail option (one course; not courses offered only as pass/fail)", max: 4, checkable: false },
];

/**
 * Title aliases: true renames or alternate names that normalization (match.js) can't reconcile.
 * `from` and `to` are written as titles; engine.js normalizes both. `to` must be a title that
 * exists in data/catalog.js, unless the entry is marked `specialTopic: true` (a course taught under a
 * Special Topics number, matched by the transcript topic). The tests and tools/check-data.mjs verify
 * this. Every entry carries its reason in `note`.
 */
export const TITLE_ALIASES = [
  // Renamed or alternate names, as stated by the source lists themselves
  { from: "Law and Sexuality", to: "Gender and Sexuality Law", note: "303(c) list: \"Gender and Sexuality Law (Law and Sexuality)\"" },
  { from: "Gender & Sexuality", to: "Gender and Sexuality Law", note: "Health Law concentration list shorthand" },
  { from: "Children and the Law", to: "Juvenile Law", note: "Concentration lists: \"Juvenile Law (Formerly Children and the Law)\"" },
  { from: "Equal Protection & Civil Rights", to: "Constitutional Law II", note: "303(c) list: \"Constitutional Law II (Equal Protection & Civil Rights)\"" },
  { from: "Con Law II", to: "Constitutional Law II", note: "Course chart / transcript abbreviation" },
  { from: "First Amendment Law", to: "First Amendment", note: "303(c) list wording; catalog LWELB 965 \"First Amendment\"" },
  { from: "Law of Individuals with Disabilities", to: "Law and Individuals with Disabilities", note: "303(c) list wording; catalog LWELA 926" },
  { from: "Disabilities Law", to: "Law and Individuals with Disabilities", note: "Concentration lists and course chart (FA25) wording; only disabilities course in the catalog (LWELA 926). See A8." },
  { from: "Veterans Benefits", to: "Veterans Benefits Law", note: "Catalog LWELA 948" },
  { from: "Introduction to Private Wealth", to: "Introduction to Private Wealth Planning", note: "Catalog LWELA 966/973; transcript truncates to \"Introduction to Private Wealt\"" },
  { from: "Basic Federal Income Tax", to: "Basic Federal Income Taxation", note: "Course chart wording; catalog LWELA 949" },
  { from: "Business Planning for Mergers & Acquisitions", to: "Business Planning for Mergers and Acquisitions I", note: "Course chart omits the \"I\"; catalog LWELA 921" },
  { from: "Federal Securities Reg", to: "Federal Securities Regulation", note: "Course chart abbreviation; catalog LWELA 986" },
  { from: "Civil Pre-Trial Practice and Advocacy", to: "Civil Pretrial Practice and Advocacy", note: "Hyphenation; catalog LWEXP 976" },
  { from: "Policy Issues in Corporate Crimes Seminar", to: "Policy Issues in Corporate Crime Seminar", note: "Intranet seminar list plural; catalog LWSEM 946" },
  { from: "Federal Regulatory & Legislative Practice Seminar", to: "Regulatory & Legislative Practice Seminar", note: "Former UP title vs current LWSEM 914 title" },
  { from: "International Human Rights Law Seminar", to: "International Human Rights Seminar", note: "303(c) list wording; catalog LWSEM 968" },
  { from: "Child Welfare Law & Policy Seminar", to: "Child Welfare Seminar", note: "303(c)/Carlisle list wording; catalog LWSEM 901" },
  { from: "Minority Business Ownership", to: "The Lawyer's Role In Helping Close The Minority-White Gap In Business Ownership", note: "Short name used by lists; catalog LWSEM 952" },
  { from: "Minority Business Ownership Seminar", to: "The Lawyer's Role In Helping Close The Minority-White Gap In Business Ownership", note: "303(c) list wording; catalog LWSEM 952" },
  { from: "The Law of Employee Benefits", to: "Employee Benefits Law", note: "Concentration list wording; catalog LWELA 908" },
  { from: "Law of Employee Benefits", to: "Employee Benefits Law", note: "Concentration list wording; catalog LWELA 908" },
  { from: "Trans Right Seminar", to: "Trans Rights Seminar", specialTopic: true, note: "Typo in the Constitutional Law concentration list. Special topic (no catalog number): matches on the transcript topic" },
  { from: "Policy Innovation Lab of Tomorrow (PILoT) Lab Class", to: "PILOT Lab Class", note: "Full name of LWELB 945" },
  // Clinics: concentration lists use short or older names
  { from: "Center for Immigrants' Rights Clinic", to: "Center for Immigrants' Rights", note: "Catalog LWCLI 905" },
  { from: "Advanced Center for Immigrants' Rights Clinic", to: "Advanced Center for Immigrants' Rights", note: "Catalog LWCLI 906" },
  { from: "Advanced Immigration Clinic", to: "Advanced Center for Immigrants' Rights", note: "Older name of LWCLI 906" },
  { from: "Advanced Entrepreneur Assistance Clinic", to: "Advanced Entrepreneurship Clinic", note: "Catalog LWCLI 926" },
  { from: "Advanced Family Law", to: "Advanced Family Law Clinic", note: "Listed under Clinics; catalog LWCLI 931" },
  { from: "Advanced Veterans and Servicemembers Legal Clinic", to: "Adv Veterans Clinic", note: "Catalog LWCLI 956" },
  { from: "Advanced Veterans & Servicemembers Legal Clinic", to: "Adv Veterans Clinic", note: "Catalog LWCLI 956" },
  { from: "Art, Sports, and Entertainment Law Clinic", to: "Arts, Sports and Entertainment Law Clinic", note: "Catalog LWCLI 900" },
  { from: "Manglona Lab for Gender and Economic Equity", to: "Anuncia Donecia Songsong Manglona Lab for Gender and Economic Equity", note: "Catalog LWCLI 940" },
];

/**
 * Interpretations the code makes where the written rules are silent or ambiguous. Each names where
 * it is implemented so the registrar can approve it or ask for it to be changed in one place.
 * The page shows this list under "How this audit decides".
 */
export const ASSUMPTIONS = [
  { id: "A1", text: "A course may count toward more than one concentration. The concentration rules say students may earn multiple concentrations but do not address one course on several lists. The page shows this caveat next to the concentration table.", where: "engine.js scoreConcentrations()" },
  { id: "A2", text: "A CR (credit) grade meets a \"C or better\" minimum, but every use of a CR course is flagged \"verify with registrar\". CR courses carry credits but no grade points.", where: "engine.js gradeMeets()" },
  { id: "A3", text: "Courses in a term that has not started yet are \"enrolled\"; courses in the current term without a grade are \"in progress\". Both count as projected, never as done. Term start dates are approximate: Fall = Aug 15, Spring = Jan 5, Summer = May 15.", where: "engine.js courseStatus(), TERM_START" },
  { id: "A4", text: "First-year required courses (PSLFY) never satisfy 303(c), even when the title is on the 303(c) list (e.g., Criminal Procedure). The list itself says the course must be beyond the first-year required courses.", where: "rules.js REQUIREMENTS aba303c.excludeFirstYear" },
  { id: "A5", text: "Seminar, 303(c) and experiential are assigned to courses together so that no course is used twice, choosing the assignment that satisfies the most requirements, then the one that uses completed courses before in-progress ones. Experiential credit beyond 6 may also be used for 303(c), per the Intranet rule.", where: "engine.js assignExclusive()" },
  { id: "A6", text: "Credit caps are totaled only where a subject code identifies the category (LWCLI clinics, LWEXT externships, LWCUR co-curricular, LWINP independent study, LWSEM 996). Journal, moot court, mock trial, non-law and pass/fail caps can't be identified from codes alone and are listed for information.", where: "rules.js CAPS, engine.js checkCaps()" },
  { id: "A7", text: "January 1L Professional Development is not on the transcript; the student confirms it with a checkbox.", where: "app.js" },
  { id: "A8", text: "Title aliases in rules.js TITLE_ALIASES treat differently named list entries as the same course (e.g., \"Disabilities Law\" = Law and Individuals with Disabilities, LWELA 926). Each alias has a note with its basis.", where: "rules.js TITLE_ALIASES" },
  { id: "A9", text: "Special Topics sections (catalog title \"Special Topics\") match requirement and concentration lists by the topic printed on the transcript, because the course code alone does not identify the course.", where: "engine.js courseTitleKeys()" },
  { id: "A10", text: "Concentration items listed under \"Additional Experiential Opportunities\" (externships, moot court, etc.) need Associate Dean approval that the work related to the concentration, so they are shown but never counted automatically.", where: "engine.js scoreConcentrations()" },
  { id: "A11", text: "Withdrawn (W), failed, and incomplete courses earn no credit and satisfy nothing. Courses below C still earn credit toward 88 if credits were earned, but do not satisfy C-or-better requirements or concentrations.", where: "engine.js gradeMeets(), totals()" },
];
