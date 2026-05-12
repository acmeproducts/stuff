# fastText static browser package

This folder is ready to host as static files under a subpath such as `/stuff/fastType/`.

## Files

- `fasttext-wrapper.mjs`: browser ESM wrapper with the required API.
- `fasttext-wrapper.umd.js`: classic browser global wrapper with the required API.
- `index.mjs`: upstream fasttext.wasm browser wrapper.
- `core/fasttext.mjs`: Emscripten module loader.
- `core/fasttext.wasm`: separately loadable WASM binary.
- `model/lid.176.ftz`: fastText language-identification model.
- `smoke-test.html`: browser smoke test.
- `manifest.sha256.txt`: SHA256 checksums.
- `provenance.json`: package/source/license metadata.

## Required API

```js
import { FastText } from "./fasttext-wrapper.mjs";

const ft = new FastText();
await ft.loadModel("/stuff/fastType/model/lid.176.ftz");
const result = ft.predict("hello how are you today", 1);
```

For a classic script:

```html
<script src="/stuff/fastType/fasttext-wrapper.umd.js"></script>
<script>
  (async function () {
    const ft = new FastText();
    await ft.loadModel("/stuff/fastType/model/lid.176.ftz");
    const result = ft.predict("hello how are you today", 1);
    console.log(result);
  })();
</script>
```

## Runtime path override

The wrapper honors `FastTextModule.locateFile(path)` and `Module.locateFile(path)`.

```html
<script>
  window.FastTextModule = {
    locateFile(path) {
      if (path.endsWith(".wasm")) return "/stuff/fastType/core/fasttext.wasm";
      return "/stuff/fastType/" + path;
    }
  };
</script>
```

## Acceptance test

Host this folder at `/stuff/fastType/`, then open:

```text
/stuff/fastType/smoke-test.html
```

The page must print `PASS`.
