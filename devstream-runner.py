#!/usr/bin/env python3
"""devstream-runner — stateless build agent for devstream.html
Polls devstream/threads/*.json in the configured repo(s) for pending user
messages, builds with the thread's engine, commits the output file, writes
status to devstream/devstream-status.json. All state lives in GitHub.

Engines:
  claude          -> `claude -p` CLI (subscription usage)   [default]
  codex           -> `codex exec` CLI (ChatGPT subscription)
  venice          -> Venice.ai chat completions (VENICE_API_KEY)
  openrouter      -> OpenRouter chat completions (OPENROUTER_API_KEY)
  anthropic-direct-> skipped (handled in-app)

Setup on oc-ref:
  export GITHUB_TOKEN=ghp_...
  export VENICE_API_KEY=...       (optional)
  export OPENROUTER_API_KEY=...   (optional)
  python3 devstream-runner.py     (or add to the reporting server's systemd unit)
No pip installs required (stdlib only).
"""
import base64, json, os, re, subprocess, sys, time, urllib.request, urllib.error

REPOS   = ["acmeproducts/stuff"]          # repos to watch
BRANCH  = "main"
POLL_S  = 30
GH_TOKEN = os.environ.get("GITHUB_TOKEN", "")
VENICE_KEY = os.environ.get("VENICE_API_KEY", "")
OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
VENICE_MODEL = os.environ.get("VENICE_MODEL", "qwen3-235b")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "anthropic/claude-sonnet-4.5")
SOT = "devstream/devstream-status.json"
TDIR = "devstream/threads"

SYSTEM = ("You are the devstream build agent for the single-file mobile-first HTML "
          "application \"{fname}\"{plan_clause}. The user message may be: (a) a build/extend/fix "
          "instruction, (b) a question or idea to discuss, or (c) plan feedback. Respond in "
          "EXACTLY this sectioned format:\nSUMMARY: <one or two sentences>\n[optional] "
          "===ANSWER===\n<answer/discussion>\n[optional] ===PLAN===\n<the COMPLETE updated "
          "plan markdown — only if the plan should change; bump its version>\n[optional] "
          "===FILE===\n<the COMPLETE file from <!DOCTYPE html> to </html> — only if code "
          "should change>\nRules: no markdown fences around sections; preserve all existing "
          "functionality not mentioned; ideas go to the PLAN unless the user says build; "
          "\"build it\" means implement the plan's next open scope; all diagnostics surface "
          "in-app.")

def log(*a): print(time.strftime("%H:%M:%S"), *a, flush=True)

# ---------- GitHub ----------
def gh(repo, path, method="GET", body=None, raw=False, allow404=False):
    url = f"https://api.github.com/repos/{repo}/{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {GH_TOKEN}")
    req.add_header("Accept", "application/vnd.github.raw+json" if raw else "application/vnd.github+json")
    if body is not None:
        req.data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
            return data.decode() if raw else json.loads(data or b"{}")
    except urllib.error.HTTPError as e:
        if e.code == 404 and allow404: return None
        raise RuntimeError(f"GitHub {e.code} on {path}: {e.read().decode()[:200]}")

def get_file(repo, path):
    j = gh(repo, f"contents/{path}?ref={BRANCH}", allow404=True)
    if j is None: return None, None
    content = base64.b64decode(j.get("content") or "").decode("utf-8", "replace")
    if not content and j.get("size", 0) > 0:          # >1MB trap -> raw fallback
        content = gh(repo, f"contents/{path}?ref={BRANCH}", raw=True)
    return content, j["sha"]

def put_file(repo, path, content, message):
    _, sha = get_file(repo, path)                     # read SHA before every PUT
    body = {"message": message, "branch": BRANCH,
            "content": base64.b64encode(content.encode()).decode()}
    if sha: body["sha"] = sha
    j = gh(repo, f"contents/{path}", "PUT", body)
    return j["content"]["sha"]

def list_threads(repo):
    j = gh(repo, f"contents/{TDIR}?ref={BRANCH}", allow404=True)
    return [x["path"] for x in (j or []) if x["name"].endswith(".json")]

# ---------- engines ----------
def eng_cli(cmd, prompt):
    p = subprocess.run(cmd, input=prompt, capture_output=True, text=True, timeout=1800)
    if p.returncode != 0:
        raise RuntimeError(f"{cmd[0]} exited {p.returncode}: {(p.stderr or p.stdout)[-300:]}")
    return p.stdout

def eng_http(url, key, model, system, user, extra_headers=None):
    body = {"model": model, "max_tokens": 64000,
            "messages": [{"role": "system", "content": system},
                         {"role": "user", "content": user}]}
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {key}")
    for k, v in (extra_headers or {}).items(): req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=1800) as r:
            j = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{url.split('/')[2]} {e.code}: {e.read().decode()[:200]}")
    return j["choices"][0]["message"]["content"]

