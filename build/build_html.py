#!/usr/bin/env python3
"""
Generate site/index.html (the UI shell). This is run automatically by build.py
but can also be run standalone if you only want to refresh the shell after
tweaking CSS or JS without regenerating data.

The output index.html loads ./data.json at runtime via fetch().
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
ASSETS_DIR = ROOT / "build" / "templates"


def main():
    css_path = ASSETS_DIR / "styles.css"
    js_path = ASSETS_DIR / "app.js"
    html_path = ASSETS_DIR / "index.template.html"
    
    if not css_path.exists() or not js_path.exists() or not html_path.exists():
        print(f"ERROR: missing template files in {ASSETS_DIR}", file=sys.stderr)
        print("Expected: styles.css, app.js, index.template.html", file=sys.stderr)
        sys.exit(1)
    
    css = css_path.read_text(encoding="utf-8")
    js = js_path.read_text(encoding="utf-8")
    html_template = html_path.read_text(encoding="utf-8")
    
    final = html_template.replace("__CSS__", css).replace("__JS__", js)
    
    SITE.mkdir(exist_ok=True)
    out = SITE / "index.html"
    out.write_text(final, encoding="utf-8")
    
    size_kb = out.stat().st_size / 1024
    print(f"Wrote {out} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
