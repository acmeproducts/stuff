#!/usr/bin/env python3
"""TalkBridge build pipeline. Plan v6 Part 5/7 P1.
Deterministic: verify pinned golden sources -> extract bridge module ->
fingerprint lock/recompute -> assemble output. Same inputs => byte-identical output.
Usage: python3 build.py <src_dir> <out_dir>
"""
import sys, os, json, hashlib

def sha256(b): return hashlib.sha256(b).hexdigest()

def main():
    src, out = sys.argv[1], sys.argv[2]
    here = os.path.dirname(os.path.abspath(__file__))
    pin = json.load(open(os.path.join(here, "pin.json")))

    # 1. Verify golden sources against pinned checksums. Mismatch = stop.
    blobs = {}
    for s in pin["sources"]:
        b = open(os.path.join(src, s["path"]), "rb").read()
        got = sha256(b)
        if got != s["sha256"]:
            print(f"GOLDEN MISMATCH {s['path']}: {got}"); sys.exit(1)
        blobs[s["path"]] = b
        print(f"golden ok {s['path']}")

    # 2. Extract bridge module: the single main <script> block of the bridge source.
    bridge = blobs[pin["bridge_source"]].decode("utf-8")
    a = bridge.index("<script>") + len("<script>")
    z = bridge.rindex("</script>")
    module = bridge[a:z]
    fp = sha256(module.encode("utf-8"))
    locked = pin["module_fingerprint_locked"]
    if locked and fp != locked:
        print(f"FINGERPRINT MISMATCH: locked {locked} recomputed {fp}"); sys.exit(1)
    print(f"module fingerprint {fp}" + (" (matches lock)" if locked else " (no lock yet)"))
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, "bridge-module.js"), "w", newline="").write(module)

    # 3. Assemble output. P1: shell verbatim + inert injection marker (no behavior change).
    shell = blobs[pin["shell_source"]].decode("utf-8")
    marker = "\n<!-- TB-INJECT:M2M3M4 (build-time injection point; inert until P3) -->\n"
    tail = "</body>"
    i = shell.rindex(tail)
    output = shell[:i] + marker + shell[i:]
    outb = output.encode("utf-8")
    open(os.path.join(out, pin["output_file"]), "wb").write(outb)
    print(f"output {pin['output_file']} sha256 {sha256(outb)}")

if __name__ == "__main__":
    main()
