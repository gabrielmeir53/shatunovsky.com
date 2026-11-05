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

/**
 * Where each rule comes from. Referenced by key from the rules below, listed with links on the page
 * under "How this audit decides", and tabulated in IT-HANDOFF.md §12.
 *   label  what the document is
 *   url    where to open it. Intranet links need a Penn State login (Dickinson Law Intranet,
 *          SharePoint); the others are public.
 *   note   version/date seen and what was checked
 */
export const SOURCES = {
  checklist: {
    label: "J.D. Degree Requirements Checklist, University Park students admitted prior to FA2025 (Intranet PDF)",
    url: "https://pennstateoffice365.sharepoint.com/:b:/r/sites/DickinsonLawIntranet/Shared%20Documents/Student_Specific/JD%20Requirement%20Checklist-UP.pdf?csf=1&web=1",
    note: "Last updated 10/20/2025. Linked from the Intranet's Registration Information page under \"J.D. Requirements Checklist (University Park)\".",
  },
  flowchart: {
    label: "Curriculum Flowchart - University Park Pre-2025, \"Planning form for University Park Students who entered before Fall 2025\" (Intranet PDF)",
    url: "https://pennstateoffice365.sharepoint.com/:b:/r/sites/DickinsonLawIntranet/Shared%20Documents/Open_To_All/Curriculum%20Flowchart%20-%20University%20Park%20Pre-2025.pdf?csf=1&web=1",
    note: "9/24/2025; re-read 11/04/2026. Source of the 2.70 GPA bar-skills condition and the good-standing rule. Linked from Office of Academic Affairs as \"University Park Chart - Pre-Fall 2025 Students\".",
  },
  publicPage: {
    label: "Penn State Dickinson Law, Degree Requirements, section \"Penn State Law J.D. Requirements (Prior to Reunification)\" (public web page)",
    url: "https://dickinsonlaw.psu.edu/academics/jd-program/degree-requirements",
    note: "Read 11/04/2026; the same seven requirements as the checklist. The Intranet's \"J.D. Requirements\" links (dickinsonlaw.psu.edu/required-courses) resolve here.",
  },
  handbook: {
    label: "Student Academic Handbook (public page) and the University Park Academic Handbook 2024-2025 (Intranet PDF, the handbook in force when the Class of 2027 enrolled)",
    url: "https://dickinsonlaw.psu.edu/academic-handbook",
    url2: "https://pennstateoffice365.sharepoint.com/:b:/r/sites/DickinsonLawIntranet/Shared%20Documents/Student_Specific/UP_Academic_Handbook_2024-2025_FINAL.pdf?csf=1&web=1",
    note: "Background for residency, caps and concentrations; no rule in this file is taken from the handbook alone.",
  },
  seminarPage: {
    label: "Dickinson Law Intranet, Seminar Courses page",
    url: "https://pennstateoffice365.sharepoint.com/sites/DickinsonLawIntranet/SitePages/Seminars.aspx",
    note: "Copied October 2026; re-checked against the live page 11/04/2026, no changes. Lists current LWSEM seminars, former Carlisle seminars and former University Park ULWR seminars, plus the double-counting rule.",
  },
  aba303cUpPage: {
    label: "Dickinson Law Intranet, \"ABA 303(c) Course Requirement - University Park\" page (students admitted to Penn State Law, University Park, Fall 2023 and later, prior to reunification)",
    url: "https://pennstateoffice365.sharepoint.com/sites/DickinsonLawIntranet/SitePages/ABA-303(c)-Course-Requirement---University-Park.aspx",
    note: "Last updated 9/16/2025; read 11/04/2026. The primary 303(c) list for this cohort (A13). Found through the Intranet site search; it is not linked from the Office of Academic Affairs page.",
  },
  aba303cPage: {
    label: "Dickinson Law Intranet, \"ABA Standard 303(c) - Civil Rights, Equal Protection and Social Justice Courses\" page (unified Dickinson Law list)",
    url: "https://pennstateoffice365.sharepoint.com/sites/DickinsonLawIntranet/SitePages/Civil-Rights,-Equal-Protection-and-Social-Justice-Courses.aspx",
    note: "Last updated 3/26/2026; re-read 11/04/2026 (one addition since October: Trauma Informed Lawyering, Spring 2027). A superset of the University Park list.",
  },
  experientialPage: {
    label: "Dickinson Law Intranet, Experiential Learning Courses page",
    url: "https://pennstateoffice365.sharepoint.com/sites/DickinsonLawIntranet/SitePages/Experiential-Learning-Skills-Courses.aspx",
    note: "Last updated 9/16/2025; read 11/04/2026. Gives the Penn State Law (University Park) pre-reunification rule verbatim: 6 credits, C or better or a grade of Credit, from LWCLI clinics, LWEXT internships/semester-in-practice or LWEXP simulation courses; and lists the qualifying courses by campus (data/intranet-lists.js experiential).",
  },
  concentrationsPdf: {
    label: "Concentrations (University Park), students admitted prior to Fall 2025 (Intranet PDF)",
    url: "https://pennstateoffice365.sharepoint.com/:b:/r/sites/DickinsonLawIntranet/Shared%20Documents/Student_Specific/Concentrations%20(University%20Park).pdf?csf=1&web=1",
    note: "October 2026 copy (file modified 9/22/2026). Linked from Office of Academic Affairs as \"Concentrations\".",
  },
  courseChart: {
    label: "PSDL Course Chart, University Park (FA25-SP27), \"Historical & Anticipated Course Information\" (Intranet PDF)",
    url: "https://pennstateoffice365.sharepoint.com/:b:/r/sites/DickinsonLawIntranet/Shared%20Documents/Student_Specific/PSDL%20Course%20Chart_University%20Park.pdf?csf=1&web=1",
    note: "Last updated 9/25/2026. Used only by the remaining-semester planner and the crosswalk's \"Offered\" column (data/course-chart.js).",
  },
  courseUpdatesPage: {
    label: "Dickinson Law Intranet, Spring 2027 Course Updates page (courses added/changed after the schedule release, special enrollment criteria, Zoom and point-to-point lists, Special Topics descriptions)",
    url: "https://pennstateoffice365.sharepoint.com/sites/DickinsonLawIntranet/SitePages/Spring%202024%20Course%20Updates.aspx",
    note: "Last updated 10/28/2026; read 11/04/2026. Source of the Spring 2027 section notes in data/offerings-spring-2027.js and of the rule that clinics, externships and independent studies are enrolled by the Registrar after an application.",
  },
  weeklySchedule: {
    label: "Spring 2027 Weekly Class Schedule (ofcourse scheduler export linked from the Registration Information page; credits per class block)",
    url: "https://psulaw.ofcoursescheduler.com/con/exportDay.php?pac=365176",
    note: "Read 11/04/2026; used to cross-check the LionPATH section list and credits in data/offerings-spring-2027.js.",
  },
  slides3L: {
    label: "Spring 2027 Registration Information + Advising Session slides for 3L students (10/16/2026, Intranet PDF)",
    url: "https://pennstateoffice365.sharepoint.com/:b:/r/sites/DickinsonLawIntranet/Shared%20Documents/Student_Specific/SP27-3L%20Registration-Information-Slides-FINAL%20(10.16.26).pdf?csf=1&web=1",
    note: "Registration timeline (shopping carts 10/19, 3L enrollment 10/26, 2L 10/28, classes 1/11/2027, last add 1/17/2027), degree-requirement recap per cohort, co-curricular caps. No clinic application deadline is stated.",
  },
  registrationPage: {
    label: "Dickinson Law Intranet, Registration Information page (links to the checklist, flowcharts, course chart, Spring 2027 schedule and the 3L registration/advising slides)",
    url: "https://pennstateoffice365.sharepoint.com/sites/DickinsonLawIntranet/SitePages/Registration-Information.aspx",
    note: "The page students are sent to each registration cycle; the 3L slides for Spring 2027 (10/16/2026) are linked from it.",
  },
  academicAffairsPage: {
    label: "Dickinson Law Intranet, Office of Academic Affairs page (links to the handbook, flowcharts, J.D. requirements, the three course lists, concentrations and the Bulletin)",
    url: "https://pennstateoffice365.sharepoint.com/sites/DickinsonLawIntranet/SitePages/Office-of-Academic-Affairs.aspx",
    note: "Hub page; the Associate Deans' Approval Request Form (petitions for unlisted concentration courses) is linked from it.",
  },
  lionpath: {
    label: "LionPATH > Degree Planning and Progress > My Academic Requirements (the degree audit this page corrects), and LionPATH Class Search",
    url: "https://lionpath.psu.edu/",
    note: "Audit observed 11/04/2026 for a Class of 2027 student. Class Search > Class Information shows \"No Class Attributes\" for 303(c) and experiential courses (checked 11/04/2026 on LWELA 963 and LWEXP 975), so LionPATH carries no per-course flag the audit could read; the Intranet lists are the only machine-usable source.",
  },
  bulletin: {
    label: "Penn State University Bulletin, Law course descriptions (public)",
    url: "https://bulletins.psu.edu/university-course-descriptions/law/",
    note: "Snapshot date in data/catalog.js; regenerated by tools/build-catalog.mjs.",
  },
  bulletinArchive: {
    label: "Penn State University Bulletin archive, 2024-2025 edition, \"Penn State Law\" course descriptions (public; the last pre-reunification catalog)",
    url: "https://bulletins.psu.edu/archive/2024-2025/university-course-descriptions/pennstatelaw/",
    note: "Official titles and credits for the pre-reunification University Park codes: PSLFY first-year courses, PRORP 934, ULWR/AULWR seminars, EXPR experiential courses, BAREX 900. Snapshot in data/legacy-catalog.js.",
  },
};

