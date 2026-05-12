# FastText WASM PoC

## Purpose
This page validates runtime FastText behavior in isolation using the deployed wrapper/core/model assets, with staged diagnostics and deep probes that go beyond simple smoke tests.

## How to open/run
1. Open `fasttext-wasm-poc.html` in the same environment where `fastType/...` assets are served.
2. Click **Run Full Probe**.
3. Optionally run **Manual predict(k=1)** after model load.

## What to inspect in logs
- Asset probing rows (`wrapper`, `mjs`, `wasm`, `model`) for status and byte size.
- Stage diagnostics for wrapper load, FastText global check, constructor/init, model load timing (or timeout), smoke status.
- Deep probe table for per-call return-shape classification and normalized extraction.
- Loop probe stats and captured per-call failures.
- Error payload normalization: context, JS type, detail, timestamp.

## Expected pass/fail signals
- **Pass**: all asset probes `ok`, model load stage reports ms timing, smoke tests pass, deep probe rows populate shapes/normalized labels.
- **Fail (non-blocking)**: any stage can fail without a blocking overlay; details stay visible in status panel and log area.

## Why this differs from simple smoke tests
Smoke checks can pass on a narrow fixed input set while runtime still fails on shape variants, edge inputs, or repeated-call stability. This PoC adds shape introspection, normalization visualization, and repeated-call failure capture to expose those runtime gaps.
