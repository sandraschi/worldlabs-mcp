"""Fetch public Marble gallery entries from api.worldlabs.ai.

Polite scraper: mirrors the site's own POST /api/v1/worlds:by-tag call, uses
small page sizes, waits between page requests, and bounds the total page
count. Public entries only (permission.public). Each entry keeps the owner
username for attribution.

Usage:
    uv run python scripts/gallery_scrape.py --pages 2 --page-size 12
    uv run python scripts/gallery_scrape.py --tag fantasy --pages 3 --out data/gallery_fantasy.json
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

import httpx

API_URL = "https://api.worldlabs.ai/api/v1/worlds:by-tag"
REFERER = "https://marble.worldlabs.ai/"
USER_AGENT = "worldlabs-mcp-gallery-scraper/0.1 (polite, local use only)"


def fetch_page(tag: str, page_token: str, page_size: int) -> dict:
    with httpx.Client(timeout=30, headers={"User-Agent": USER_AGENT, "Referer": REFERER}) as client:
        resp = client.post(
            API_URL,
            json={"page_size": page_size, "page_token": page_token, "tag": tag},
        )
        resp.raise_for_status()
        return resp.json()


def extract_entry(w: dict) -> dict | None:
    if not (w.get("permission") or {}).get("public", False):
        return None
    gi = w.get("generation_input") or {}
    prompt = (gi.get("prompt") or {}).get("text_prompt") or gi.get("original_text_prompt") or ""
    if not prompt:
        return None
    go = w.get("generation_output") or {}
    return {
        "id": w.get("id"),
        "display_name": w.get("display_name"),
        "owner": (w.get("application_data") or {}).get("owner_username"),
        "created_at": w.get("created_at"),
        "tags": w.get("tags"),
        "model": gi.get("model"),
        "seed": gi.get("seed"),
        "prompt": prompt,
        "minimap_url": go.get("minimap_url"),
        "spz_urls": list((go.get("spz_urls") or {}).values()),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--tag", default="curated", help="Gallery tab/tag (curated, stylized, realism, interior, hq, fantasy, sci-fi)"
    )
    ap.add_argument("--pages", type=int, default=2, help="Max pages to fetch")
    ap.add_argument("--page-size", type=int, default=12, help="Entries per page (site default 24)")
    ap.add_argument("--delay", type=float, default=2.0, help="Seconds between page requests")
    ap.add_argument("--out", default=None, help="Output JSON path (default data/gallery_<tag>.json)")
    args = ap.parse_args()

    if args.pages < 1 or args.page_size < 1 or args.page_size > 50:
        print("error: --pages >= 1 and 1 <= --page-size <= 50", file=sys.stderr)
        return 2

    out_path = Path(args.out or f"data/gallery_{args.tag}.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    entries: list[dict] = []
    token = ""
    for page in range(args.pages):
        try:
            data = fetch_page(args.tag, token, args.page_size)
        except Exception as exc:  # network/HTTP error - stop politely
            print(f"error: page {page + 1} failed: {exc}", file=sys.stderr)
            break
        worlds = data.get("worlds", [])
        for w in worlds:
            e = extract_entry(w)
            if e:
                entries.append(e)
        token = data.get("next_page_token") or ""
        print(f"page {page + 1}: {len(worlds)} worlds, {len(entries)} kept")
        if not token:
            break
        if page < args.pages - 1:
            time.sleep(args.delay)

    snapshot = {
        "source": API_URL,
        "tag": args.tag,
        "fetched_at": datetime.now(UTC).isoformat(),
        "count": len(entries),
        "entries": entries,
    }
    out_path.write_text(json.dumps(snapshot, indent=2), encoding="utf-8")
    print(f"wrote {len(entries)} entries to {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
