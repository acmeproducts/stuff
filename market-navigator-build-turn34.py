#!/usr/bin/env python3
from pathlib import Path

SRC = Path("market-navigator-turn28-ship.html")
OUT = Path("market-navigator-turn34-pre-ship.html")

data = SRC.read_bytes()
OUT.write_bytes(data)

if OUT.read_bytes() != data:
    raise SystemExit("FAIL Turn34 rollback is not byte-identical to accepted Turn28")

print(f"PASS Turn34 rollback: byte-identical Turn28 restoration ({len(data)} bytes)")
