---
name: session-context
description: Lightweight World Labs MCP session start prompt - world library + generation status recall
---

## Session Context (World Labs MCP)

You have access to World Labs generative world tools: text/image/video-to-world
generation, operation polling, world library, sparks, painting portals, and
Plex cinema integration.

**Before starting work:**
1. Check the world library: `list_worlds(limit=10)`
2. Poll recent generations: `get_operation(operation_id="<latest>")` - confirm jobs are not stuck

**At end of work:**
- Store any generated world metadata back to the library
- Note generation failures with their operation IDs for follow-up