/**
 * Letter grades in order, best first. "C or better" means any grade up to and including "C".
 * CR (credit) and W (withdrawn) etc. are handled explicitly in engine.js gradeMeets().
 */
export const GRADE_ORDER = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];

/**
 * Quality points per credit for each letter grade (Penn State's 4.0 scale, as printed in the
 * "Points" column of the advising transcript: A- = 3.67/credit, B+ = 3.33, C+ = 2.33, and so on).
 * Used only for the GPA-based checks below (gpaBarSkills, goodStanding). CR, P, W and the like
 * carry no points and are left out of the GPA, which is how LionPATH computes it too (A14).
 */
export const GRADE_POINTS = { A: 4, "A-": 3.67, "B+": 3.33, B: 3, "B-": 2.67, "C+": 2.33, C: 2, "C-": 1.67, "D+": 1.33, D: 1, "D-": 0.67, F: 0 };

/**
 * Grade code the manual course picker uses when a student says "completed with a C or better" but
 * does not enter the letter grade (A12). It satisfies every "C or better" rule and earns credit,
 * but it has no quality points, so GPA-based checks report "unknown" until letter grades are entered.
 * It never appears on a LionPATH document.
 */
export const SELF_REPORTED_GRADE = "P";

/** Subjects that hold first-year required courses (excluded from 303(c), A4). */
export const FIRST_YEAR_SUBJECTS = ["PSLFY"];

