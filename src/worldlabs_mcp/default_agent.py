"""
Generate a simple humanoid default agent as a GLB file.

Builds a capsule humanoid from box primitives (head, torso, 2 arms, 2 legs)
and writes a minimal valid GLB 2.0 binary file.
"""

from __future__ import annotations

import struct
from pathlib import Path


def _pack_vec3(x: float, y: float, z: float) -> bytes:
    return struct.pack("<fff", x, y, z)


def _pack_vec2(x: float, y: float) -> bytes:
    return struct.pack("<ff", x, y)


def _pack_uint16(*vals: int) -> bytes:
    return struct.pack("<" + "H" * len(vals), *vals)


def _make_box(cx: float, cy: float, cz: float, hw: float, hh: float, hd: float, r: float, g: float, b: float):
    """Return (vertices, indices, colors) for an axis-aligned box centered at (cx,cy,z)."""
    v = [
        (cx - hw, cy - hh, cz - hd),
        (cx + hw, cy - hh, cz - hd),
        (cx + hw, cy + hh, cz - hd),
        (cx - hw, cy + hh, cz - hd),
        (cx - hw, cy - hh, cz + hd),
        (cx + hw, cy - hh, cz + hd),
        (cx + hw, cy + hh, cz + hd),
        (cx - hw, cy + hh, cz + hd),
    ]
    i = [0, 1, 2, 0, 2, 3, 1, 5, 6, 1, 6, 2, 5, 4, 7, 5, 7, 6, 4, 0, 3, 4, 3, 7, 3, 2, 6, 3, 6, 7, 4, 5, 1, 4, 1, 0]
    c = [(r, g, b)] * 8
    return v, i, c


def generate_default_agent(output_path: str | Path) -> Path:
    """Generate a simple humanoid GLB file at output_path.

    The figure is ~1.7m tall, standing at y=0, facing +Z.
    """
    parts = [
        _make_box(0.0, 1.55, 0.0, 0.18, 0.10, 0.18, 0.90, 0.85, 0.80),  # head
        _make_box(0.0, 1.05, 0.0, 0.25, 0.40, 0.15, 0.40, 0.45, 0.90),  # torso
        _make_box(-0.35, 1.15, 0.0, 0.08, 0.35, 0.08, 0.90, 0.75, 0.70),  # left arm
        _make_box(0.35, 1.15, 0.0, 0.08, 0.35, 0.08, 0.90, 0.75, 0.70),  # right arm
        _make_box(-0.12, 0.35, 0.0, 0.10, 0.35, 0.10, 0.35, 0.35, 0.80),  # left leg
        _make_box(0.12, 0.35, 0.0, 0.10, 0.35, 0.10, 0.35, 0.35, 0.80),  # right leg
    ]

    all_v: list[tuple[float, float, float]] = []
    all_i: list[int] = []
    all_c: list[tuple[float, float, float]] = []
    base = 0
    for v, i, c in parts:
        all_v.extend(v)
        all_i.extend(idx + base for idx in i)
        all_c.extend(c)
        base += len(v)

    # Build vertex buffer: interleaved position(float3) + color(float3)
    vert_bytes = bytearray()
    for (vx, vy, vz), (cr, cg, cb) in zip(all_v, all_c, strict=False):
        vert_bytes.extend(_pack_vec3(vx, vy, vz))
        vert_bytes.extend(_pack_vec3(cr, cg, cb))

    # Index buffer
    idx_bytes = _pack_uint16(*all_i)

    # Pad to 4-byte alignment
    def _pad(b: bytearray | bytes) -> bytes:
        while len(b) % 4 != 0:
            b += b"\x00"
        return bytes(b)

    vert_padded = _pad(vert_bytes)
    idx_padded = _pad(idx_bytes)

    idx_offset = len(vert_padded)

    total_len = idx_offset + len(idx_padded)

    # glTF 2.0 JSON
    gltf = {
        "asset": {"version": "2.0", "generator": "worldlabs-mcp"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [
            {
                "primitives": [
                    {
                        "attributes": {"POSITION": 0, "COLOR_0": 0},
                        "indices": 1,
                    }
                ],
            }
        ],
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,
                "count": len(all_v),
                "type": "VEC3",
                "min": [-0.45, 0.0, -0.18],
                "max": [0.45, 1.65, 0.18],
            },
            {
                "bufferView": 0,
                "componentType": 5126,
                "count": len(all_v),
                "type": "VEC3",
                "byteOffset": 12,
            },
            {
                "bufferView": 1,
                "componentType": 5123,
                "count": len(all_i),
                "type": "SCALAR",
            },
        ],
        "bufferViews": [
            {"buffer": 0, "byteLength": len(vert_padded), "byteOffset": 0, "target": 34962},
            {"buffer": 0, "byteLength": len(idx_padded), "byteOffset": idx_offset, "target": 34963},
        ],
        "buffers": [{"byteLength": total_len}],
    }

    import json

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode()

    # GLB header: magic(4) + version(4) + length(4)
    # Chunk 0: JSON
    json_chunk = _pad(json_bytes)
    json_chunk_len = len(json_chunk)
    # Chunk 1: BIN
    bin_chunk = vert_padded + idx_padded
    bin_chunk_len = len(bin_chunk)

    glb_len = 12 + 8 + json_chunk_len + 8 + bin_chunk_len

    out = bytearray()
    out.extend(struct.pack("<IIII", 0x46546C67, 2, glb_len, json_chunk_len))
    out.extend(json_chunk)
    out.extend(struct.pack("<II", bin_chunk_len, 0x004E4942))
    out.extend(bin_chunk)

    output_path = Path(output_path)
    output_path.write_bytes(bytes(out))
    return output_path
