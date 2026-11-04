/**
 * parser.js: read a student's LionPATH PDF into structured course records.
 *
 * Two LionPATH documents are accepted, and the format is detected automatically:
 *
 *   1. ADVISING TRANSCRIPT (Academic Records > View Advising Transcript)
 *      Single column, term headings ("Fall 2025") followed by rows such as
 *        "LWELA 903 Corporations 3.000 3.000 B 9.000"
 *
 *   2. ACADEMIC REQUIREMENTS REPORT (Degree Planning and Progress > My Academic Requirements >
 *      View Report as PDF; produced by Oracle Analytics Publisher)
 *      Two columns of requirement tables, ending with a "Course History" table that lists every
 *      course once:  Subject | Catalog # | Title | Units | Term | Grade | Type
 *        "LWELA 903 Corporations 3.00 FA 2025 B+ EN"
 *        "LWELA 910 Energy Lw and Pol 3.00 FA 2026 IP"          (in progress: no grade)
 *      Only the Course History table is read; the requirement tables above it repeat the same
 *      courses and reflect LionPATH's (miscoded) requirement lines, which is what this tool replaces.
 *
 * OUTPUT : { format, courses: Course[], terms: string[], warnings: string[] }
 *
 * PRIVACY: this module only transforms data it is handed. It makes no network requests and stores
 * nothing. It deliberately does NOT extract the student's name, ID, GPA or advisor (both documents
 * print them in the header): the audit doesn't need them, so the page can never display or copy them.
 *
 * Layers:
 *   extractPdfPages(pdfjs, bytes)  browser only: pdf.js → positioned text items per page.
 *   parsePdfPages(pages)           pure: detects the format, rebuilds lines, parses courses.
 *   parseAnyText(text)             pure: same, for text pasted into the page.
 *   parseTranscriptText(text)      pure: advising transcript lines → courses.
 *   parseReportLines(lines)        pure: requirements report lines → courses (Course History).
 * Everything except extractPdfPages runs in Node, so the tests exercise the real parsing code.
 */

/**
 * @typedef {Object} Course
 * @property {string} term          "Fall 2026"
 * @property {string} subject       "LWSEM"
 * @property {string} number        "997"
 * @property {string} code          "LWSEM 997"
 * @property {string} description   title as printed: "Special Topics"
 * @property {string|null} topic    Course Topic printed under a Special Topics course
 * @property {number} attempted     credits attempted / units
 * @property {number} earned        credits earned (0 while in progress, withdrawn or failed)
 * @property {string|null} grade    "A-", "CR", "TR", … or null when no grade yet
 * @property {number} line          1-based line number in the extracted text (for warnings)
 */

/** @typedef {{x:number, y:number, w:number, str:string}} Item   one pdf.js text fragment */
/** @typedef {{width:number, items:Item[]}} Page */
/** @typedef {{page:number, col:number, x:number, y:number, text:string}} Line */

// ------------------------------------------------------------------------------------------------
// Shared helpers
// ------------------------------------------------------------------------------------------------

// "Course Topic: Standards of Review" (transcript) or "Course Topic: 32 - Application and
// Strategies" (report). The report prefixes a section number, which is not part of the topic.
const TOPIC_RE = /^Course Topic:\s*(?:\d+\s*-\s*)?(.+)$/i;

// Grades that earn no credit (ASSUMPTION A11 in rules.js).
const NO_CREDIT_GRADES = new Set(["W", "WN", "WF", "LD", "F", "NC", "I", "NR"]);

const SEASONS = { FA: "Fall", SP: "Spring", SU: "Summer", SM: "Summer" };

// ------------------------------------------------------------------------------------------------
// Format 1: Advising Transcript
// ------------------------------------------------------------------------------------------------

// "Fall 2024" / "Spring 2025" / "Summer 2026" alone on a line starts a term section.
const TERM_RE = /^(Fall|Spring|Summer)\s+(\d{4})$/;

