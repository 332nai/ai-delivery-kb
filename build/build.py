#!/usr/bin/env python3
"""
Build script. Reads content/ (markdown files + topics.yaml) and produces
site/data.json plus copies site assets. This is the only thing you need
to run after editing content.

Usage:
    python3 build/build.py
"""
import json
import re
import sys
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
SITE = ROOT / "site"
DOCS = ROOT / "docs"
ASSETS = ROOT / "assets"


# ---------- Chart transclusion ----------

CHART_PATTERN = re.compile(r"\{\{\s*chart:\s*([\w\-]+)\s*\}\}")


def transclude_charts(body, path):
    """Replace {{chart: name}} markers with the inline SVG from assets/charts/name.svg.
    
    The SVG is wrapped in a <div class="kb-chart-wrap"> so the page can style placement.
    We strip blank lines from the SVG content because the runtime markdown parser
    uses blank lines as block separators and would otherwise break the SVG apart.
    """
    def repl(match):
        name = match.group(1)
        svg_path = ASSETS / "charts" / f"{name}.svg"
        if not svg_path.exists():
            print(f"  WARN {path.name}: chart not found: {name}.svg", file=sys.stderr)
            return f'<div class="kb-chart-missing">Chart missing: {name}</div>'
        svg = svg_path.read_text(encoding="utf-8")
        # Remove blank lines inside the SVG (they would split the parser's HTML block)
        svg = "\n".join(line for line in svg.splitlines() if line.strip())
        return f'\n<div class="kb-chart-wrap">\n{svg}\n</div>\n'
    
    return CHART_PATTERN.sub(repl, body)

# ---------- Tiny YAML reader for our flat topics.yaml ----------

def parse_topics_yaml(path):
    """Parse content/topics.yaml into (volumes_list, topics_list).
    Supports a top-level `volumes:` list and a top-level `topics:` list.
    Each list contains items with simple key/value pairs. No nested structures.
    """
    text = path.read_text(encoding="utf-8")
    volumes = []
    topics = []
    current_list = None  # references either volumes or topics
    current = None
    
    for raw in text.splitlines():
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line.strip() == "volumes:":
            if current is not None and current_list is not None:
                current_list.append(current)
                current = None
            current_list = volumes
            continue
        if line.strip() == "topics:":
            if current is not None and current_list is not None:
                current_list.append(current)
                current = None
            current_list = topics
            continue
        
        # New item starts with "  - key: value"
        m = re.match(r"^  -\s*(\w+):\s*(.*)$", line)
        if m:
            if current is not None and current_list is not None:
                current_list.append(current)
            current = {}
            key, val = m.group(1), m.group(2)
            current[key] = _yaml_scalar(val)
            continue
        
        # Continuation of current item: "    key: value"
        m = re.match(r"^    (\w+):\s*(.*)$", line)
        if m and current is not None:
            key, val = m.group(1), m.group(2)
            current[key] = _yaml_scalar(val)
            continue
    
    if current is not None and current_list is not None:
        current_list.append(current)
    
    return volumes, topics


def _yaml_scalar(val):
    """Decode a simple YAML scalar value."""
    val = val.strip()
    if not val:
        return ""
    # JSON-quoted string: works for both English and CJK
    if val.startswith('"'):
        return json.loads(val)
    # Plain integer
    if re.match(r"^-?\d+$", val):
        return int(val)
    return val


# ---------- Markdown frontmatter parser ----------

def parse_item_file(path):
    """Read one item .md file and return (frontmatter dict, body_en, body_zh)."""
    text = path.read_text(encoding="utf-8")
    
    # Extract frontmatter
    fm = {}
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.DOTALL)
    if not m:
        raise ValueError(f"{path}: no frontmatter")
    
    fm_text, body = m.group(1), m.group(2)
    for line in fm_text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        km = re.match(r"^(\w+):\s*(.*)$", line)
        if km:
            fm[km.group(1)] = _yaml_scalar(km.group(2))
    
    # Extract ::: en ... ::: and ::: zh ... ::: blocks
    body_en = _extract_block(body, "en", path)
    body_zh = _extract_block(body, "zh", path)
    
    # Resolve chart references {{chart: name}} -> inline SVG
    body_en = transclude_charts(body_en, path)
    body_zh = transclude_charts(body_zh, path)
    
    return fm, body_en, body_zh


