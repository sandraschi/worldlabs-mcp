"""
Built-in TTS engine for spatial narration.

Tries edge-tts first (high-quality, free, no API key, cross-platform).
Falls back to a descriptive error if neither is available.
"""

from __future__ import annotations

import tempfile
import uuid
from pathlib import Path

AUDIO_DIR = Path(tempfile.gettempdir()) / "worldlabs-tts"


def _get_edge_tts_available() -> bool:
    try:
        import edge_tts  # noqa: F401

        return True
    except ImportError:
        return False


async def text_to_speech(text: str, voice: str = "en-US-JennyNeural") -> str | None:
    """Generate TTS audio, save to a WAV file, return the local path.

    Returns None if no TTS backend is available.
    """
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    if _get_edge_tts_available():
        import edge_tts

        filename = f"{uuid.uuid4().hex}.mp3"
        out_path = AUDIO_DIR / filename
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(out_path))
        return str(out_path)

    return None
