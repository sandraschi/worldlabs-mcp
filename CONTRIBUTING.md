# Contributing to worldlabs-mcp

Thank you for your interest in contributing.

## Development Setup

```bash
git clone https://github.com/sandraschi/worldlabs-mcp
cd worldlabs-mcp
uv venv
uv pip install -e ".[dev]"
```

## Running Tests

```bash
pytest tests/ -v
```

## Code Style

We use Ruff for linting and formatting:

```bash
ruff check src/ tests/
ruff format src/ tests/
```

## Environment

Set your API key before running:

```bash
set WORLDLABS_API_KEY=your-key-here   # Windows
export WORLDLABS_API_KEY=your-key-here  # Linux/macOS
```

## Pull Requests

- Keep PRs focused on a single change
- Add tests for new tools or bug fixes
- Update CHANGELOG.md under `[Unreleased]`
- Run ruff and pytest before submitting
