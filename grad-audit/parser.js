/**
 * parser.js: read a LionPATH "Penn State Law Advising Transcript" into structured course records.
 *
 * INPUT  : the PDF students download from LionPATH (Academic Records > Advising Transcript), or the
 *          same text pasted into the page.
 * OUTPUT : { courses: Course[], terms: string[], warnings: string[] }
 *
 * PRIVACY: this module only transforms data it is handed. It makes no network requests and stores
 * nothing. It deliberately does NOT extract the student's name or ID: the audit doesn't need them,
 * and leaving them out means they can never be displayed, logged or copied by the page.
 *
 * Two layers:
 *   extractPdfLines(pdfjs, bytes)  browser only; uses pdf.js to rebuild text LINES from the PDF.
 *   parseTranscriptText(text)      pure; turns lines into courses. Used by the page AND the Node
 *                                  tests, so the parsing rules are tested without a browser.
 */

/**
 * @typedef {Object} Course
 * @property {string} term          "Fall 2026"
 * @property {string} subject       "LWSEM"
 * @property {string} number        "997"
 * @property {string} code          "LWSEM 997"
 * @property {string} description   transcript description as printed: "Special Topics"
 * @property {string|null} topic    "Course Topic:" line under the course, e.g. "Standards of Review"
 * @property {number} attempted     credits attempted (3.000 → 3)
 * @property {number} earned        credits earned (0 while in progress)
 * @property {string|null} grade    "A-", "CR", … or null when no grade yet
 * @property {number} line          1-based line number in the extracted text (for warnings)
 */

// "Fall 2024" / "Spring 2025" / "Summer 2026" alone on a line starts a term section.
const TERM_RE = /^(Fall|Spring|Summer)\s+(\d{4})$/;

// A course row, after whitespace is collapsed. Examples from a real transcript:
//   "PSLFY 900 CIVIL PROCEDURE 4.000 4.000 B 12.000"      graded
//   "LWELA 973 Introduction to Private Wealt 1.000 1.000 CR 0.000"   credit/no-credit
//   "LWELA 910 Energy Lw and Pol 3.000 0.000 0.000"       in progress: earned 0, no grade
// Groups: subject, number, description, attempted, earned, grade (optional), points.
const COURSE_RE =
  /^([A-Z]{2,6})\s+(\d{3}[A-Z]?)\s+(.+?)\s+(\d+\.\d{3})\s+(\d+\.\d{3})(?:\s+([A-Z]{1,2}[+-]?))?\s+(\d+\.\d{3})$/;

// "Course Topic: Standards of Review" — printed on the line after a Special Topics course.
const TOPIC_RE = /^Course Topic:\s*(.+)$/i;

/**
 * Parse transcript text into courses.
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
    // Any other line (headers, "Term GPA …", "Program: …", page footers) is not needed.
    // A line that has a course-code shape but didn't parse is reported, so layout changes in
    // LionPATH show up as a visible warning instead of silently missing courses.
    if (/^[A-Z]{2,6}\s+\d{3}[A-Z]?\s/.test(line) && /\d+\.\d{3}/.test(line)) {
      warnings.push(`Line ${i + 1}: looks like a course but could not be read: "${line}"`);
    }
    // A "Course Topic:" line belongs to the course row directly above it; anything in between ends that.
    last = null;
  });

  if (!courses.length) {
    warnings.push(
      "No courses were found. Use the LionPATH Advising Transcript (Academic Records > Advising " +
      "Transcript), not the degree audit or a printed web page.",
    );
  }
  return { courses, terms, warnings };
}

/**
 * Rebuild printed lines from a PDF with pdf.js (browser only).
 *
 * pdf.js returns text as positioned fragments, not lines. Fragments whose baselines are within
 * Y_TOLERANCE points are treated as one line and joined left-to-right; that reproduces the row
 * layout parseTranscriptText expects ("PSLFY 900 CIVIL PROCEDURE 4.000 4.000 B 12.000").
 *
 * @param {object} pdfjs   the imported pdf.js module (vendor/pdf.min.js)
 * @param {Uint8Array} bytes  the PDF file contents, read locally with FileReader; never uploaded
 * @returns {Promise<string>} the text, one line per printed line, pages in order
 */
export async function extractPdfLines(pdfjs, bytes) {
  const Y_TOLERANCE = 2;
  // isEvalSupported:false and disableFontFace:true: pdf.js does not need to evaluate code or load
  // fonts to read text, and both would need looser CSP settings.
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, disableFontFace: true }).promise;
  const out = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const rows = []; // { y, items: [{x, str}] }
      for (const item of content.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        const x = item.transform[4];
        const y = item.transform[5];
        let row = rows.find((r) => Math.abs(r.y - y) <= Y_TOLERANCE);
        if (!row) rows.push((row = { y, items: [] }));
        row.items.push({ x, str: item.str });
      }
      rows.sort((a, b) => b.y - a.y); // PDF y grows upward: top of page first
      for (const r of rows) out.push(r.items.sort((a, b) => a.x - b.x).map((i) => i.str.trim()).join(" "));
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return out.join("\n");
}