// A course row, after whitespace is collapsed. Examples from a real transcript:
//   "PSLFY 900 CIVIL PROCEDURE 4.000 4.000 B 12.000"                 graded
//   "LWELA 973 Introduction to Private Wealt 1.000 1.000 CR 0.000"   credit/no-credit
//   "LWELA 910 Energy Lw and Pol 3.000 0.000 0.000"                  in progress: earned 0, no grade
// Groups: subject, number, description, attempted, earned, grade (optional), points.
const COURSE_RE =
  /^([A-Z]{2,6})\s+(\d{3}[A-Z]?)\s+(.+?)\s+(\d+\.\d{3})\s+(\d+\.\d{3})(?:\s+([A-Z]{1,2}[+-]?))?\s+(\d+\.\d{3})$/;

/**
 * Parse Advising Transcript text into courses.
 * @param {string} text  Whole transcript as text, one printed line per line.
 * @returns {{courses: Course[], terms: string[], warnings: string[]}}
 */
export function parseTranscriptText(text) {
  const courses = [];
  const terms = [];
  const warnings = [];
  let term = null;
  let last = null; // the course a following "Course Topic:" line belongs to

  const lines = String(text).split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.replace(/\s+/g, " ").trim();
    if (!line) return;

    const t = line.match(TERM_RE);
    if (t) {
      term = `${t[1]} ${t[2]}`;
      if (!terms.includes(term)) terms.push(term);
      last = null;
      return;
    }

    const topic = line.match(TOPIC_RE);
    if (topic) {
      if (last) last.topic = topic[1].trim();
      else warnings.push(`Line ${i + 1}: "Course Topic" with no course above it was ignored.`);
      return;
    }

    const c = line.match(COURSE_RE);
    if (c) {
      if (!term) {
        warnings.push(`Line ${i + 1}: course ${c[1]} ${c[2]} appears before any term heading and was ignored.`);
        return;
      }
      last = {
        term,
        subject: c[1],
        number: c[2],
        code: `${c[1]} ${c[2]}`,
        description: c[3].trim(),
        topic: null,
        attempted: Number(c[4]),
        earned: Number(c[5]),
        grade: c[6] ?? null,
        line: i + 1,
      };
      courses.push(last);
      return;
    }
    // Other lines (headers, "Term GPA …", "Program: …", footers) are not needed. A line shaped like
    // a course that didn't parse is reported, so a LionPATH layout change shows up as a visible
    // warning instead of silently missing courses.
    if (/^[A-Z]{2,6}\s+\d{3}[A-Z]?\s/.test(line) && /\d+\.\d{3}/.test(line)) {
      warnings.push(`Line ${i + 1}: looks like a course but could not be read: "${line}"`);
    }
    // A "Course Topic:" line belongs to the course row directly above it; anything in between ends that.
    last = null;
  });

  return { courses, terms, warnings };
}

// ------------------------------------------------------------------------------------------------
// Format 2: Academic Requirements report (Course History table)
// ------------------------------------------------------------------------------------------------

// A Course History row, after whitespace is collapsed. Examples (synthetic, same shape as LionPATH):
//   "LWELA 903 Corporations 3.00 FA 2025 B+ EN"
//   "PSLFY 908 LEG RES TLS & STRT2.00 FA 2024 B+ EN"   title and units printed with no space between
//   "LWELA 910 Energy Lw and Pol 3.00 FA 2026 IP"      in progress: no grade, type IP
// Groups: subject, number, title, units, season, year, grade (optional), type.
// Type: EN = enrollment, TR = transfer, TE = test credit, IP = in progress (legend on the report).
const HISTORY_RE =
  /^([A-Z]{3,6})\s?(\d{3}[A-Z]?)\s+(.+?)\s*(\d{1,2}\.\d{2})\s+(FA|SP|SU|SM)\s+(\d{4})(?:\s+([A-Z]{1,2}[+-]?))?\s+(EN|TR|TE|IP)$/;

// Report header/footer lines that must never be glued onto a course title.
const REPORT_NOISE_RE = /GPA rounds|Page \d+ of \d+|Cum GPA|Report Generated|Campus:|Advisor:|Level:|EN = Enrollment|:\s*\d{9}\b/;

