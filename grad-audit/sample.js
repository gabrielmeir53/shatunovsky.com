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


/**
 * The same synthetic student as a LionPATH "My Academic Requirements" report (View Report as PDF),
 * as positioned text items: the shape pdf.js produces from the real report. Reproduces the layout
 * details the parser has to handle:
 *   - two columns per page, Letter size (612 pt wide);
 *   - a requirement table in the left column (ignored by the parser) beside the Course History table;
 *   - Course History starting in the RIGHT column of page 1 and continuing in the LEFT column of page 2;
 *   - long titles wrapping onto the next line in the Title column;
 *   - a title and its units printed as one fragment ("LEG RES TLS & STRT2.00");
 *   - "Course Topic: NN - Topic" lines under Special Topics courses;
 *   - header (name/ID/GPA/advisor) and footer lines on every page.
 * @returns {Array<{width:number, items:Array<{x:number,y:number,w:number,str:string}>}>}
 */
export function sampleReportPages() {
  const WIDTH = 612;
  const item = (x, y, str) => ({ x, y, w: str.length * 4, str });
  const header = () => [
    item(133, 762, "SAMPLE STUDENT:"), item(214, 762, "000000000"),
    item(313, 763, "Cum GPA:"), item(355, 763, "3.000"), item(417, 763, "Advisor:"), item(417, 753, "Sample,Advisor"),
    item(133, 752, "Campus:"), item(170, 752, "University Park"), item(133, 742, "Report Generated on:"), item(218, 742, "11/04/2026"),
  ];
  const footer = (n) => [item(306, 30, "GPA rounds to 2 digits"), item(395, 30, "the final zero is a place holder"), item(517, 30, `Page ${n} of 2`)];

  // Left column of page 1: a requirement table, which repeats courses and must be ignored.
  const p1 = [...header(), item(35, 700, "Academic Requirements"), item(35, 680, "Upper Level Writing Seminar - C or higher required"),
    item(40, 670, "Not Satisfied: Complete one Upper Level Writing Seminar course"),
    item(35, 650, "Term"), item(73, 650, "Subject"), item(113, 650, "Cat #"), item(163, 650, "Course Title"), item(230, 650, "Units"), item(263, 650, "Grade"),
    item(35, 640, "FA 2026"), item(73, 640, "LWELA"), item(116, 640, "910"), item(163, 640, "Energy Lw and"), item(233, 640, "3.00"), item(262, 640, "IP"),
    item(163, 631, "Pol"),
    ...footer(1)];
  const p2 = [...header(), ...footer(2)];

  // Course History rows, in transcript order.
  const SEASON = { Fall: "FA", Spring: "SP", Summer: "SU" };
  const rows = SAMPLE_TERMS.flatMap(([term, courses]) => courses.map(([subj, num, desc, att, , grade, topic]) => {
    const [season, year] = term.split(" ");
    return { subj, num, desc, units: att.toFixed(2), term: `${SEASON[season]} ${year}`, grade, topic };
  }));

  // Column x positions for the right and left placements of the Course History table.
  const R = { subj: 317, num: 349, title: 392, units: 475, term: 503, grade: 542, type: 572 };
  const L = { subj: 29, num: 61, title: 104, units: 186, term: 214, grade: 254, type: 285 };
  p1.push(item(426, 558, "Course History"),
    item(R.subj, 547, "Subject"), item(R.num, 547, "Catalog #"), item(R.title, 547, "Title"), item(R.units, 547, "Units"), item(R.term, 547, "Term"), item(R.grade, 547, "Grade"), item(R.type, 547, "Type"));

  let page = p1, C = R, y = 538;
  rows.forEach((r, i) => {
    if (y < 60 && page === p1) { page = p2; C = L; y = 716; } // continue in page 2, left column
    // Long titles wrap at the Title column; the first PSLFY 908 row glues title and units together.
    const words = r.desc.split(" ");
    let first = r.desc, rest = null;
    if (r.desc.length > 18 && words.length > 1) {
      let cut = words.length - 1;
      while (cut > 1 && words.slice(0, cut).join(" ").length > 18) cut--;
      first = words.slice(0, cut).join(" ");
      rest = words.slice(cut).join(" ");
    }
    page.push(item(C.subj, y, r.subj), item(C.num, y, r.num));
    if (r.subj === "PSLFY" && r.num === "908") page.push(item(C.title, y, `${r.desc}${r.units}`));
    else page.push(item(C.title, y, first), item(C.units, y, r.units));
    page.push(item(C.term, y, r.term));
    if (r.grade) page.push(item(C.grade, y, r.grade), item(C.type, y, "EN"));
    else page.push(item(C.type + 2, y, "IP"));
    if (rest && !(r.subj === "PSLFY" && r.num === "908")) page.push(item(C.title, y - 9, rest));
    if (r.topic) page.push(item(C.subj + 10, y - 14, "Course Topic:"), item(C.subj + 59, y - 14, `${10 + i} - ${r.topic}`));
    y -= r.topic ? 29 : 15;
  });
  return [{ width: WIDTH, items: p1 }, { width: WIDTH, items: p2 }];
}
