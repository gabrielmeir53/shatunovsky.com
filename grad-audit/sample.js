/**
 * sample.js: a SYNTHETIC Class of 2027 transcript (no real student data), used by the page's
 * "Try the sample transcript" button, by the tests, and by tools/make-sample-transcript.mjs to write
 * sample-transcript.pdf. Kept as a module so the page can load it without a network request.
 *
 * The sample student exercises every LionPATH miscode and the trickier rules:
 *   - LWSEM 997 with a "Course Topic:" line            → writing seminar (subject LWSEM; topic, A9)
 *   - LWREQ 934                                        → Professional Responsibility, post-merger code
 *   - Employment Discrimination / Election Law         → 303(c) via the Intranet list
 *   - LWEXP + LWCLI courses                            → experiential (LionPATH counts 0)
 *   - PSLFY 907 Criminal Procedure                     → on the 303(c) list but first-year (A4)
 *   - a CR grade                                       → counts, flagged "verify" (A2)
 *   - a C- grade                                       → earns credit, not C-or-better rules (A11)
 *   - a W grade                                        → no credit, satisfies nothing (A11)
 *   - a current term without grades + a future term    → "in progress" vs "enrolled" (A3)
 */

/** [subject, number, description, attempted, earned, grade|null, topic?] per term. */
export const SAMPLE_TERMS = [
  ["Fall 2024", [
    ["PSLFY", "900", "CIVIL PROCEDURE", 4, 4, "B+"],
    ["PSLFY", "908", "LEG RES TLS & STRT", 2, 2, "A-"],
    ["PSLFY", "910", "CRIMINAL LAW", 3, 3, "B"],
    ["PSLFY", "912", "APP LEG ANL & WR I", 3, 3, "B"],
    ["PSLFY", "925", "TORTS", 4, 4, "B-"],
  ]],
  ["Spring 2025", [
    ["PSLFY", "903", "CON LAW I", 3, 3, "B"],
    ["PSLFY", "905", "CONTRACTS", 4, 4, "B+"],
    ["PSLFY", "907", "CRIMINAL PROCEDURE", 3, 3, "A-"], // on the 303(c) list, but first-year: never counts (A4)
    ["PSLFY", "914", "APP LEG AN & WR II", 2, 2, "B"],
    ["PSLFY", "920", "PROPERTY", 4, 4, "B"],
  ]],
  ["Fall 2025", [
    ["LWELA", "903", "Corporations", 3, 3, "B"],
    ["LWELA", "949", "Basic Fed Inc Tax", 3, 3, "C-"], // credit counts toward 88, not toward Taxation
    ["LWREQ", "934", "Prof Resp", 3, 3, "B+"],
    ["LWSEM", "997", "Special Topics", 2, 2, "A-", "Standards of Review"],
    ["LWEXP", "957", "Client Counseling", 2, 2, "A"],
    ["LWELA", "918", "Remedies", 3, 0, "W"], // withdrawn
  ]],
  ["Spring 2026", [
    ["LWELA", "955", "Evidence", 3, 3, "B"],
    ["LWELA", "986", "Fed Securities Reg", 3, 3, "B+"],
    ["LWELA", "922", "Corp Val in M&A", 1, 1, "A"],
    ["LWELA", "973", "Introduction to Private Wealt", 1, 1, "CR"],
    ["LWELA", "964", "Employment Discrim", 3, 3, "B"],
    ["LWEXP", "936", "Neg & Dis Res Des", 3, 3, "B+"],
  ]],
  ["Fall 2026", [
    ["LWELA", "921", "Bus Pln for M&A I", 3, 0, null],
    ["LWELB", "954", "Election Law", 2, 0, null],
    ["LWCLI", "925", "Entrepreneur Asst Clinic", 4, 0, null],
    ["LWELA", "910", "Energy Lw and Pol", 3, 0, null],
    ["LWELA", "904", "Health Law", 3, 0, null],
  ]],
  ["Spring 2027", [
    ["LWELA", "918", "Remedies", 3, 0, null],
    ["LWELA", "963", "Con Law II", 3, 0, null],
    ["LWELA", "908", "Employee Benefits Law", 3, 0, null],
    ["LWELB", "900", "Fund Skill Bar Ex", 2, 0, null],
    ["LWELA", "976", "Advanced Torts", 3, 0, null],
  ]],
];

const POINTS = { A: 4, "A-": 3.67, "B+": 3.33, B: 3, "B-": 2.67, "C+": 2.33, C: 2, "C-": 1.67, "D+": 1.33, D: 1, F: 0 };

/**
 * The transcript as printed lines (with column padding like LionPATH's). The same lines are drawn
 * into the PDF, so a test can check the parser against them without a PDF reader.
 * @returns {string[]}
 */
export function sampleTranscriptLines() {
  const f = (n) => n.toFixed(3);
  const L = [
    "Penn State Law Advising Transcript",
    "Name:       SAMPLE STUDENT (SYNTHETIC RECORD - NOT A REAL STUDENT)",
    "Student ID: 000000000",
    "Beginning of Penn State Law Record",
  ];
  let cumA = 0, cumE = 0, cumP = 0;
  for (const [term, rows] of SAMPLE_TERMS) {
    L.push(term, "Program:    Penn State Law (JD)", "Plan:       Law (JD) Major");
    L.push("Course     Description                       Attempted   Earned   Grade   Points");
    let tA = 0, tE = 0, tP = 0;
    for (const [subj, num, desc, att, earned, grade, topic] of rows) {
      const pts = grade in POINTS ? POINTS[grade] * earned : 0;
      L.push(`${subj.padEnd(6)} ${num.padEnd(4)} ${desc.padEnd(32)} ${f(att).padStart(8)} ${f(earned).padStart(8)}   ${(grade ?? "").padEnd(3)} ${f(pts).padStart(8)}`);
      if (topic) L.push(`Course Topic:    ${topic}`);
      tA += att; tE += earned; tP += pts;
    }
    cumA += tA; cumE += tE; cumP += tP;
    // Totals lines: present on real transcripts, ignored by the parser.
    L.push(`Term Totals ${f(tA)} ${f(tE)} ${f(tP)}`, `Cum Totals ${f(cumA)} ${f(cumE)} ${f(cumP)}`);
  }
  L.push("End of Penn State Law Record", "SYNTHETIC SAMPLE GENERATED FOR TESTING");
  return L;
}