/**
 * Parse an Academic Requirements report into courses, from its Course History table.
 *
 * Lines must be in reading order with columns kept apart (itemsToLines with splitColumns), because
 * the table can start in the right column of one page and continue in the left column of the next.
 *
 * A title too long for its cell wraps onto the next printed line, e.g.
 *     "LWSEM 965 Workers' 3.00 FA 2025 A- EN"
 *     "Compensation Law"
 * A line is treated as a wrap only when it (a) sits within WRAP_GAP points below the row, in the same
 * page and column, and (b) starts to the right of the row's first item (it's in the Title column).
 * Without positions (pasted text) wraps can't be recognized and the shorter title is kept, which
 * still resolves correctly because engine.js matches courses by code via the catalog.
 *
 * @param {Line[]} lines
 * @returns {{courses: Course[], terms: string[], warnings: string[]}}
 */
export function parseReportLines(lines) {
  const WRAP_GAP = 14;
  const courses = [];
  const terms = [];
  const warnings = [];
  const start = lines.findIndex((l) => /^Course History$/i.test(l.text.trim()));
  if (start === -1) {
    warnings.push("This looks like a LionPATH requirements report, but its Course History table wasn't found.");
    return { courses, terms, warnings };
  }

  let last = null; // most recent course row (for wraps and Course Topic lines)
  let lastLine = null; // the line that row, or its latest wrap, came from
  for (let i = start + 1; i < lines.length; i++) {
    const L = lines[i];
    const text = L.text.replace(/\s+/g, " ").trim();
    if (!text || /^Subject\b.*\bGrade\b/i.test(text)) continue; // table header

    const topic = text.match(TOPIC_RE);
    if (topic) {
      if (last) last.topic = topic[1].trim();
      continue;
    }

    const m = text.match(HISTORY_RE);
    if (m) {
      const [, subject, number, title, units, season, year, grade, type] = m;
      const term = `${SEASONS[season]} ${year}`;
      if (!terms.includes(term)) terms.push(term);
      const g = type === "TR" || type === "TE" ? grade ?? type : grade ?? null; // transfer/test credit
      last = {
        term,
        subject,
        number,
        code: `${subject} ${number}`,
        description: title.trim(),
        topic: null,
        attempted: Number(units),
        earned: g == null || NO_CREDIT_GRADES.has(g) ? 0 : Number(units),
        grade: g,
        line: i + 1,
      };
      courses.push(last);
      lastLine = L;
      continue;
    }

    const isWrap =
      last && lastLine && !REPORT_NOISE_RE.test(text) &&
      L.page === lastLine.page && L.col === lastLine.col &&
      lastLine.y - L.y > 0 && lastLine.y - L.y <= WRAP_GAP &&
      L.x > lastLine.x + 20;
    if (isWrap) {
      last.description = `${last.description} ${text}`;
      lastLine = L;
      continue;
    }
    if (/^[A-Z]{3,6}\s?\d{3}[A-Z]?\s/.test(text) && /\d+\.\d{2}/.test(text) && /\b(FA|SP|SU) \d{4}\b/.test(text)) {
      warnings.push(`Course History line ${i + 1} looks like a course but could not be read: "${text}"`);
    }
    last = REPORT_NOISE_RE.test(text) ? last : null;
    lastLine = null;
  }
  return { courses, terms, warnings };
}

// ------------------------------------------------------------------------------------------------
// From PDF positions to lines
// ------------------------------------------------------------------------------------------------

/**
 * Group positioned text items into printed lines.
 *
 * Items whose baselines are within Y_TOLERANCE points form one line, joined left to right.
 * With splitColumns, each page is first divided at its horizontal midpoint and the left column is
 * read top to bottom before the right column — the reading order of the two-column requirements
 * report. Without it (advising transcript), each line spans the full page width.
 *
 * @param {Page[]} pages
 * @param {{splitColumns?: boolean}} [opts]
 * @returns {Line[]}
 */
