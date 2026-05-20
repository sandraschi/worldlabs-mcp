"""
Prefab card tools for worldlabs-mcp.

list_worlds_card  — paginated world library as a scannable table card
get_world_card    — single world detail card with asset links and thumbnail
"""

from __future__ import annotations

import logging
from typing import Any

from prefab_ui.app import PrefabApp
from prefab_ui.components import (
    Badge,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Image,
    Markdown,
    Separator,
    Text,
)

log = logging.getLogger("worldlabs_mcp.prefab")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_STATUS_LABELS = {
    "SUCCEEDED": "✅ Ready",
    "IN_PROGRESS": "⏳ Generating",
    "FAILED": "❌ Failed",
    "PENDING": "🕐 Pending",
}

_MODEL_LABELS = {
    "marble-1.1": "marble-1.1",
    "marble-1.1-plus": "marble-1.1-plus ✦",
}


def _status_badge(world: dict[str, Any]) -> str:
    """Return a human-readable status string from a world dict."""
    status = (
        world.get("status")
        or world.get("state")
        or (world.get("assets") and "SUCCEEDED")
        or "UNKNOWN"
    )
    return _STATUS_LABELS.get(status.upper(), status)


def _world_name(world: dict[str, Any]) -> str:
    return (
        world.get("display_name")
        or world.get("name", "")
        or world.get("id", "")[:12]
        or "Unnamed World"
    )


def _world_id(world: dict[str, Any]) -> str:
    return world.get("id", world.get("world_id", ""))


def _thumb(world: dict[str, Any]) -> str | None:
    """Extract thumbnail URL, tolerating both flat and nested asset shapes."""
    assets = world.get("assets", {})
    return (
        assets.get("thumbnail_url")
        or world.get("thumbnail_url")
        or assets.get("imagery", {}).get("thumbnail_url")
        or None
    )


def _caption(world: dict[str, Any]) -> str:
    assets = world.get("assets", {})
    return (
        assets.get("caption")
        or world.get("caption")
        or ""
    )


def _marble_url(world: dict[str, Any]) -> str:
    assets = world.get("assets", {})
    return (
        assets.get("marble_url")
        or assets.get("world_marble_url")
        or world.get("world_marble_url")
        or world.get("marble_url")
        or ""
    )


def _created_at(world: dict[str, Any]) -> str:
    raw = world.get("create_time") or world.get("created_at") or ""
    return raw[:10] if raw else ""


def _model_label(world: dict[str, Any]) -> str:
    model = world.get("model", "")
    return _MODEL_LABELS.get(model, model)


def _splat_urls(world: dict[str, Any]) -> dict[str, str]:
    assets = world.get("assets", {})
    spz = assets.get("splats", {}).get("spz_urls", {})
    result: dict[str, str] = {}
    for key in ("100k", "500k", "full_res"):
        url = spz.get(key) or assets.get(f"splat_{key.replace('_res', '')}") or ""
        if url:
            label = key.replace("_res", " (full)")
            result[label] = url
    return result


def _mesh_url(world: dict[str, Any]) -> str:
    assets = world.get("assets", {})
    return (
        assets.get("mesh", {}).get("collider_mesh_url")
        or assets.get("mesh_url")
        or world.get("mesh_url")
        or ""
    )


def _pano_url(world: dict[str, Any]) -> str:
    assets = world.get("assets", {})
    return (
        assets.get("imagery", {}).get("pano_url")
        or assets.get("panorama_url")
        or world.get("panorama_url")
        or ""
    )


# ---------------------------------------------------------------------------
# Tool registration
# ---------------------------------------------------------------------------