/**
 * The ten first-year required courses with their credits (checklist and flowchart: 16 + 16 = 32).
 * Used by the manual course picker (manual.js) to add a student's 1L year in one step, and by the
 * core1lFall / core1lSpring requirements below. Titles are the checklist's; the transcript
 * abbreviates them ("LEG RES TLS & STRT").
 */
export const FIRST_YEAR_COURSES = {
  fall: [
    { code: "PSLFY 900", title: "Civil Procedure", credits: 4 },
    { code: "PSLFY 910", title: "Criminal Law", credits: 3 },
    { code: "PSLFY 908", title: "Legal Research Tools and Strategies", credits: 2 },
    { code: "PSLFY 912", title: "Applied Legal Analysis & Writing I", credits: 3 },
    { code: "PSLFY 925", title: "Torts", credits: 4 },
  ],
  spring: [
    { code: "PSLFY 903", title: "Constitutional Law I", credits: 3 },
    { code: "PSLFY 905", title: "Contracts", credits: 4 },
    { code: "PSLFY 907", title: "Criminal Procedure", credits: 3 },
    { code: "PSLFY 914", title: "Applied Legal Analysis & Writing II", credits: 2 },
    { code: "PSLFY 920", title: "Property", credits: 4 },
  ],
  source: "checklist",
};

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
    // Two Intranet lists exist (A13):
    //   - "aba303cUP": the University Park page written for this cohort (students admitted to Penn
    //     State Law, UP, Fall 2023 and later, prior to reunification). 13 courses. A course on it
    //     satisfies the requirement outright.
    //   - "aba303c": the unified Dickinson Law page (newer, 45 courses, a superset of the UP list).
    //     A course found ONLY here is counted, but flagged "verify with the registrar", because the
    //     cohort-specific page does not list it.
    list: "aba303c",
    primaryList: "aba303cUP",
    excludeFirstYear: true, // "one course beyond the first-year required courses" (A4)
    source: "aba303cUpPage",
    lionpath: {
      accepts: "(no course list; the line asks for 1 to 3 units and shows nothing that can satisfy it)",
      problem: "The audit line has no course list attached, so no course on the Intranet 303(c) list can satisfy it.",
      fix:
        "Attach the Intranet's University Park 303(c) course list (data/intranet-lists.js aba303c.universityPark) " +
        "to the ABA 303(c) requirement line, by course ID where the course has its own catalog number and by " +
        "topic for Special Topics sections. If the unified Dickinson Law list is meant to apply to this cohort " +
        "too, attach that list instead (aba303c.courses); the registrar should say which.",
    },
  },
  {
    id: "experiential",
    label: "Experiential learning, 6 credits (C or better)",
    kind: "credits",
    min: 6,
    minGrade: "C",
    exclusive: true,
    // checklist: "(Externship, Clinic, "EXPR" OR "LWEXP")". The Intranet Experiential Learning
    // Courses page states the UP pre-reunification rule in full: "6 credits in Experiential Learning
    // from the upper level curriculum", earned "in an in-house legal clinic (LWCLI), an internship
    // (LWEXT), a semester-in-practice (LWEXT), or in courses designated as simulation courses
    // (LWEXP)", "with a grade of at least C, or a grade of Credit in Credit/No Credit courses".
    // Regular electives (LWELA/LWELB) never count, even if experiential in nature.
    subjects: ["EXPR", "LWEXP", "LWCLI", "LWEXT"],
    catalogTag: "experiential",
    crAllowed: true, // the page says a grade of Credit counts, so CR needs no "verify" flag here (A2)
    source: "experientialPage",
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
  {
    // Flowchart "Please Note": "Students with cumulative GPAs under or equal to 2.70 will be subject
    // to the conditions of the Enhanced Academic Support Program. Students will be required to meet
    // with the Associate Dean for Academic Success and satisfactorily complete BAREX 900: Fundamental
    // Skills for the Bar Exam in Spring of the third year if their GPA remains at 2.70 or below in
    // any subsequent semester." Post-merger the course is LWELB 900 (Bulletin).
    id: "gpaBarSkills",
    label: "Cumulative GPA above 2.70 (otherwise Fundamental Skills for the Bar Exam in the final spring)",
    kind: "gpaCondition",
    threshold: 2.7, // "under or equal to 2.70" triggers the condition
    nearMargin: 0.05, // within this of the threshold the page gives no verdict and points to the official GPA (A14)
    codes: ["LWELB 900", "BAREX 900"],
    source: "flowchart",
    detail: "Computed from letter grades on the 4.0 scale (A14); the official GPA is on the transcript.",
  },
  {
    // Flowchart "Good Academic Standing": "Each student must earn a GPA of at least 2.0 at the end of
    // each semester, except for the first semester of the first year. Students may not receive more
    // than 2 F's while enrolled." Checked on the cumulative GPA after each graded fall/spring term.
    id: "goodStanding",
    label: "Good academic standing (cumulative GPA 2.0 or better; no more than two F's)",
    kind: "gpaMinimum",
    minGpa: 2.0,
    nearMargin: 0.05, // a cumulative GPA within this of 2.0 is flagged for an official check (A14)
    maxFails: 2,
    source: "flowchart",
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
  { id: "A2", text: "A CR (credit) grade meets a \"C or better\" minimum. For the experiential requirement the Intranet page says so explicitly (\"a grade of Credit in Credit/No Credit courses\"), so no flag is shown there; everywhere else a CR course is flagged \"verify with registrar\". CR courses carry credits but no grade points.", where: "engine.js gradeMeets(), rules.js experiential.crAllowed" },
  { id: "A3", text: "Courses in a term that has not started yet are \"enrolled\"; courses in the current term without a grade are \"in progress\". Both count as projected, never as done. Term start dates are approximate: Fall = Aug 15, Spring = Jan 5, Summer = May 15.", where: "engine.js courseStatus(), TERM_START" },
  { id: "A4", text: "First-year required courses (PSLFY) never satisfy 303(c), even when the title is on the 303(c) list (e.g., Criminal Procedure). The list itself says the course must be beyond the first-year required courses.", where: "rules.js REQUIREMENTS aba303c.excludeFirstYear" },
  { id: "A5", text: "Seminar, 303(c) and experiential are assigned to courses together so that no course is used twice, choosing the assignment that satisfies the most requirements, then the one that uses completed courses before in-progress ones. Experiential credit beyond 6 may also be used for 303(c), per the Intranet rule.", where: "engine.js assignExclusive()" },
  { id: "A6", text: "Credit caps are totaled only where a subject code identifies the category (LWCLI clinics, LWEXT externships, LWCUR co-curricular, LWINP independent study, LWSEM 996). Journal, moot court, mock trial, non-law and pass/fail caps can't be identified from codes alone and are listed for information.", where: "rules.js CAPS, engine.js checkCaps()" },
  { id: "A7", text: "January 1L Professional Development is not on the transcript; the student confirms it with a checkbox.", where: "app.js" },
  { id: "A8", text: "Title aliases in rules.js TITLE_ALIASES treat differently named list entries as the same course (e.g., \"Disabilities Law\" = Law and Individuals with Disabilities, LWELA 926). Each alias has a note with its basis.", where: "rules.js TITLE_ALIASES" },
  { id: "A9", text: "Special Topics sections (catalog title \"Special Topics\") match requirement and concentration lists by the topic printed on the transcript, because the course code alone does not identify the course.", where: "engine.js courseTitleKeys()" },
  { id: "A10", text: "Concentration items listed under \"Additional Experiential Opportunities\" (externships, moot court, etc.) need Associate Dean approval that the work related to the concentration, so they are shown but never counted automatically.", where: "engine.js scoreConcentrations()" },
  { id: "A11", text: "Withdrawn (W), failed, and incomplete courses earn no credit and satisfy nothing. Courses below C still earn credit toward 88 if credits were earned, but do not satisfy C-or-better requirements or concentrations.", where: "engine.js gradeMeets(), totals()" },
  { id: "A12", text: "In the manual course picker, a course marked \"completed, C or better\" without a letter grade is recorded with the grade code P. It satisfies C-or-better rules and earns its credits, on the student's word; the printed audit says the record was self-reported and must be checked against the transcript.", where: "rules.js SELF_REPORTED_GRADE, engine.js gradeMeets(), manual.js" },
  { id: "A13", text: "For ABA 303(c), the Intranet's University Park page (written for students admitted to Penn State Law, UP, Fall 2023 and later, prior to reunification) is the primary list. The unified Dickinson Law page is a superset; a course found only there is counted but flagged \"verify with the registrar\". The checklist itself only says \"one course approved by the faculty\".", where: "rules.js REQUIREMENTS aba303c.primaryList, engine.js eligibility()" },
  { id: "A14", text: "GPA is computed from letter grades using Penn State's 4.0 scale (GRADE_POINTS), weighting each course by its credits; CR, P and W carry no points. The transcript's printed GPA is deliberately not read (privacy), so the page's figure is a reconstruction and can differ by rounding. A reconstructed GPA within 0.05 of a threshold (2.70 bar-skills condition, 2.0 good standing) therefore gets no verdict: the line says to use the official LionPATH GPA. With self-reported P grades the GPA is unknown and GPA-based lines ask for letter grades.", where: "rules.js GRADE_POINTS, nearMargin; engine.js gpaDetail()" },
];