export function itemsToLines(pages, { splitColumns = false } = {}) {
  const Y_TOLERANCE = 2;
  const out = [];
  pages.forEach((page, p) => {
    const mid = page.width / 2;
    const cols = splitColumns
      ? [page.items.filter((it) => it.x < mid), page.items.filter((it) => it.x >= mid)]
      : [page.items];
    cols.forEach((items, col) => {
      const rows = []; // { y, items }
      for (const it of items) {
        if (!it.str.trim()) continue;
        let row = rows.find((r) => Math.abs(r.y - it.y) <= Y_TOLERANCE);
        if (!row) rows.push((row = { y: it.y, items: [] }));
        row.items.push(it);
      }
      rows.sort((a, b) => b.y - a.y); // PDF y grows upward: top of page first
      for (const r of rows) {
        r.items.sort((a, b) => a.x - b.x);
        out.push({ page: p + 1, col, x: r.items[0].x, y: r.y, text: r.items.map((i) => i.str.trim()).join(" ") });
      }
    });
  });
  return out;
}

/**
 * Which LionPATH document is this? The requirements report has a "Course History" table and a
 * "Report Generated on" header; the advising transcript has neither.
 * @param {Page[]} pages
 * @returns {"requirementsReport"|"advisingTranscript"}
 */
export function detectFormat(pages) {
  const strs = pages.flatMap((p) => p.items.map((i) => i.str.trim()));
  const isReport = strs.includes("Course History") || strs.some((s) => s.startsWith("Report Generated on"));
  return isReport ? "requirementsReport" : "advisingTranscript";
}

/**
 * Parse a PDF's pages (from extractPdfPages, or synthetic pages in the tests).
 * @param {Page[]} pages
 * @returns {{format:string, courses: Course[], terms: string[], warnings: string[]}}
 */
export function parsePdfPages(pages) {
  const format = detectFormat(pages);
  const result =
    format === "requirementsReport"
      ? parseReportLines(itemsToLines(pages, { splitColumns: true }))
      : parseTranscriptText(itemsToLines(pages).map((l) => l.text).join("\n"));
  return finish({ format, ...result });
}

/**
 * Parse text pasted into the page. Tries the advising transcript format first, then the Course
 * History rows of a requirements report (wrapped titles can't be rejoined without positions).
 * @param {string} text
 */
export function parseAnyText(text) {
  const transcript = parseTranscriptText(text);
  if (transcript.courses.length) return finish({ format: "advisingTranscript", ...transcript });
  const lines = String(text).split(/\r?\n/).map((t, i) => ({ page: 1, col: 0, x: 0, y: -i * 100, text: t }));
  if (!lines.some((l) => /^Course History$/i.test(l.text.trim()))) lines.unshift({ page: 1, col: 0, x: 0, y: 100, text: "Course History" });
  const report = parseReportLines(lines);
  if (report.courses.length) return finish({ format: "requirementsReport", ...report });
  return finish({ format: "unknown", ...transcript });
}

function finish(result) {
  if (!result.courses.length) {
    result.warnings.push(
      "No courses were found. Use the LionPATH Advising Transcript (Academic Records > View Advising " +
      "Transcript) or the requirements report (My Academic Requirements > View Report as PDF).",
    );
  }
  return result;
}

/**
 * Read positioned text from a PDF with pdf.js (browser only).
 * @param {object} pdfjs      the imported pdf.js module (vendor/pdf.min.js)
 * @param {Uint8Array} bytes  the PDF contents, read locally with File.arrayBuffer(); never uploaded
 * @returns {Promise<Page[]>}
 */
export async function extractPdfPages(pdfjs, bytes) {
  // isEvalSupported:false and disableFontFace:true: pdf.js does not need to evaluate code or load
  // fonts to read text, and both would need looser CSP settings.
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, disableFontFace: true }).promise;
  const pages = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const [x0, , x1] = page.view;
      pages.push({
        width: x1 - x0,
        items: content.items
          .filter((it) => "str" in it && it.str.trim())
          .map((it) => ({ x: it.transform[4], y: it.transform[5], w: it.width, str: it.str })),
      });
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return pages;
}
