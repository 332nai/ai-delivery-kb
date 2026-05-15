# Charts

How to add a new chart to an item.

## Step 1: design the SVG

Create a new file under `assets/charts/`, named after what it represents:

```
assets/charts/rag-pipeline.svg
assets/charts/context-window-bars.svg
assets/charts/agent-loop.svg
```

The naming convention: lowercase, hyphens between words, no version numbers.

### Style rules

All charts must follow these conventions so they look consistent and adapt to the three themes:

1. **Use CSS variables, not hard-coded colors.** The chart inherits theme colors from the page through `var(--ink)`, `var(--accent)`, `var(--ink-muted)`, `var(--rule)`. Hard-coded `#000` or `#a83232` breaks theme switching.
2. **Black-and-white structure, accent for emphasis.** Boxes, lines, and labels use `var(--ink)`. Only arrows, key numbers, and the "active path" use `var(--accent)`.
3. **No fills on shapes.** All boxes are `fill: none; stroke: var(--ink); stroke-width: 1`.
4. **Sans-serif typography.** Use `var(--sans)` for chart text. The font weight should match the theme (chart respects `var(--display-weight)` if you want).
5. **Set `viewBox`, never fixed `width` and `height`.** This lets the chart scale to its container.
6. **Bilingual via `<tspan class="en">` / `<tspan class="zh">`.** Default to showing English. The page wrapper has `[data-lang="zh"]` which the chart's inline `<style>` toggles on. Look at `rag-pipeline.svg` for the pattern.

### Minimum SVG template

```xml
<svg viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" class="kb-chart" role="img" aria-label="Description for screen readers">
  <style>
    .kb-chart text { font-family: var(--sans, system-ui), sans-serif; fill: var(--ink); }
    .kb-chart .node { fill: none; stroke: var(--ink); stroke-width: 1; }
    .kb-chart .arrow { stroke: var(--accent); stroke-width: 1.25; fill: none; }
    .kb-chart .arrowhead { fill: var(--accent); }
    .kb-chart .label { font-size: 13px; font-weight: 500; }
    .kb-chart .zh { display: none; }
    [data-lang="zh"] .kb-chart .en { display: none; }
    [data-lang="zh"] .kb-chart .zh { display: inline; }
  </style>

  <defs>
    <marker id="arrow-MY-CHART" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" class="arrowhead"/>
    </marker>
  </defs>

  <!-- your shapes here -->
</svg>
```

**Note:** every chart's `<marker id>` must be unique across the site. Use the chart name as a suffix (e.g. `arrow-rag`, `arrow-cost-tier`) to avoid collisions if multiple charts appear on the same page.

## Step 2: reference it from a markdown file

In the body of any `.md` file under `content/`, insert:

```
{{chart: rag-pipeline}}
```

Use this in both the `::: en` and `::: zh` blocks if you want the chart to appear in both languages. The chart itself is bilingual via internal `<tspan>` toggling, so the same chart file serves both languages.

Place it where it would naturally appear in the reading flow — usually right after the prose that introduces the concept.

## Step 3: rebuild

```bash
python3 build/build.py
```

The build script finds `{{chart: ...}}` markers in both language blocks, looks up the named SVG file under `assets/charts/`, inlines its contents inside a `<div class="kb-chart-wrap">`, and strips blank lines so the runtime markdown parser does not split the SVG apart.

If you reference a chart name that does not exist, the build logs a warning and inserts a visible "Chart missing" placeholder in the page (rather than crashing).

## Constraints to remember

- **No blank lines inside the SVG file.** The build script strips them, but it is cleaner to write the SVG without them in the first place.
- **No `<script>` inside the SVG.** Browsers do not execute inline SVG scripts when the SVG is embedded via inline HTML. Animation is fine via CSS transitions or SMIL.
- **Test in all three themes.** A chart that looks great in Editorial may have a contrast problem in Terminal. Always check by clicking through the theme toggle.
- **Test in both languages.** Chinese labels are usually shorter than English when measured in characters but wider when measured in pixels at the same font size. Allow generous padding.

## Roadmap of charts to build

In priority order, the next four:

1. **context-window-bars** — used in item 1.1 — horizontal bar comparison of model context windows
2. **model-tiers** — used in item 2.3 — three-axis comparison of cost / latency / capability across Haiku/Sonnet/Opus
3. **cpum-breakdown** — used in item 9.5 — stacked bar of cost per user per month, components labeled
4. **agent-loop** — used in item 5.1 — circular diagram of the agent loop with stop conditions
