/**
 * match.js: turn course titles written in different ways into one comparable key.
 *
 * WHY THIS EXISTS
 *   The same course is spelled differently in every source the audit reconciles:
 *     Bulletin catalog:    "Business Planning for Mergers and Acquisitions I"
 *     Concentration list:  "Business Planning for M&A I"
 *     Course chart:        "Business Planning for Mergers & Acquisitions"
 *     Transcript:          "Bus Pln for MA I"
 *   A transcript title is never trusted on its own. engine.js first looks the course CODE up in the
 *   catalog to get the official title, and only falls back to the transcript text for "Special
 *   Topics" codes (LWSEM 997, LWELA 997/999, LWEXP 997), where the real title only exists on the
 *   transcript (as the description or a "Course Topic:" line).
 *
 *   titleKey() reduces each spelling to one key. Differences it can't reconcile (true renames such as
 *   "Law and Sexuality" → "Gender and Sexuality Law") are handled by explicit, reviewable entries in
 *   rules.js `titleAliases`, never by looser fuzzy matching: a wrong automatic match would silently
 *   give a student credit they don't have.
 *
 * PURE MODULE: no DOM, no network, no storage. Imported by engine.js, app.js, the tests and
 * tools/check-data.mjs.
 */

// Word-level expansions applied after lower-casing and punctuation removal. Only abbreviations that
// actually appear in the source documents and have exactly one meaning are listed.
const WORD_EXPANSIONS = {
  intro: "introduction",
  admin: "administrative",
  dvl: "development",
  orgs: "organizations",
  corp: "corporations",
  ed: "education",
  adv: "advanced",
  ip: "intellectual property",
  reg: "regulation",
};

// Parentheticals that are QUALIFIERS (about who/when the entry applies), not part of the course's
// identity. These are removed before matching. Any other parenthetical, e.g. "Contract Drafting
// (M&A Focus)" or "National Security Law I (Foundations)", is kept as words, because it is what
// distinguishes the course from a similarly named one.
const QUALIFIER_PAREN = /\((?:formerly\b|ll\.?m|special topic|\d+(?:\.\d+)?\s*credits?|[^)]*\bonly\b)[^)]*\)/gi;

// Words that never distinguish one course from another ("Tax Policy Seminar" = "Tax Policy").
// "clinic" is deliberately NOT dropped: "Family Law" and "Family Law Clinic" are different courses.
const DROP_WORDS = new Set(["the", "seminar", "a", "an"]);

/**
 * Normalize a course title to a matching key.
 *  - lower-case; curly quotes and ligatures (ﬁ, ﬂ from PDF copy) → plain text
 *  - drops QUALIFIER parentheticals: "(Formerly …)", "(special topic)", "(LLMs only)", "(1 credit)";
 *    keeps identifying ones like "(M&A Focus)" as plain words (see QUALIFIER_PAREN).
 *    Callers that need the qualifiers read parseQualifiers() first.
 *  - "M&A" → "mergers and acquisitions"; "&" → "and"; "U.S." → "us"
 *  - strips punctuation, expands WORD_EXPANSIONS, removes DROP_WORDS
 * @param {string} title
 * @returns {string} e.g. "business planning for mergers and acquisitions i"
 */
export function normalizeTitle(title) {
  let s = String(title ?? "").toLowerCase();
  s = s.replace(/[‘’ʼ]/g, "'").replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl");
  s = s.replace(QUALIFIER_PAREN, " ");
  s = s.replace(/\bm\s*&\s*a\b/g, "mergers and acquisitions");
  s = s.replace(/\bu\.s\./g, "us");
  s = s.replace(/&/g, " and ");
  s = s.replace(/'/g, "").replace(/[^a-z0-9 ]+/g, " ");
  return s.split(/\s+/).filter(Boolean)
    .flatMap((w) => (WORD_EXPANSIONS[w] ?? w).split(" "))
    .filter((w) => !DROP_WORDS.has(w))
    .join(" ");
}

/**
 * Canonical key: the normalized title, redirected through rules.js `titleAliases` if listed there.
 * @param {string} title
 * @param {Record<string,string>} [aliases]  normalized title → canonical normalized title
 * @returns {string}
 */
export function titleKey(title, aliases = {}) {
  const k = normalizeTitle(title);
  return aliases[k] ?? k;
}

/**
 * Read the qualifiers a list entry carries in parentheses.
 * @param {string} title  e.g. "Criminal Procedure (LLMs Only)"
 * @returns {{llmOnly:boolean, formerly:string|null, note:string|null}}
 *   llmOnly  : the entry applies only to LL.M. students, so it never counts for a J.D. student.
 *   formerly : the old title, e.g. "Introduction to Health Law". Also accepted as a match key, so
 *              a student who took the course under its old name still matches.
 */
export function parseQualifiers(title) {
  const paren = [...String(title).matchAll(/\(([^)]*)\)/g)].map((m) => m[1].trim());
  return {
    llmOnly: paren.some((p) => /\bLL\.?Ms?\b/i.test(p) && /only/i.test(p)),
    formerly: (paren.find((p) => /^formerly\b/i.test(p)) ?? "").replace(/^formerly\s+/i, "") || null,
    note: paren.length ? paren.join("; ") : null,
  };
}

/**
 * All keys a LIST ENTRY (concentration list, intranet list, course chart row) should match on:
 * its own title plus its "(Formerly …)" title.
 * @param {string} entry
 * @param {Record<string,string>} [aliases]
 * @returns {string[]}
 */
export function entryKeys(entry, aliases = {}) {
  const q = parseQualifiers(entry);
  const keys = [titleKey(entry, aliases)];
  if (q.formerly) keys.push(titleKey(q.formerly, aliases));
  return [...new Set(keys)].filter(Boolean);
}

/**
 * Build a Map from title key → list entries, for one list.
 * @param {string[]} entries
 * @param {Record<string,string>} [aliases]
 * @returns {Map<string,string>}  key → the entry's original text (shown to the student)
 */
export function indexEntries(entries, aliases = {}) {
  const m = new Map();
  for (const e of entries) {
    if (parseQualifiers(e).llmOnly) continue; // J.D. audit: LL.M.-only entries never count
    for (const k of entryKeys(e, aliases)) if (!m.has(k)) m.set(k, e);
  }
  return m;
}