def run_engine(engine, fname, base, base_name, instructions, plan="", plan_file=None):
    plan_clause = f' governed by the plan document "{plan_file}"' if plan_file else ""
    system = SYSTEM.format(fname=fname, plan_clause=plan_clause)
    user = ((f"The project plan ({plan_file}):\n\n<plan>\n{plan}\n</plan>\n\n" if plan else "")
            + (f"Current file {base_name}:\n\n<file>\n{base}\n</file>\n\n" if base
               else "(No existing output file.)\n\n")
            + "Instructions:\n" + instructions)
    if engine == "claude":
        return eng_cli(["claude", "-p", "--output-format", "text"], system + "\n\n" + user)
    if engine == "codex":
        return eng_cli(["codex", "exec", "--full-auto"], system + "\n\n" + user)
    if engine == "venice":
        if not VENICE_KEY: raise RuntimeError("VENICE_API_KEY not set on runner")
        return eng_http("https://api.venice.ai/api/v1/chat/completions", VENICE_KEY,
                        VENICE_MODEL, system, user)
    if engine == "openrouter":
        if not OPENROUTER_KEY: raise RuntimeError("OPENROUTER_API_KEY not set on runner")
        return eng_http("https://openrouter.ai/api/v1/chat/completions", OPENROUTER_KEY,
                        OPENROUTER_MODEL, system, user,
                        {"HTTP-Referer": "https://acmeproducts.github.io", "X-Title": "devstream"})
    raise RuntimeError(f"unknown engine {engine}")

def parse_output(text):
    summary = "Done."
    m = re.search(r"^SUMMARY:\s*(.+)$", text, re.M)
    if m: summary = m.group(1).strip()
    def grab(tag):
        i = text.find(f"==={tag}===")
        if i < 0: return ""
        rest = text[i + len(tag) + 6:]
        j = re.search(r"===(ANSWER|PLAN|FILE)===", rest)
        return (rest[:j.start()] if j else rest).strip()
    answer, plan, code = grab("ANSWER"), grab("PLAN"), grab("FILE")
    if code.startswith("```"):
        code = re.sub(r"^```[a-zA-Z]*\n?", "", code)
        i = code.rfind("```")
        if i > -1: code = code[:i]
    di = code.find("<!DOCTYPE")
    if di > 0: code = code[di:]
    code = code.strip()
    if code and (len(code) < 200 or "</html>" not in code.lower()):
        raise RuntimeError("engine returned incomplete file content")
    if not (answer or plan or code) and m:
        answer = text[m.end():].strip()
    return summary, answer, plan, code

# ---------- SOT ----------
def set_state(repo, key, patch):
    content, _ = get_file(repo, SOT)
    sot = json.loads(content) if content else {"threads": {}, "projects": {}}
    t = sot["threads"].setdefault(key, {})
    t.update(patch)
    put_file(repo, SOT, json.dumps(sot, indent=1), f"runner: {key} -> {patch.get('state','update')}")

# ---------- main loop ----------
def process(repo, tf_path):
    content, _ = get_file(repo, tf_path)
    d = json.loads(content)
    engine = d.get("engine", "claude")
    if engine == "anthropic-direct": return False
    pend = [m for m in d["messages"] if m.get("role") == "user" and m.get("status") == "pending"]
    if not pend: return False
    key = f"{d['project']}/{d['outputFile']}"
    fname, trepo = d["outputFile"], d.get("repo", repo)
    log(f"RUN {key} [{engine}] {len(pend)} pending")
    iso = lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    set_state(repo, key, {"project": d["project"], "file": fname, "repo": trepo,
                          "engine": engine, "state": "executing", "startedAt": iso(), "error": ""})
    try:
        base, _ = get_file(trepo, fname)
        base_name = fname
        if not base and d.get("inputFile"):
            base, _ = get_file(trepo, d["inputFile"])
            base_name = f"{d['inputFile']} (input codebase)"
        plan_file = d.get("planFile")
        plan = ""
        if plan_file:
            plan, _ = get_file(trepo, plan_file)
            plan = plan or ""
        instructions = "\n\n".join(m["text"] for m in pend)
        raw = run_engine(engine, fname, base or "", base_name, instructions, plan, plan_file)
        summary, answer, new_plan, code = parse_output(raw)
        commit, test_url = "", ""
        if new_plan and plan_file:
            put_file(trepo, plan_file, new_plan, f"devstream agent[{engine}]: plan update — {key}")
        if code:
            commit = put_file(trepo, fname, code, f"devstream agent[{engine}]: {key} — {summary[:60]}")
            owner, rname = trepo.split("/")
            test_url = f"https://{owner}.github.io/{rname}/{fname}?cb={int(time.time())}"
        for m in pend: m["status"] = "done"
        reply = summary
        if answer: reply += "\n\n" + answer
        if new_plan: reply += f"\n\U0001F4CB Plan updated: {plan_file}"
        if test_url: reply += f"\nTest: {test_url}"
        msg = {"role": "agent", "text": reply, "summary": summary, "ts": iso()}
        if commit: msg["commit"] = commit
        d["messages"].append(msg)
        put_file(repo, tf_path, json.dumps(d, indent=1), f"runner: reply {key}")
        patch = {"state": "ok", "finishedAt": iso(), "error": ""}
        if commit: patch.update({"lastCommit": commit, "testUrl": test_url})
        set_state(repo, key, patch)
        log(f"OK  {key} {commit[:10]}")
    except Exception as e:
        err = str(e)[:300]
        d["messages"].append({"role": "agent", "text": f"Build failed: {err}", "ts": iso()})
        try: put_file(repo, tf_path, json.dumps(d, indent=1), f"runner: error {key}")
        except Exception: pass
        set_state(repo, key, {"state": "error", "finishedAt": iso(), "error": err})
        log(f"ERR {key} {err}")
    return True

def main():
    if not GH_TOKEN: sys.exit("GITHUB_TOKEN not set")
    log("devstream-runner up; watching", REPOS)
    while True:
        for repo in REPOS:
            try:
                for tf in list_threads(repo):
                    process(repo, tf)     # one at a time, oldest dir order
            except Exception as e:
                log("poll error:", str(e)[:200])
        time.sleep(POLL_S)

if __name__ == "__main__":
    main()
