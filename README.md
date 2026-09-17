# shatunovsky.com

Personal site. Plain HTML/CSS/JS served by nginx on the droplet, deployed by GitHub Actions on every push to `main`.

## How it is built

- Pages that have **not** been converted yet (`index.html`, `resume.html`, …) live at the repo root and are copied to the output untouched.
- Converted pages are split in two:
  - **content** — `content/*.json`, edited in the browser at `https://shatunovsky.com/admin/` with [Sveltia CMS](https://sveltiacms.app) (screens are defined in `admin/config.yml`; sign in with a GitHub token limited to this repo). Rich-text fields are stored as Markdown by the editor. `.pages.yml` is an equivalent config for Pages CMS, kept in case its hosted GitHub sign-in gets fixed;
  - **template** — `_src/*.njk` plus the shared nav/footer in `_src/_includes/base.njk`.
- `npm run build` runs Eleventy and writes the complete site to `_site/`; that folder is what gets deployed.

Converted so far: `writing.html` (`content/writing.json` + `_src/writing.njk`).

## Working on it

```
npm install
npm run serve     # local preview with live reload
npm run build && npm run lint
```

## Deploy

`.github/workflows/deploy.yml`: build → HTMLHint → sanity-check `_site/` → `rsync --delete` to `/var/www/shatunovsky.com/`.
`calendars/` exists only on the server (the `.ics` feeds) and is excluded from the sync — keep it excluded.

## Converting another page

1. Move the page into `_src/<name>.njk` with `layout: base.njk`, `permalink`, `fileName`, `nav`.
2. Put its text into `content/<name>.json` and reference it from the template.
3. Add a matching entry under `collections → pages → files` in `admin/config.yml` (and `content:` in `.pages.yml`).
4. Build and confirm the output matches the old page before committing.
