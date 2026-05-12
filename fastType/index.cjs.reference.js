"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf, __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
}, __copyProps = (to, from, except, desc) => {
  if (from && typeof from == "object" || typeof from == "function")
    for (let key of __getOwnPropNames(from))
      !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: !0 }) : target,
  mod
)), __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: !0 }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  FastText: () => FastText,
  buffer2Uin8Array: () => buffer2Uin8Array,
  fetchFile: () => fetchFile,
  kvPairVector2Map: () => kvPairVector2Map,
  vector2Array: () => vector2Array,
  vkPairVector2Map: () => vkPairVector2Map
});
module.exports = __toCommonJS(src_exports);

// node_modules/.pnpm/registry.npmjs.org+tsup@7.1.0_@dreamofice+ts-node@10.9.2_typescript@5.1.6/node_modules/tsup/assets/cjs_shims.js
var getImportMetaUrl = () => typeof document > "u" ? new URL("file:" + __filename).href : document.currentScript && document.currentScript.src || new URL("main.js", document.baseURI).href, importMetaUrl = /* @__PURE__ */ getImportMetaUrl();

// src/options.ts
var defaultOptions = {
  corePath: "./core/fasttext.mjs",
  wasmPath: void 0
};

// src/utils.ts
var readFile, request, fileURLToPath, vector2Array = (vector, deleteAferConvert = !1) => {
  let arr = [];
  for (let i = 0; i < vector.size(); i++)
    arr.push(vector.get(i));
  return deleteAferConvert && vector.delete(), arr;
}, kvPairVector2Map = (vector, deleteAferConvert = !1) => {
  let map = /* @__PURE__ */ new Map();
  for (let [key, value] of vector2Array(vector, deleteAferConvert))
    map.set(key, value);
  return map;
}, vkPairVector2Map = (vector, deleteAferConvert = !1) => {
  let map = /* @__PURE__ */ new Map();
  for (let [value, key] of vector2Array(vector, deleteAferConvert))
    map.set(key, value);
  return map;
}, buffer2Uin8Array = (buf) => new Uint8Array(buf.buffer, buf.byteOffset, buf.length), fetchFile = async (url) => typeof global < "u" && globalThis === global ? url.startsWith("file://") ? (readFile ?? (readFile = (await import("fs/promises")).readFile), fileURLToPath ?? (fileURLToPath = (await import("url")).fileURLToPath), buffer2Uin8Array(await readFile(fileURLToPath(url)))) : (request ?? (request = (await import("http")).request), new Promise((resolve, reject) => {
  let chunks = [];
  request(
    url,
    (res) => res.on("close", () => resolve(buffer2Uin8Array(Buffer.concat(chunks)))).on("data", (chunk) => chunks.push(chunk)).on("error", (err) => reject(err))
  );
})) : typeof Deno < "u" && url.startsWith("file://") ? Deno.readFile(url) : new Uint8Array(await (await fetch(url)).arrayBuffer());

// src/index.ts
var TEMP_MODEL_PATH = "/_tmp_model.ftz", FastText = class _FastText {
  /** Emscripten module */
  core;
  /** Emscripten filesystem */
  fs;
  ft;
  constructor(core) {
    this.core = core, this.fs = core.FS, this.ft = new core.FastText();
  }
  /**
   * Create a new FastText instance
   * @param [options] init options
   * @returns promise with a FastText instance
   */
  static async create(options = {}) {
    let opt = { ...defaultOptions, ...options }, coreCtor = (await import(opt.corePath)).default, core = await coreCtor({
      locateFile: (url, prefix) => opt.wasmPath && url.endsWith(".wasm") ? opt.wasmPath : `${prefix}${url}`,
      print: () => {
      },
      printErr: () => {
      }
    });
    return new _FastText(core);
  }
  loadModel(model = "./model/lid.176.ftz") {
    return typeof model == "string" ? fetchFile(new URL(model, importMetaUrl).href).then(
      (data) => this._loadModel(data)
    ) : this._loadModel(model);
  }
  _loadModel(model) {
    this.fs.writeFile(TEMP_MODEL_PATH, model), this.ft.loadModel(TEMP_MODEL_PATH), this.fs.unlink(TEMP_MODEL_PATH);
  }
  /** Detect the most probable language
   * @param text text to detect
   * @returns two or three letter language code
   */
  detect(text) {
    return Array.from(this.predict(text, -1, 0)).sort((lang1, lang2) => lang2[1] - lang1[1])[0][0].slice(9);
  }
  /** Same as predict method of fastText, return a Map of probability
   *  @param text text to predict
   *  @param [k] max number of return entries, use -1 to return all
   *  @param [thresold] min possibility of return entries(0~1)
   *  @returns Map of __lable__$(lang) => probability
   */
  predict(text, k = -1, thresold = 0) {
    return vkPairVector2Map(this.ft.predict(text, k, thresold), !0);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FastText,
  buffer2Uin8Array,
  fetchFile,
  kvPairVector2Map,
  vector2Array,
  vkPairVector2Map
});
