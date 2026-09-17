// Eleventy builds only the pages that have been moved into _src/ (content lives in content/*.json,
// edited through Pages CMS — see .pages.yml). Everything else is copied through untouched, so the
// output in _site/ is the same plain static site that used to be deployed straight from the repo root.
import markdownIt from "markdown-it";

// Rich-text fields are stored as Markdown by the editor (never typed by hand). Raw HTML is not allowed.
const md = markdownIt({ html: false, linkify: false, typographer: false });

export default function (eleventyConfig) {
  for (const path of [
    "*.html", "css", "js", "fonts", "assets", "softball", "admin",
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

  // Render a rich-text (Markdown) field. One paragraph becomes <p class="…">; anything longer
  // becomes a <div class="…"> holding the blocks, so the markup stays valid either way.
  eleventyConfig.addFilter("richBlock", (value, className) => {
    const html = md.render(String(value ?? "")).trim();
    if (!html) return "";
    const single = html.match(/^<p>([\s\S]*)<\/p>$/);
    if (single && !single[1].includes("</p>")) return `<p class="${className}">${single[1]}</p>`;
    return `<div class="${className}">${html}</div>`;
  });

  return {
    dir: { input: "_src", includes: "_includes", data: "../content", output: "_site" },
    htmlTemplateEngine: "njk",
    templateFormats: ["njk"],
  };
}
