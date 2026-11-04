#!/usr/bin/env node
/**
 * make-sample-transcript.mjs: writes grad-audit/sample-transcript.pdf, a SYNTHETIC advising
 * transcript laid out like LionPATH's, for demos and tests. It contains no real student data.
 *
 * The student and courses are defined in ../sample.js (shared with the page and the tests).
 *
 * The PDF is written by hand (no libraries): one Courier font, one text object per line, positioned
 * in the same column order as the real transcript so the page's parser reads it the same way.
 *
 * Usage: node grad-audit/tools/make-sample-transcript.mjs
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { sampleTranscriptLines } from "../sample.js";

/** Escape text for a PDF string literal. */
const pdfStr = (s) => `(${s.replace(/[\\()]/g, (m) => "\\" + m)})`;

/** Build a minimal, valid PDF: Letter pages, Courier 8pt, LINES_PER_PAGE lines per page. */
function buildPdf(lines) {
  const LINES_PER_PAGE = 70, TOP = 760, LEADING = 10.5, LEFT = 36;
  const pages = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) pages.push(lines.slice(i, i + LINES_PER_PAGE));

  const objects = []; // index 0 → object 1
  const add = (body) => objects.push(body) && objects.length;
  const catalogId = add(null);
  const pagesId = add(null);
  const fontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>");
  const pageIds = pages.map((pageLines) => {
    // One BT/ET block per line, each absolutely positioned (Td from origin), as many PDF
    // generators do; the page parser regroups fragments by baseline either way.
    const ops = pageLines.map((t, j) => `BT /F1 8 Tf 1 0 0 1 ${LEFT} ${(TOP - j * LEADING).toFixed(1)} Tm ${pdfStr(t)} Tj ET`).join("\n");
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
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sample-transcript.pdf");
  await writeFile(file, buildPdf(sampleTranscriptLines()));
  console.log(`wrote ${path.relative(process.cwd(), file)}`);
}
