(function (global) {
  "use strict";

  var scriptUrl = document.currentScript && document.currentScript.src ? document.currentScript.src : window.location.href;
  var baseUrl = new URL("./", scriptUrl).href;
  var DEFAULT_CORE_PATH = new URL("./core/fasttext.mjs", baseUrl).href;
  var DEFAULT_WASM_PATH = new URL("./core/fasttext.wasm", baseUrl).href;
  var DEFAULT_MODEL_PATH = new URL("./model/lid.176.ftz", baseUrl).href;

  function getGlobalConfig(options) {
    var fastTextGlobal = global.FastTextModule && typeof global.FastTextModule === "object" ? global.FastTextModule : {};
    var moduleGlobal = global.Module && typeof global.Module === "object" ? global.Module : {};
    return Object.assign({}, moduleGlobal, fastTextGlobal, options || {});
  }

  function resolveByLocateFile(config, fileName, fallbackUrl) {
    if (typeof config.locateFile === "function") {
      var located = config.locateFile(fileName, baseUrl);
      if (located) return located;
    }
    return fallbackUrl;
  }

  function normalizeLabel(label) {
    if (typeof label !== "string") return label;
    return label.replace(/^__label__/, "").replace(/^label__/, "");
  }

  function FastText(options) {
    this.options = options || {};
    this.runtime = null;
    this.loaded = false;
  }

  FastText.prototype.init = async function () {
    if (this.runtime) return this.runtime;

    var config = getGlobalConfig(this.options);
    var corePath = config.corePath || DEFAULT_CORE_PATH;
    var wasmPath = config.wasmPath || resolveByLocateFile(config, "fasttext.wasm", DEFAULT_WASM_PATH);
    var upstreamPath = config.upstreamPath || new URL("./index.mjs", baseUrl).href;

    var upstream = await import(upstreamPath);
    this.runtime = await upstream.FastText.create({
      corePath: corePath,
      wasmPath: wasmPath
    });
    return this.runtime;
  };

  FastText.prototype.loadModel = async function (modelUrl) {
    var runtime = await this.init();
    await runtime.loadModel(modelUrl || DEFAULT_MODEL_PATH);
    this.loaded = true;
    return this;
  };

  FastText.prototype.predict = function (text, k) {
    if (!this.runtime || !this.loaded) {
      throw new Error("FastText model is not loaded. Call await loadModel(modelUrl) before predict(text, k).");
    }
    return this.runtime.predict(text, typeof k === "number" ? k : 1);
  };

  FastText.prototype.detect = function (text) {
    var result = this.predict(text, 1);
    if (result instanceof Map) {
      var first = result.keys().next();
      return first.done ? undefined : normalizeLabel(first.value);
    }
    if (Array.isArray(result) && result.length > 0) {
      var item = result[0];
      if (Array.isArray(item)) return normalizeLabel(item[0]);
      if (item && typeof item === "object") return normalizeLabel(item.label || item[0]);
      return normalizeLabel(item);
    }
    return normalizeLabel(result);
  };

  if (!global.FastTextModule || typeof global.FastTextModule !== "object") {
    global.FastTextModule = {};
  }

  global.FastText = FastText;
})(typeof globalThis !== "undefined" ? globalThis : window);
