# Class of 2027 Graduation Audit: handoff for PSDL IT

**Demo:** https://shatunovsky.com/grad-audit/ (the "Try a sample" buttons load a synthetic student)
**Author:** Gabriel Shatunovsky (J.D. '27, University Park), gabriel@shatunovsky.com
**Status:** a working prototype on a personal site, offered to be moved to a Penn State host or used as the spec for fixing LionPATH. It is not an official Penn State system.

---

## 1. Overview

University Park J.D. students admitted **before Fall 2025** (the Class of 2027) are audited in LionPATH against the pre-merger requirement rules. Those rules only recognize pre-merger course subjects (`PRORP`, `ULWR`/`AULWR`, `EXPR`). Since the merger, the same requirements are met by courses coded `LWREQ`, `LWSEM`, `LWEXP`, `LWCLI` and `LWEXT`, so the LionPATH audit reports four requirements as **Not Satisfied** for students who have met them.

This folder contains:

- a **static web page** that reads either of two LionPATH PDFs (the *Advising Transcript* or the *My Academic Requirements* report) and produces a corrected audit, a reference list of where LionPATH's audit differs and why, concentration progress and remaining-semester options;
- a **course crosswalk** of all 202 current PSDL courses in the Bulletin, showing which requirement and concentrations each one counts toward;
- **`rules.js`**, every rule as reviewable data with its source. It can serve directly as the specification for fixing the LionPATH requirement lines (Option A below).

## 2. Problem evidence

Observed in LionPATH › Degree Planning and Progress › **My Academic Requirements** on 11/04/2026 for a Class of 2027 student:

| Audit line | LionPATH accepts | Post-merger course that should count | LionPATH shows |
|---|---|---|---|
| Upper Level Writing Seminar | `AULWR` 900-level, `ULWR` 900-level | `LWSEM 997` (topic: Standards of Review) | Not Satisfied, 0 of 1 |
| Professional Responsibility | `PRORP 934` only | `LWREQ 934` | Not Satisfied, 0 of 1 |
| ABA 303(c) Course | no course list attached | `LWELA 965` Immigration Law (on the Intranet 303(c) list) | Not Satisfied, 0 of 1 unit |
| Required Experiential Learning Credits | LWEXP not recognized | `LWEXP 932`, `LWEXP 936` | Not Satisfied, 0 of 6 |
| Total credits, 1L core, electives | n/a | n/a | correct |

The J.D. Requirement Checklist for this cohort (last updated 10/20/2025) already says the new codes count: Professional Responsibility is "PRORP 934" **or** "LWREQ 934"; the seminar is "ULWR" **or** "LWSEM"; experiential is externship, clinic, "EXPR" **or** "LWEXP". The Bulletin no longer lists the `PRORP`, `ULWR` or `EXPR` subjects at all, so these audit lines can't be satisfied by any course a Class of 2027 student can take.

LionPATH's *View Graduation Status* and *Apply for Graduation* currently show the student as not eligible. That is expected in Fall 2026 because the application isn't open yet. Whether eligibility will later depend on these audit lines should be confirmed; if it does, every affected student will be blocked until the lines are fixed.

## 3. Two ways to use this

### Option A: fix the LionPATH requirement lines (the real fix)

These are the changes, one per line. `rules.js` › `REQUIREMENTS[*].lionpath.fix` holds the same text.

1. **Upper Level Writing Seminar:** add `LWSEM` 900-level (all LWSEM courses) alongside AULWR/ULWR.
2. **Professional Responsibility:** add `LWREQ 934` alongside PRORP 934.
3. **ABA 303(c):** attach the Intranet 303(c) course list. Where a course has its own catalog number, use the course ID (the crosswalk on the page lists 33 catalog courses tagged 303(c)). For courses taught as Special Topics (`LWSEM 997`, `LWELA 997/999`, `LWEXP 997`), match on the topic. The full list is in `data/intranet-lists.js`.
4. **Required Experiential Learning Credits:** add `LWEXP`, `LWCLI` and `LWEXT` 900-level courses.
5. Keep the no-double-counting rule: seminar, 303(c) and experiential must come from different courses, except that experiential credit beyond 6 may go to 303(c).

### Option B: host this page at Penn State

The page is static files with no server code. To move it:

1. Copy the `grad-audit/` folder to any web server (e.g., a `dickinsonlaw.psu.edu` path). The server must send `.js` files as `Content-Type: text/javascript` (module scripts are refused otherwise); SharePoint document libraries generally do not serve scripts this way.
2. Optionally put it behind Penn State WebAccess. The page needs no identity, because it never reads names or IDs.
3. Send the Content-Security-Policy as an HTTP header too, adding `frame-ancestors 'none'` (a meta tag can't set that):
   ```
   Content-Security-Policy: default-src 'none'; script-src 'self'; worker-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'
   ```
4. `index.html` links `../css/style.css` and `/favicon.svg` from the personal site. Copy those or replace them with PSU styling; `audit.css` holds everything page-specific.
5. Remove the `shatunovsky.com` references in `index.html` and this document.
6. Caching: the demo host (Cloudflare) caches `.js`/`.css` for 4 hours, so `index.html` loads `app.js?v=N` and `audit.css?v=N`. Bump `N` when those files change, or serve `grad-audit/` with a short cache lifetime. If a data or engine module changes, purge the cache or version its import as well.

## 4. Inputs

The parser detects which LionPATH document it was given (`parser.js` `detectFormat()`):

| Document | Where students get it | How it's read |
|---|---|---|
| Advising Transcript | Academic Records › View Advising Transcript | Single column; term headings ("Fall 2025") followed by course rows with attempted/earned/grade/points. |
| Academic Requirements report (Oracle Analytics Publisher) | Degree Planning and Progress › My Academic Requirements › View Report as PDF | Two columns per page. Only the closing **Course History** table is read (Subject, Catalog #, Title, Units, Term, Grade, Type). It lists every course once, and it can run from the right column of one page into the left column of the next. The requirement tables above it are ignored: they repeat courses and reflect LionPATH's miscoded lines. Wrapped titles are rejoined using text positions, and "Course Topic: NN - Topic" loses its section number. |

Both produce the same course records, and a test checks that the synthetic student gives identical audits from either PDF. Synthetic samples of both are included: `sample-transcript.pdf` and `sample-requirements-report.pdf`.

## 5. Architecture

```
  student's PDF ──► parser.js ──────────► engine.js ─────────────► app.js ──► page
  (read locally     extractPdfPages()      runAudit()                 renders with
   by the browser)  parsePdfPages()        describeCatalog()          textContent only
                         ▲                     ▲
                    vendor/pdf.js        rules.js + data/*.js
                    (pinned 4.10.38)     (all rules and lists)
```

Everything runs in the browser. There is no build step: the files are plain ES modules you can read top to bottom.

## 6. Data and privacy (FERPA)

- **Nothing leaves the browser.** The PDF is read with `File.arrayBuffer()` and parsed in memory. `connect-src 'none'` in the CSP makes the browser refuse every `fetch`, XHR, WebSocket and beacon, so even a bug could not upload a transcript.
- **Nothing is stored.** No cookies, localStorage, IndexedDB or service worker. Reloading the page clears it.
- **No identity is read.** `parser.js` never extracts the name, student ID, GPA or advisor that both documents print in their headers; the test suite checks this for both formats.
- **No third-party code.** pdf.js is vendored (`vendor/`, Apache-2.0, `vendor/pdfjs-LICENSE`) rather than loaded from a CDN. SHA-256:
  - `pdf.min.js`: `27fc2a057a00f92a4334ad06e17dbd7259912954e9fb7f76400bcca5fd190a9c`
  - `pdf.worker.min.js`: `1baa1844c89c80a5b2797c916e75ab29254be46d8e9cb53cb6364d7aad84be36`
- **Injection-safe rendering.** Transcript text is only ever inserted with `textContent` (`app.js` `h()` helper), never `innerHTML`.
- **How to verify:** open DevTools › Network, load a transcript, and confirm the only requests are the page's own files (`vendor/pdf.min.js` and `vendor/pdf.worker.min.js` load when a PDF is chosen). Requests from `chrome-extension://` URLs come from the viewer's browser extensions and are outside any page's control. A clean browser profile shows none.
- **Testing** uses only the synthetic transcript in `sample.js` / `sample-transcript.pdf`. No real student record is in the repository.

## 7. File-by-file guide

| File | What it is | Edit it when |
|---|---|---|
| `index.html` | Page shell, CSP, static text | Wording or hosting changes |
| `audit.css` | Page styles (incl. print) | Styling |
| `app.js` | Only file that touches the DOM: file input → parse → audit → render | UI changes |
| `parser.js` | LionPATH PDF (either format) or pasted text → course records | LionPATH changes either document's layout |
| `engine.js` | The audit: statuses, requirement checks, double-counting, residency, caps, concentrations, planner, crosswalk | Rule *logic* changes (rare) |
| `match.js` | Title normalization used to join lists to the catalog | A new kind of spelling difference appears |
| **`rules.js`** | **All requirements, sources, LionPATH observations, credit caps, title aliases, assumptions** | **Any rule or policy change** |
| `data/catalog.js` | 202 courses from the Bulletin (generated) | Re-run `tools/build-catalog.mjs` |
| `data/intranet-lists.js` | Seminar and 303(c) lists from the Intranet | The Intranet lists change |
| `data/concentrations.js` | 22 concentration course lists | The concentration PDF changes |
| `data/course-chart.js` | FA25–SP27 anticipated offerings | A new course chart is published |
| `sample.js`, `sample-transcript.pdf`, `sample-requirements-report.pdf` | Synthetic student in both formats, for demo and tests | Adding a test scenario |
| `tools/build-catalog.mjs` | Downloads the Bulletin's law subjects → `data/catalog.js` | Each semester |
| `tools/check-data.mjs` | Consistency report for the data files | After any data edit |
| `tools/make-sample-transcript.mjs` | Writes both sample PDFs from `sample.js` | After editing `sample.js` |
| `test/engine.test.mjs` | Tests (Node's built-in runner, no packages) | With any logic change |

## 8. How to update rules

- **A requirement changes:** edit its entry in `rules.js` › `REQUIREMENTS`. Each entry declares how a course qualifies: `codes`, `subjects`, `catalogTag` (Bulletin description says so) or `list` (Intranet list).
- **A list changes:** edit `data/intranet-lists.js` or `data/concentrations.js`, then run `node grad-audit/tools/check-data.mjs`. It lists any entry that doesn't match a catalog course: either a Special Topics or discontinued course (fine) or a typo or rename (add a `TITLE_ALIASES` entry with a `note`).
- **New semester:** run `node grad-audit/tools/build-catalog.mjs`, review the `data/catalog.js` diff, update `data/course-chart.js`, then run the checks and tests.

## 9. Tests

```
node --test grad-audit/test/engine.test.mjs       # 25 tests (+1 optional), Node 18+
node grad-audit/tools/check-data.mjs              # data consistency
```

The tests cover:
- parsing of graded, CR, withdrawn and ungraded rows, plus Course Topic lines;
- the requirements report: format detection, reading order across columns and pages, wrapped titles, glued units, ignoring requirement tables/header/footer, and an identical audit to the transcript;
- that no name or ID is captured;
- title normalization, and that every alias target exists in the catalog;
- grade minimums and in-progress vs enrolled;
- the four miscoded requirements on the synthetic student;
- first-year Criminal Procedure never counting for 303(c);
- C- and CR handling for concentrations;
- the no-double-counting cases (two seminars; an experiential course used for 303(c) only when it's excess);
- the crosswalk (Employment Discrimination: 303(c) + 7 concentrations);
- the Bulletin parser.

## 10. Assumptions (judgment calls the written rules don't settle)

The same list is in `rules.js` › `ASSUMPTIONS` and shown on the page under "How this audit decides". Each names the code that implements it, so the registrar can approve or change it in one place.

| # | Assumption | Implemented in |
|---|---|---|
| A1 | A course may count toward more than one concentration (the rules allow multiple concentrations but don't address overlap). The page warns about this. | `engine.js` `scoreConcentrations()` |
| A2 | A CR grade meets "C or better" but is flagged "verify with registrar". | `engine.js` `gradeMeets()` |
| A3 | Ungraded courses are "in progress" once the term has started (Fall ≈ Aug 15, Spring ≈ Jan 5, Summer ≈ May 15) and "enrolled" before that; both count as projected, never done. | `engine.js` `TERM_START`, `courseStatus()` |
| A4 | First-year required courses (PSLFY) never satisfy 303(c), even if the title is on the list (e.g., Criminal Procedure). | `rules.js` `aba303c.excludeFirstYear` |
| A5 | Seminar / 303(c) / experiential are assigned together, with no course used twice. The best assignment is chosen by: most satisfied, then most satisfied by completed courses, then most experiential credit. | `engine.js` `assignExclusive()` |
| A6 | Credit caps are totaled only where a subject code identifies the category; the rest are informational. | `rules.js` `CAPS`, `engine.js` `checkCaps()` |
| A7 | The January 1L Professional Development program isn't on the transcript; the student confirms it with a checkbox. | `app.js` |
| A8 | Differently named list entries are treated as the same course only through an explicit alias with a stated basis. | `rules.js` `TITLE_ALIASES` |
| A9 | Special Topics sections are matched by the topic printed on the transcript. | `engine.js` `courseTitleKeys()` |
| A10 | Concentration "Additional Experiential Opportunities" (externships, moot court, …) need Associate Dean approval, so they are never counted automatically. | `engine.js` `scoreConcentrations()` |
| A11 | W/F/incomplete earn nothing; a grade below C still earns credit toward 88 but doesn't satisfy C-or-better rules or concentrations. | `engine.js` `gradeMeets()` |

## 11. Known limitations

- **Document layouts.** The parser expects the current LionPATH *Advising Transcript* layout and the current *My Academic Requirements* PDF, whose Course History table must be present. A layout change shows up as visible "could not be read" warnings rather than silent omissions. A paste-text fallback exists, though without positions it can't rejoin wrapped report titles; codes still resolve through the catalog.
- **Snapshots.** The catalog (Bulletin, 11/04/2026), Intranet lists (Oct 2026), concentrations (Oct 2026) and course chart (9/25/2026) are snapshots and need refreshing when the sources change (see §8).
- **Not checkable from a transcript:** full tuition and the 20-hour work limit for residency, journal/moot court/mock trial caps, pass/fail elections, petitions approved by the Associate Dean, and transfer credit.
- **Scope:** University Park J.D. students admitted before Fall 2025 only. Carlisle-admitted and post-2025 students have different requirements.
