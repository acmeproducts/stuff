const DEFAULT_CORE_PATH = new URL("./core/fasttext.mjs", import.meta.url).href;
const DEFAULT_WASM_PATH = new URL("./core/fasttext.wasm", import.meta.url).href;
const DEFAULT_MODEL_PATH = new URL("./model/lid.176.ftz", import.meta.url).href;

function getGlobalConfig(options = {}) {
  const fastTextGlobal = globalThis.FastTextModule && typeof globalThis.FastTextModule === "object" ? globalThis.FastTextModule : {};
  const moduleGlobal = globalThis.Module && typeof globalThis.Module === "object" ? globalThis.Module : {};
  return { ...moduleGlobal, ...fastTextGlobal, ...options };
}

function resolveByLocateFile(config, fileName, fallbackUrl) {
  if (typeof config.locateFile === "function") {
    const located = config.locateFile(fileName, new URL("./", import.meta.url).href);
    if (located) return located;
  }
  return fallbackUrl;
}

function normalizeLabel(label) {
  if (typeof label !== "string") return label;
  return label.replace(/^__label__/, "").replace(/^label__/, "");
}

export class FastText {
  constructor(options = {}) {
    this.options = options;
    this.runtime = null;
    this.loaded = false;
  }

  async init() {
    if (this.runtime) return this.runtime;

    const config = getGlobalConfig(this.options);
    const corePath = config.corePath || DEFAULT_CORE_PATH;
    const wasmPath = config.wasmPath || resolveByLocateFile(config, "fasttext.wasm", DEFAULT_WASM_PATH);
    const upstreamPath = config.upstreamPath || new URL("./index.mjs", import.meta.url).href;

    const upstream = await import(upstreamPath);
    this.runtime = await upstream.FastText.create({
      corePath,
      wasmPath
    });
    return this.runtime;
  }

  async loadModel(modelUrl = DEFAULT_MODEL_PATH) {
    const runtime = await this.init();
    await runtime.loadModel(modelUrl);
    this.loaded = true;
    return this;
  }

  predict(text, k = 1) {
    if (!this.runtime || !this.loaded) {
      throw new Error("FastText model is not loaded. Call await loadModel(modelUrl) before predict(text, k).");
    }
    return this.runtime.predict(text, k);
  }

  detect(text) {
    const result = this.predict(text, 1);
    if (result instanceof Map) {
      const first = result.keys().next();
      return first.done ? undefined : normalizeLabel(first.value);
    }
    if (Array.isArray(result) && result.length > 0) {
      const first = result[0];
      if (Array.isArray(first)) return normalizeLabel(first[0]);
      if (first && typeof first === "object") return normalizeLabel(first.label ?? first[0]);
      return normalizeLabel(first);
    }
    return normalizeLabel(result);
  }
}

export { DEFAULT_CORE_PATH, DEFAULT_WASM_PATH, DEFAULT_MODEL_PATH };

if (!globalThis.FastTextModule || typeof globalThis.FastTextModule !== "object") {
  globalThis.FastTextModule = {};
}

globalThis.FastText = FastText;
