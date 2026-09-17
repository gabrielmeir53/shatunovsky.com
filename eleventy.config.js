// Eleventy builds only the pages that have been moved into _src/ (content lives in content/*.json,
// edited through Pages CMS — see .pages.yml). Everything else is copied through untouched, so the
// output in _site/ is the same plain static site that used to be deployed straight from the repo root.
export default function (eleventyConfig) {
  for (const path of [
    "*.html", "css", "js", "fonts", "assets", "softball",
    "favicon.ico", "favicon.svg", "apple-touch-icon.png", "robots.txt", "sitemap.xml", ".nojekyll",
  ]) {
    eleventyConfig.addPassthroughCopy(path);
  }

  // Titles are plain text in the editor; *asterisks* become italics (case names).
  eleventyConfig.addFilter("inlineItalics", (value) => {
    const escaped = String(value ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    return escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  });

  // Rich-text fields arrive as HTML. One paragraph becomes <p class="…">; several become a
  // <div class="…"> holding the paragraphs, so the markup stays valid either way.
  eleventyConfig.addFilter("richBlock", (html, className) => {
    const s = String(html ?? "").trim();
    if (!s) return "";
    const single = s.match(/^<p>([\s\S]*)<\/p>$/);
    if (single && !/<\/p>\s*<p[ >]/.test(single[1])) return `<p class="${className}">${single[1]}</p>`;
    return /^<(p|ul|ol|div|blockquote)[ >]/.test(s) ? `<div class="${className}">${s}</div>` : `<p class="${className}">${s}</p>`;
  });

  return {
    dir: { input: "_src", includes: "_includes", data: "../content", output: "_site" },
    htmlTemplateEngine: "njk",
    templateFormats: ["njk"],
  };
}
