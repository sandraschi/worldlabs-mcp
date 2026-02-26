#!/usr/bin/env python3
"""
Run the worldlabs-mcp server for development or direct invocation.

Usage:
  python scripts/run_server.py          # stdio (Claude Desktop)
  python scripts/run_server.py --http   # HTTP mode for testing
"""

import argparse
import sys
from pathlib import Path

# Allow running from repo root without installing the package
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from worldlabs_mcp.server import main, mcp


def cli() -> None:
    parser = argparse.ArgumentParser(
        description="worldlabs-mcp server runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # stdio for Claude Desktop
  python scripts/run_server.py

  # HTTP for testing (requires fastmcp[http])
  python scripts/run_server.py --http --port 8000
        """,
    )
    parser.add_argument("--http", action="store_true", help="Run HTTP server instead of stdio")
    parser.add_argument("--host", default="localhost", help="HTTP host (default: localhost)")
    parser.add_argument("--port", type=int, default=8000, help="HTTP port (default: 8000)")
    args = parser.parse_args()

    try:
        if args.http:
            print(f"Starting worldlabs-mcp HTTP server on {args.host}:{args.port}", file=sys.stderr)
            mcp.run(transport="streamable-http", host=args.host, port=args.port)
        else:
            print("Starting worldlabs-mcp stdio server", file=sys.stderr)
            main()
    except KeyboardInterrupt:
        print("Server stopped.", file=sys.stderr)
        sys.exit(0)
    except Exception as e:
        print(f"Server error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    cli()
