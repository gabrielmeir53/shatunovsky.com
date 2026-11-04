#!/usr/bin/env node
/**
 * make-sample-transcript.mjs: writes the two SYNTHETIC sample PDFs used for demos and testing.
 * They contain no real student data.
 *   sample-transcript.pdf           laid out like the LionPATH Advising Transcript
 *   sample-requirements-report.pdf  laid out like LionPATH's My Academic Requirements report
 *
 * The student, courses and layouts are defined in ../sample.js (shared with the page and the tests).
 *
 * The PDF is written by hand (no libraries): one Courier font, one positioned text object per
 * fragment, so pdf.js returns the same positions the real documents produce.
 *
 * Usage: node grad-audit/tools/make-sample-transcript.mjs
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { sampleTranscriptLines, sampleReportPages } from "../sample.js";

/** Escape text for a PDF string literal. */
const pdfStr = (s) => `(${s.replace(/[\\()]/g, (m) => "\\" + m)})`;

/** Lay the transcript's lines out as positioned items: Letter pages, LINES_PER_PAGE lines each. */
function linesToPages(lines) {
  const LINES_PER_PAGE = 70, TOP = 760, LEADING = 10.5, LEFT = 36;
  const pages = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    pages.push({ width: 612, items: lines.slice(i, i + LINES_PER_PAGE).map((str, j) => ({ x: LEFT, y: TOP - j * LEADING, str })) });
  }
  return pages;
}

/** Build a minimal, valid PDF from pages of positioned text items (Courier 8pt, Letter size). */
function buildPdf(pages) {
  const objects = []; // index 0 → object 1
  const add = (body) => objects.push(body) && objects.length;
  const catalogId = add(null);
  const pagesId = add(null);
  const fontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>");
  const pageIds = pages.map((page) => {
    // One BT/ET block per fragment, each absolutely positioned, as report generators do; the
    // page's parser regroups fragments by baseline either way.
    const ops = page.items.map((it) => `BT /F1 ${it.size ?? 7} Tf 1 0 0 1 ${it.x} ${it.y.toFixed(1)} Tm ${pdfStr(it.str)} Tj ET`).join("\n");
    const contentId = add(`<< /Length ${Buffer.byteLength(ops, "latin1")} >>\nstream\n${ops}\nendstream`);
    return add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
  });
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let out = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const outputs = {
    "sample-transcript.pdf": linesToPages(sampleTranscriptLines()).map((p) => ({ ...p, items: p.items.map((i) => ({ ...i, size: 8 })) })),
    "sample-requirements-report.pdf": sampleReportPages(),
  };
  for (const [name, pages] of Object.entries(outputs)) {
    await writeFile(path.join(dir, name), buildPdf(pages));
    console.log(`wrote ${path.relative(process.cwd(), path.join(dir, name))}`);
  }
}
