# Portal preview images

Place optional preview files here for hub portal rings:

```
gothic_cathedral_thumb.webp
sea_of_fog_thumb.webp
...
```

Supported extensions: `.webp`, `.png`, `.jpg`

If missing, the hub tries Marble CDN thumbnails at runtime, then falls back to a colored placeholder.

Download assets (requires `WORLDLABS_API_KEY` and worldlabs-mcp on :10865):

```powershell
cd D:\Dev\repos\worldlabs-mcp\competition
.\download_world_thumbs.ps1
# Or try CDN-only (no key):
.\download_cdn_thumbs.ps1
```