def _extract_block(body, lang, path):
    """Pull text between ::: <lang> and the matching closing :::"""
    pattern = re.compile(
        r"^:::\s*" + lang + r"\s*\n(.*?)\n:::\s*$",
        re.DOTALL | re.MULTILINE
    )
    m = pattern.search(body)
    if not m:
        raise ValueError(f"{path}: missing ::: {lang} block")
    return m.group(1).strip()


# ---------- Main build ----------

def build():
    volumes_meta, topics_meta = parse_topics_yaml(CONTENT / "topics.yaml")
    output_topics = []
    
    total_items = 0
    
    for tmeta in topics_meta:
        tdir = CONTENT / tmeta["slug"]
        if not tdir.is_dir():
            print(f"WARNING: topic dir missing: {tdir}", file=sys.stderr)
            continue
        
        # Find all item .md files in this topic dir, sorted by num
        item_files = sorted(
            tdir.glob("*.md"),
            key=lambda p: _file_sort_key(p.name)
        )
        
        items = []
        for f in item_files:
            fm, body_en, body_zh = parse_item_file(f)
            items.append({
                "num": fm["num"],
                "title_en": fm["title_en"],
                "title_zh": fm["title_zh"],
                "teaser_en": fm.get("teaser_en", ""),
                "teaser_zh": fm.get("teaser_zh", ""),
                "body_en": body_en,
                "body_zh": body_zh,
            })
        
        topic_out = {
            "num": tmeta["num"],
            "volume": tmeta.get("volume", 1),
            "title_en": tmeta["title_en"],
            "title_zh": tmeta["title_zh"],
            "subtitle_en": tmeta["subtitle_en"],
            "subtitle_zh": tmeta["subtitle_zh"],
            "items": items,
        }
        output_topics.append(topic_out)
        total_items += len(items)
        print(f"  Topic {tmeta['num']:2d} (V{topic_out['volume']}): {tmeta['title_en']:<40} {len(items)} items")
    
    # Build the final data structure: {volumes, topics}
    output_data = {
        "volumes": volumes_meta,
        "topics": output_topics,
    }
    
    # Write data.json
    SITE.mkdir(exist_ok=True)
    data_path = SITE / "data.json"
    data_path.write_text(
        json.dumps(output_data, ensure_ascii=False, indent=None),
        encoding="utf-8"
    )
    
    size_kb = data_path.stat().st_size / 1024
    print(f"\nWrote {data_path} ({size_kb:.1f} KB)")
    print(f"Total: {len(output_topics)} topics, {total_items} items")
    
    # If index.html template exists at site/index.html, leave it; just confirm.
    if (SITE / "index.html").exists():
        size_kb = (SITE / "index.html").stat().st_size / 1024
        print(f"site/index.html present ({size_kb:.1f} KB)")
    else:
        # Auto-generate the HTML shell from templates
        print("Generating site/index.html from templates...")
        import subprocess
        result = subprocess.run(
            ["python3", str(ROOT / "build" / "build_html.py")],
            capture_output=True, text=True
        )
        print(result.stdout, end="")
        if result.returncode != 0:
            print(result.stderr, file=sys.stderr)
    
    # Mirror site/ into docs/ so GitHub Pages can serve from /docs.
    # We rewrite docs/ each build to guarantee they match.
    DOCS.mkdir(exist_ok=True)
    shutil.copy2(SITE / "data.json", DOCS / "data.json")
    shutil.copy2(SITE / "index.html", DOCS / "index.html")
    # Add a .nojekyll file so Pages serves all files literally without Jekyll processing
    (DOCS / ".nojekyll").touch()
    print(f"Mirrored site/ -> docs/ for GitHub Pages")


def _file_sort_key(name):
    """Sort 1.1- before 1.10- correctly."""
    m = re.match(r"^(\d+)\.(\d+)-", name)
    if m:
        return (int(m.group(1)), int(m.group(2)))
    return (999, 999)


if __name__ == "__main__":
    build()
