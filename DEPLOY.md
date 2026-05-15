# Deploying to GitHub Pages

You have two paths. Path A is simpler. Path B is more automated.

---

## Path A: Push and serve from `/docs` (recommended for first time)

Every time you run `python3 build/build.py`, the script mirrors `site/` into `docs/`. GitHub Pages can serve directly from `docs/` without any build step.

### One-time setup

1. **Create a GitHub repo.** Go to https://github.com/new. Name it something like `ai-delivery-kb`. Make it public if you want anyone to access it, or private if you only want the link to work for you and collaborators (Pages on private repos requires a paid plan).

2. **Push this folder to the repo.** From your local machine, in the `kb/` directory:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/ai-delivery-kb.git
   git push -u origin main
   ```

   Replace `YOUR-USERNAME` with your actual GitHub username.

3. **Enable Pages.** In the repo on github.com:
   - Click **Settings** (top nav).
   - Click **Pages** (left sidebar).
   - Under **Source**, choose **Deploy from a branch**.
   - Under **Branch**, choose `main` and `/docs`. Click **Save**.

4. **Wait one to two minutes.** Pages will publish. Your URL will be:

   ```
   https://YOUR-USERNAME.github.io/ai-delivery-kb/
   ```

   GitHub shows the URL at the top of the Pages settings once the build finishes. You can refresh that page to see deployment status.

### Daily workflow

```bash
# Edit content
vim content/topic-04-retrieval-augmented-generation/4.2-pipeline-*.md

# Rebuild
python3 build/build.py

# Commit and push
git add content docs
git commit -m "Update item 4.2 pipeline description"
git push
```

A minute later your live site reflects the change. GitHub Pages re-deploys automatically when `docs/` changes.

---

## Path B: GitHub Actions builds for you

Slightly more setup, but you do not have to commit `docs/` anymore. The action runs the build on GitHub's servers and deploys the output.

### One-time setup

1. Push to GitHub as in Path A steps 1 and 2. The `.github/workflows/deploy.yml` file is already in this folder, so it will be picked up.

2. **Enable Pages with Actions as source:**
   - Settings → Pages.
   - Under **Source**, choose **GitHub Actions**. (Not "Deploy from a branch".)
   - Save.

3. **Trigger the first run.** Push a commit, or in the **Actions** tab of your repo, click "Build and deploy to Pages" then "Run workflow".

4. The action will appear in the **Actions** tab. When it finishes (about 30 seconds), your site is live.

### Daily workflow

```bash
# Edit content
vim content/topic-04-retrieval-augmented-generation/4.2-pipeline-*.md

# Commit and push. No local build needed.
git add content
git commit -m "Update item 4.2 pipeline description"
git push
```

If you choose Path B, you can delete the `docs/` directory entirely and add `docs/` to `.gitignore`. The action builds and deploys from `content/` directly.

---

## Choosing between A and B

| | Path A (/docs) | Path B (Actions) |
|---|---|---|
| First-time setup | 3 clicks in Settings | Same clicks, one extra step |
| Per-edit workflow | Build locally, commit `docs/` | Just commit `content/` |
| Risk of stale site | If you forget to build, the live site goes stale | Always rebuilds, can never be stale |
| Useful for | Solo work, fast feedback | Multiple contributors, or you want it to "just work" |

**My recommendation:** start with Path A, switch to Path B once you are comfortable. Path A makes it easier to see exactly what is being deployed, because the files are right there in `docs/`.

---

## Custom domain (optional, do later)

If you own a domain and want to use it instead of `YOUR-USERNAME.github.io/ai-delivery-kb`:

1. In Settings → Pages → Custom domain, enter your domain (e.g. `kb.yang-something.com`).
2. In your DNS provider, add a CNAME record pointing to `YOUR-USERNAME.github.io`.
3. Wait for DNS to propagate (minutes to hours). GitHub will auto-issue an HTTPS certificate.
4. Tick **Enforce HTTPS** in Pages settings once the cert is ready.

---

## Troubleshooting

**Page loads but content does not appear, only the loading shell.**
Open browser devtools (F12), Network tab. Reload. Look for `data.json`. If it shows 404, the file is not in the right place. Confirm `docs/data.json` exists in your repo on GitHub.

**Page says "Could not load data.json".**
Same as above. Or: you are trying to open `index.html` by double-clicking the file (which uses `file://`). Use the local server instead: `cd docs && python3 -m http.server`.

**Fonts look wrong.**
Google Fonts are loaded from `fonts.googleapis.com`. If your network blocks that, the page falls back to system fonts but still works. On a normal browser with internet, fonts load correctly.

**Site URL gives 404.**
Pages can take 1 to 2 minutes after the first deploy. Check Settings → Pages for the actual URL and status. If it says "Your site is live at...", that link should work.

**I made a typo in `content/topics.yaml` and the build crashed.**
The YAML parser is intentionally minimal. Check that every line starts with the right indentation: list items at `  -` (two spaces), keys at `    key:` (four spaces). Or restore from git: `git checkout content/topics.yaml`.

---

## What is in this folder

- `content/` — edit these files. Markdown.
- `build/` — the build pipeline. Run `python3 build/build.py`.
- `site/` — local preview output (after build). Use `cd site && python3 -m http.server`.
- `docs/` — the GitHub Pages publishing root (after build). Identical to `site/` plus a `.nojekyll` marker.
- `.github/workflows/deploy.yml` — optional GitHub Action for Path B.
- `assets/` — for charts and other static assets you add later.
- `README.md` — content authoring guide.
- `DEPLOY.md` — this file.