def register_prefab_tools(mcp) -> None:
    """Register show_worlds_card and show_world_card on the given FastMCP instance."""

    @mcp.tool(app=True)
    async def show_worlds_card(
        page_size: int = 20,
        page_token: str = "",
    ) -> PrefabApp:
        """
        Display generated worlds as a rich scannable card with thumbnail previews.

        Lists worlds from your Marble account with status badges, model labels,
        dates, and direct viewer links. Equivalent to list_worlds but rendered
        as a Prefab card rather than raw JSON.

        Args:
            page_size: Number of worlds to return (default 20, max 100).
            page_token: Pagination token from a previous response.

        Returns:
            PrefabApp card with world table and pagination info.
        """
        from worldlabs_mcp.server import list_worlds  # avoid circular at module load

        try:
            data = await list_worlds(page_size=page_size, page_token=page_token)
        except Exception as exc:
            with Card(css_class="max-w-2xl") as view:
                with CardContent():
                    Text(f"Error fetching worlds: {exc}", css_class="text-destructive")
            return PrefabApp(view=view, title="Error — World Library")

        worlds: list[dict[str, Any]] = data.get("worlds", [])
        next_token: str = data.get("next_page_token", "")
        count = len(worlds)

        title = f"World Library ({count} worlds)"
        subtitle = "Marble API · platform.worldlabs.ai"

        with Card(css_class="max-w-3xl") as view:
            with CardHeader():
                CardTitle(title)
                CardDescription(subtitle)
            with CardContent():
                if not worlds:
                    Text("No worlds found. Generate one with generate_world_from_text.",
                         css_class="text-muted-foreground")
                else:
                    # Column headers
                    Text(
                        "**Name** · **Model** · **Status** · **Date** · **Actions**",
                        css_class="text-xs font-semibold text-muted-foreground mb-2",
                    )
                    Separator(spacing=1)

                    for world in worlds:
                        name = _world_name(world)
                        wid = _world_id(world)
                        status = _status_badge(world)
                        model = _model_label(world)
                        date = _created_at(world)
                        viewer = _marble_url(world)
                        thumb = _thumb(world)

                        # Row: optional thumbnail + metadata
                        row_parts = [f"**{name}**"]
                        if wid:
                            row_parts.append(f"`{wid[:12]}…`")
                        if model:
                            row_parts.append(model)
                        row_parts.append(status)
                        if date:
                            row_parts.append(date)
                        if viewer:
                            row_parts.append(f"[Open viewer]({viewer})")

                        if thumb:
                            Image(
                                src=thumb,
                                css_class="w-24 h-16 object-cover rounded mb-1",
                            )
                        Markdown(" · ".join(row_parts))
                        Separator(spacing=1)

                if next_token:
                    Separator(spacing=2)
                    Text(
                        f"More worlds available. Call `show_worlds_card(page_token='{next_token}')` to load next page.",
                        css_class="text-xs text-muted-foreground",
                    )

        return PrefabApp(view=view, title=title)

    @mcp.tool(app=True)
    async def show_world_card(world_id: str) -> PrefabApp:
        """
        Display a single world as a rich detail card with assets and viewer link.

        Shows the world thumbnail, AI caption, model used, creation date,
        all available asset download links (SPZ splats at 100k/500k/full,
        collision mesh GLB, panorama), and a direct link to the Marble viewer.
        Equivalent to get_world but rendered as a Prefab card.

        Args:
            world_id: The world UUID from list_worlds or an operation response.

        Returns:
            PrefabApp detail card for the world.
        """
        from worldlabs_mcp.server import get_world  # avoid circular at module load

        try:
            data = await get_world(world_id)
        except Exception as exc:
            with Card(css_class="max-w-2xl") as view:
                with CardContent():
                    Text(f"Error fetching world {world_id!r}: {exc}",
                         css_class="text-destructive")
            return PrefabApp(view=view, title="Error")

        # get_world returns the world object directly or nested under "world"
        world = data.get("world", data) if isinstance(data, dict) else data

        name = _world_name(world)
        wid = _world_id(world) or world_id
        status = _status_badge(world)
        model = _model_label(world)
        date = _created_at(world)
        caption = _caption(world)
        viewer = _marble_url(world)
        thumb = _thumb(world)
        pano = _pano_url(world)
        mesh = _mesh_url(world)
        splats = _splat_urls(world)

        title = name or f"World {wid[:12]}"

        with Card(css_class="max-w-2xl") as view:
            with CardHeader():
                CardTitle(title)
                CardDescription(f"ID: {wid}")
            with CardContent():
                # Thumbnail
                if thumb:
                    Image(src=thumb, css_class="w-full max-h-48 object-cover rounded mb-3")

                # Status / model / date badges
                Badge(status, variant="secondary")
                if model:
                    Badge(model, variant="outline")
                if date:
                    Text(f"Created: {date}", css_class="text-xs text-muted-foreground mt-1")

                # Caption
                if caption:
                    Separator(spacing=2)
                    Text("Caption", css_class="font-semibold text-sm")
                    Text(caption, css_class="text-sm text-muted-foreground")

                # Viewer link
                if viewer:
                    Separator(spacing=2)
                    Markdown(f"**[Open in Marble Viewer]({viewer})**")

                # Asset downloads
                asset_lines: list[str] = []
                for label, url in splats.items():
                    asset_lines.append(f"[Splat {label}]({url})")
                if mesh:
                    asset_lines.append(f"[Collision mesh GLB]({mesh})")
                if pano:
                    asset_lines.append(f"[Panorama 360°]({pano})")

                if asset_lines:
                    Separator(spacing=2)
                    Text("Assets", css_class="font-semibold text-sm")
                    Text("⚠ CDN links are time-limited — download promptly.",
                         css_class="text-xs text-muted-foreground mb-1")
                    for line in asset_lines:
                        Markdown(f"• {line}")

                # Panorama inline if available
                if pano:
                    Separator(spacing=2)
                    Text("Panorama preview", css_class="font-semibold text-sm mb-1")
                    Image(src=pano, css_class="w-full max-h-32 object-cover rounded")

        return PrefabApp(view=view, title=title)
