#!/usr/bin/env python3
"""
Split the existing bilingual kb_data.json into per-item markdown files.
Run once to bootstrap the content/ directory.
"""
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
SOURCE = Path("/home/claude/kb_data.json")

# Slug helpers
def slugify(text, maxlen=40):
    """Make a filesystem-friendly slug from an English title."""
    s = text.lower()
    s = re.sub(r"[^a-z0-9\s\-]", "", s)
    s = re.sub(r"\s+", "-", s).strip("-")
    # Collapse multiple dashes
    s = re.sub(r"-+", "-", s)
    if len(s) > maxlen:
        s = s[:maxlen].rstrip("-")
    return s


def topic_slug(num, title_en):
    return f"topic-{num:02d}-{slugify(title_en)}"


def item_filename(num_str, title_en):
    return f"{num_str}-{slugify(title_en)}.md"


def main():
    if not SOURCE.exists():
        print(f"ERROR: source file not found: {SOURCE}", file=sys.stderr)
        sys.exit(1)
    
    with open(SOURCE, encoding="utf-8") as f:
        data = json.load(f)
    
    # 1. Write the top-level topics.yaml manifest
    topics_yaml_lines = [
        "# Topic manifest. Controls sidebar order and titles.",
        "# Each topic points to its directory under content/.",
        "",
        "topics:",
    ]
    for topic in data:
        slug = topic_slug(topic["num"], topic["title_en"])
        topics_yaml_lines.extend([
            f"  - num: {topic['num']}",
            f"    slug: {slug}",
            f"    title_en: {json.dumps(topic['title_en'], ensure_ascii=False)}",
            f"    title_zh: {json.dumps(topic['title_zh'], ensure_ascii=False)}",
            f"    subtitle_en: {json.dumps(topic['subtitle_en'], ensure_ascii=False)}",
            f"    subtitle_zh: {json.dumps(topic['subtitle_zh'], ensure_ascii=False)}",
        ])
        topics_yaml_lines.append("")
    
    (CONTENT / "topics.yaml").write_text("\n".join(topics_yaml_lines), encoding="utf-8")
    print(f"Wrote {CONTENT / 'topics.yaml'}")
    
    # 2. Per topic, create a directory and write each item as one markdown file
    for topic in data:
        tslug = topic_slug(topic["num"], topic["title_en"])
        tdir = CONTENT / tslug
        tdir.mkdir(exist_ok=True)
        
        for item in topic["items"]:
            num = item["num"]
            islug = item_filename(num, item["title_en"])
            fpath = tdir / islug
            
            # Compose the markdown file content
            lines = [
                "---",
                f'num: "{num}"',
                f"topic: {topic['num']}",
                f"slug: {slugify(item['title_en'])}",
                f"title_en: {json.dumps(item['title_en'], ensure_ascii=False)}",
                f"title_zh: {json.dumps(item['title_zh'], ensure_ascii=False)}",
                "---",
                "",
                "::: en",
                "",
                item["body_en"].strip(),
                "",
                ":::",
                "",
                "::: zh",
                "",
                item["body_zh"].strip(),
                "",
                ":::",
                "",
            ]
            
            fpath.write_text("\n".join(lines), encoding="utf-8")
        
        print(f"  Topic {topic['num']:2d}: {tslug} -> {len(topic['items'])} items")
    
    print(f"\nDone. Wrote {sum(len(t['items']) for t in data)} item files across {len(data)} topics.")


if __name__ == "__main__":
    main()
