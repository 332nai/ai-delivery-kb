# AI Delivery Knowledge Base

A bilingual (EN / 中文) reference for AI delivery work. Ten topics, fifty one items, three visual themes.

To deploy this to a public URL via GitHub Pages, see **[DEPLOY.md](./DEPLOY.md)**.

## What lives where

```
kb/
├── content/                  ← Edit these files
│   ├── topics.yaml             Topic names, subtitles, ordering
│   └── topic-NN-slug/          One directory per topic
│       └── X.Y-slug.md         One markdown file per item, bilingual
│
├── assets/
│   └── charts/                 Reusable SVG / HTML charts (future)
│
├── build/                    ← Build pipeline
│   ├── build.py                Compiles content/ → site/data.json
│   ├── build_html.py           Generates site/index.html from templates
│   ├── split_to_files.py       One-off: split kb_data.json into files (already run)
│   └── templates/              The UI shell
│       ├── index.template.html
│       ├── styles.css
│       └── app.js
│
└── site/                     ← Deployable output (do not edit by hand)
    ├── index.html              UI shell (≈ 40 KB)
    └── data.json               All content (≈ 515 KB)
```

A mirror copy is also written to `docs/` after each build, which is what GitHub Pages serves from. See `DEPLOY.md`.

The split matters: `content/` is what you author, `site/` is what users see. Never edit `site/` directly.

## Daily workflow

To change something, edit a file in `content/`, then run:

```bash
python3 build/build.py
```

That regenerates `site/data.json`. The HTML shell only needs to be rebuilt when you change the templates in `build/templates/` (which is rare).

To preview locally:

```bash
cd site
python3 -m http.server 8000
# open http://localhost:8000
```

A plain `file://` open of `index.html` will **not** work, because the page fetches `data.json` over HTTP. Use any local server.

## Editing an item

Each item is one markdown file. Open it, you will see:

```markdown
---
num: "1.1"
topic: 1
slug: tokens-context-windows-and-why-the-model
title_en: "Tokens, context windows, and why ..."
title_zh: "Token、上下文窗口,以及为何..."
---

::: en

**Definition**

A token is ...

**Why it matters in delivery**

...
:::

::: zh

**定义**

一个 token 是 ...

:::
```

Rules:
- The YAML frontmatter at the top is required. Keep `num` quoted as a string.
- The `::: en` and `::: zh` fences are required. The build script splits the file on them.
- Inside each block, use standard markdown: `**bold**`, `*italic*`, tables with `|`, lists with `-` or `1.`, code with backticks, code blocks with triple backticks.
- A standalone bold paragraph (e.g. `**Definition**` on its own line) becomes a section heading in the UI. Inline bold inside a paragraph stays as normal bold.
- The Qantas story uses the heading `**Qantas story**` (EN) or `**Qantas 案例**` (ZH). The build splits the body on this marker and puts the story in its own visually distinct section.
- The takeaway uses `**Takeaway: ...**` (EN) or `**要点总结: ...**` (ZH) on a single line. The UI lifts this into a highlighted callout box.

## Adding a new item

1. Decide which topic it belongs to.
2. Create a new `.md` file in that topic's directory. Naming convention: `X.Y-short-slug.md`, where `X.Y` is the item number.
3. Copy the structure from any existing item file (frontmatter + bilingual blocks).
4. Run `python3 build/build.py`.

The build script auto-discovers files by sorting on `X.Y`. You do not need to register them anywhere.

## Adding a new topic

1. Decide on a topic number (next available, or insert and renumber later).
2. Create a directory: `content/topic-NN-short-slug/`.
3. Add the topic entry to `content/topics.yaml`. Keep entries in the order you want them to appear in the sidebar.
4. Add item files inside the new directory.
5. Run `python3 build/build.py`.

## Adding charts

Charts go in `assets/charts/` as standalone SVG or HTML files. Reference them from markdown by inlining the SVG directly into the item body, or (future enhancement) by a transclusion syntax that the build script will resolve.

For now, the simplest path: inline an `<svg>` tag inside the `::: en` or `::: zh` block. The markdown parser passes raw HTML through, so the SVG renders as is. Keep the SVG's `viewBox` set so it scales, and use CSS variables from the page (e.g. `fill="var(--accent)"`) so the chart adapts to whichever theme is active.

## Themes

Three themes, all built into `build/templates/styles.css` as CSS custom property sets. To tweak colors or typography, edit the `:root, [data-theme="editorial"]`, `[data-theme="atelier"]`, or `[data-theme="terminal"]` blocks. Then rebuild the HTML:

```bash
python3 build/build_html.py
```

(Or just `python3 build/build.py`, which does both.)

## Deployment

Anywhere that serves static files works: GitHub Pages, Cloudflare Pages, Netlify, S3 + CloudFront, a Caddy / nginx server. Upload the contents of `site/` and you are done.

For GitHub Pages: push the repo, configure Pages to serve from `/site` (or move `site/` contents to `docs/` and serve from `docs/`).

## Round-trip integrity

The `build/split_to_files.py` script that bootstrapped this structure preserves content losslessly. If you ever need to rebuild the original combined JSON, just compile through `build.py` and `site/data.json` will be byte-equivalent to the original `kb_data.json`.
