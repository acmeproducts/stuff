#!/usr/bin/env python3
"""
SOT Project Control API
Version: 0.3.0
Build: 2026.08.09.1

Versioning rule:
- API_VERSION and BUILD_ID must be incremented for deployed behavior changes.
- The portal displays both UI and API versions so test deployments are unambiguous.
- This service owns project identity/persistence. It does NOT fake filesystem execution.
"""
from __future__ import annotations

import hashlib
import json
import os
import secrets
import shutil
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

API_VERSION = "0.3.0"
BUILD_ID = "2026.08.09.1"
DB_PATH = Path(os.environ.get("SOT_PROJECT_DB", str(Path.home() / ".openclaw" / "sot-project" / "projects.sqlite"))).expanduser()
ENGINE_ENABLED = os.environ.get("SOT_ENGINE_ENABLED", "0") == "1"
SOTCTL = os.environ.get("SOTCTL_PATH") or shutil.which("sotctl")

app = FastAPI(title="SOT Project Control API", version=API_VERSION)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class CreateProject(BaseModel):
    project_name: str = Field(min_length=1, max_length=160)
    sources: list[Any] = Field(min_length=1)
    target: Optional[str] = None
    notes: Optional[str] = None
    idempotency_key: Optional[str] = None

class PatchProject(BaseModel):
    project_name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    target: Optional[str] = None
    notes: Optional[str] = None
    openclaw_session_key: Optional[str] = None

class AddSource(BaseModel):
    path: str
    operator_label: Optional[str] = None

class AddTarget(BaseModel):
    path: str
    label: Optional[str] = None

def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()

def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def canonical_path(value: str) -> str:
    raw = os.path.expanduser(str(value).strip())
    if not raw:
        raise HTTPException(422, "Path cannot be empty")
    return os.path.realpath(raw)

def source_fingerprint(path_value: str) -> dict[str, Any]:
    path = Path(canonical_path(path_value))
    evidence: dict[str, Any] = {"exists": path.exists(), "kind": "folder"}
    if path.exists():
        try:
            st = path.stat()
            evidence["device"] = int(st.st_dev)
            evidence["inode"] = int(st.st_ino)
        except OSError:
            pass
        try:
            sv = os.statvfs(path)
            evidence["fs_total"] = int(sv.f_frsize * sv.f_blocks)
        except OSError:
            pass
        sample = []
        try:
            for child in sorted(path.iterdir(), key=lambda p: p.name.casefold())[:64]:
                try:
                    cst = child.stat()
                    sample.append([child.name, bool(child.is_dir()), int(cst.st_size if child.is_file() else 0)])
                except OSError:
                    sample.append([child.name, None, None])
        except OSError:
            pass
        evidence["sample"] = sample
    fingerprint = sha256_text(json.dumps(evidence, sort_keys=True, separators=(",", ":")))
    return {"fingerprint": fingerprint, "current_path": str(path), "evidence": evidence}

def source_input(item: Any, index: int) -> tuple[str, str]:
    if isinstance(item, str):
        return item, f"Source {index + 1}"
    if isinstance(item, dict):
        path = item.get("path") or item.get("current_path") or item.get("source_root_path")
        label = item.get("operator_label") or item.get("label") or f"Source {index + 1}"
        if path:
            return str(path), str(label)
    raise HTTPException(422, f"Invalid source at index {index}")

@contextmanager
def db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db() -> None:
    with db() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS projects (
          project_token TEXT PRIMARY KEY, project_name TEXT NOT NULL, initial_project_name TEXT NOT NULL,
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL, status TEXT NOT NULL, current_stage TEXT NOT NULL,
          current_run_id TEXT, target_path TEXT, openclaw_session_key TEXT, notes TEXT,
          semantic_signature TEXT NOT NULL, promoted_at TEXT, deleted_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_projects_signature ON projects(semantic_signature, deleted_at);
        CREATE TABLE IF NOT EXISTS project_sources (
          source_id TEXT PRIMARY KEY, project_token TEXT NOT NULL, source_fingerprint TEXT NOT NULL,
          current_path TEXT NOT NULL, operator_label TEXT, status TEXT NOT NULL, added_at TEXT NOT NULL,
          last_seen_at TEXT NOT NULL, fingerprint_evidence_json TEXT,
          FOREIGN KEY(project_token) REFERENCES projects(project_token)
        );
        CREATE INDEX IF NOT EXISTS idx_sources_project ON project_sources(project_token);
        CREATE INDEX IF NOT EXISTS idx_sources_fingerprint ON project_sources(source_fingerprint);
        CREATE TABLE IF NOT EXISTS project_targets (
          target_id TEXT PRIMARY KEY, project_token TEXT NOT NULL, target_path TEXT NOT NULL,
          label TEXT, status TEXT NOT NULL, added_at TEXT NOT NULL, promoted_at TEXT,
          FOREIGN KEY(project_token) REFERENCES projects(project_token)
        );
        CREATE TABLE IF NOT EXISTS project_runs (
          run_id TEXT PRIMARY KEY, project_token TEXT NOT NULL, started_at TEXT, ended_at TEXT,
          status TEXT NOT NULL, restart_of_run_id TEXT, checkpoint_state TEXT,
          FOREIGN KEY(project_token) REFERENCES projects(project_token)
        );
        CREATE TABLE IF NOT EXISTS project_events (
          event_id TEXT PRIMARY KEY, project_token TEXT NOT NULL, run_id TEXT, timestamp TEXT NOT NULL,
          event_type TEXT NOT NULL, actor TEXT, message TEXT, details_json TEXT,
          FOREIGN KEY(project_token) REFERENCES projects(project_token)
        );
        CREATE INDEX IF NOT EXISTS idx_events_project ON project_events(project_token, timestamp);
        CREATE TABLE IF NOT EXISTS idempotency_keys (
          idempotency_key TEXT PRIMARY KEY, project_token TEXT NOT NULL, request_hash TEXT NOT NULL, created_at TEXT NOT NULL
        );
        """)

def event(c: sqlite3.Connection, token: str, event_type: str, message: str, *, run_id: str | None = None, actor: str = "portal", details: dict | None = None) -> None:
    c.execute("INSERT INTO project_events(event_id,project_token,run_id,timestamp,event_type,actor,message,details_json) VALUES(?,?,?,?,?,?,?,?)",
              ("EVT-" + secrets.token_hex(10).upper(), token, run_id, utcnow(), event_type, actor, message, json.dumps(details or {}, sort_keys=True)))

def rowdict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    return dict(row) if row else None

def get_project_or_404(c: sqlite3.Connection, token: str) -> sqlite3.Row:
    row = c.execute("SELECT * FROM projects WHERE project_token=? AND deleted_at IS NULL", (token,)).fetchone()
    if not row:
        raise HTTPException(404, "Project not found")
    return row

def engine_state() -> tuple[bool, str]:
    if not ENGINE_ENABLED:
        return False, "Execution engine intentionally disabled until sotctl is installed and enabled"
    if not SOTCTL:
        return False, "SOT_ENGINE_ENABLED=1 but sotctl is not available"
    return False, "sotctl was found, but project-level worker orchestration is not implemented in API v0.3.0"

def full_project(c: sqlite3.Connection, token: str) -> dict[str, Any]:
    p = rowdict(get_project_or_404(c, token)) or {}
    p["sources"] = [dict(r) for r in c.execute("SELECT source_id,source_fingerprint,current_path,operator_label,status,added_at,last_seen_at FROM project_sources WHERE project_token=? ORDER BY added_at", (token,)).fetchall()]
    p["targets"] = [dict(r) for r in c.execute("SELECT * FROM project_targets WHERE project_token=? ORDER BY added_at", (token,)).fetchall()]
    ready, reason = engine_state()
    p["engine_ready"] = ready
    p["engine_reason"] = reason
    p["last_checkpoint"] = None
    return p

@app.on_event("startup")
def startup() -> None:
    init_db()

@app.get("/health")
@app.get("/api/projects/health")
def health() -> dict[str, Any]:
    ready, reason = engine_state()
    return {"status": "ok", "version": API_VERSION, "build": BUILD_ID, "db": str(DB_PATH), "engine_ready": ready, "engine_reason": reason}

@app.get("/")
@app.get("/api/projects")
def list_projects() -> dict[str, Any]:
    with db() as c:
        rows = c.execute("SELECT project_token FROM projects WHERE deleted_at IS NULL ORDER BY updated_at DESC").fetchall()
        return {"projects": [full_project(c, r["project_token"]) for r in rows], "version": API_VERSION}

@app.post("/")
@app.post("/api/projects")
def create_project(payload: CreateProject, idempotency_header: Optional[str] = Header(default=None, alias="Idempotency-Key")) -> dict[str, Any]:
    created_at = utcnow()
    source_rows = []
    for i, item in enumerate(payload.sources):
        path, label = source_input(item, i)
        fp = source_fingerprint(path)
        source_rows.append({"label": label, **fp})
    target = canonical_path(payload.target) if payload.target else None
    semantic_obj = {"name": payload.project_name.strip().casefold(), "source_fingerprints": sorted(x["fingerprint"] for x in source_rows), "target": target or ""}
    semantic_signature = sha256_text(json.dumps(semantic_obj, sort_keys=True, separators=(",", ":")))
    request_obj = {"project_name": payload.project_name.strip(), "sources": [x["current_path"] for x in source_rows], "target": target, "notes": payload.notes or ""}
    request_hash = sha256_text(json.dumps(request_obj, sort_keys=True, separators=(",", ":")))
    idem = (payload.idempotency_key or idempotency_header or "").strip()
    with db() as c:
        if idem:
            prior = c.execute("SELECT * FROM idempotency_keys WHERE idempotency_key=?", (idem,)).fetchone()
            if prior:
                if prior["request_hash"] != request_hash:
                    raise HTTPException(409, "Idempotency key was already used for a different project request")
                return {"project": full_project(c, prior["project_token"]), "deduplicated": True, "reason": "idempotency_key"}
        existing = c.execute("SELECT project_token FROM projects WHERE semantic_signature=? AND deleted_at IS NULL ORDER BY created_at LIMIT 1", (semantic_signature,)).fetchone()
        if existing:
            if idem:
                c.execute("INSERT OR IGNORE INTO idempotency_keys VALUES(?,?,?,?)", (idem, existing["project_token"], request_hash, created_at))
            return {"project": full_project(c, existing["project_token"]), "deduplicated": True, "reason": "matching_project_identity"}
        entropy = secrets.token_hex(16)
        token_hash = sha256_text(json.dumps({"created_at": created_at, "name": payload.project_name.strip(), "sources": sorted(x["fingerprint"] for x in source_rows), "entropy": entropy}, sort_keys=True))
        token = "PRJ-" + token_hash[:24].upper()
        c.execute("INSERT INTO projects(project_token,project_name,initial_project_name,created_at,updated_at,status,current_stage,target_path,notes,semantic_signature) VALUES(?,?,?,?,?,?,?,?,?,?)",
                  (token, payload.project_name.strip(), payload.project_name.strip(), created_at, created_at, "REGISTERED", "REGISTERED", target, payload.notes, semantic_signature))
        for src in source_rows:
            source_id = "SRC-" + sha256_text(token + src["fingerprint"] + src["current_path"])[:16].upper()
            c.execute("INSERT INTO project_sources VALUES(?,?,?,?,?,?,?,?,?)",
                      (source_id, token, src["fingerprint"], src["current_path"], src["label"], "REGISTERED", created_at, created_at, json.dumps(src["evidence"], sort_keys=True)))
        if target:
            target_id = "TGT-" + sha256_text(token + target)[:16].upper()
            c.execute("INSERT INTO project_targets(target_id,project_token,target_path,label,status,added_at) VALUES(?,?,?,?,?,?)",
                      (target_id, token, target, "Initial target", "ASSIGNED", created_at))
        if idem:
            c.execute("INSERT INTO idempotency_keys VALUES(?,?,?,?)", (idem, token, request_hash, created_at))
        event(c, token, "PROJECT_CREATED", f'Project "{payload.project_name.strip()}" created', details={"source_count": len(source_rows), "target": target})
        return {"project": full_project(c, token), "deduplicated": False}

@app.get("/{token}")
@app.get("/api/projects/{token}")
def get_project(token: str) -> dict[str, Any]:
    if token == "health":
        return health()
    with db() as c:
        return full_project(c, token)

@app.patch("/{token}")
@app.patch("/api/projects/{token}")
def patch_project(token: str, payload: PatchProject) -> dict[str, Any]:
    with db() as c:
        before = dict(get_project_or_404(c, token))
        name = payload.project_name or payload.name
        updates, values = [], []
        if name is not None:
            updates.append("project_name=?"); values.append(name.strip())
        if payload.target is not None:
            target = canonical_path(payload.target) if payload.target else None
            updates.append("target_path=?"); values.append(target)
        if payload.notes is not None:
            updates.append("notes=?"); values.append(payload.notes)
        if payload.openclaw_session_key is not None:
            updates.append("openclaw_session_key=?"); values.append(payload.openclaw_session_key or None)
        if not updates:
            return full_project(c, token)
        updates.append("updated_at=?"); values.append(utcnow()); values.append(token)
        c.execute(f"UPDATE projects SET {', '.join(updates)} WHERE project_token=?", values)
        if name is not None and name.strip() != before["project_name"]:
            event(c, token, "PROJECT_RENAMED", f'Project renamed from "{before["project_name"]}" to "{name.strip()}"')
        if payload.target is not None:
            target = canonical_path(payload.target) if payload.target else None
            if target:
                target_id = "TGT-" + sha256_text(token + target)[:16].upper()
                c.execute("INSERT OR IGNORE INTO project_targets(target_id,project_token,target_path,label,status,added_at) VALUES(?,?,?,?,?,?)",
                          (target_id, token, target, "Project target", "ASSIGNED", utcnow()))
            event(c, token, "TARGET_CHANGED", f"Project target changed to {target or 'none'}", details={"target": target})
        return full_project(c, token)

@app.delete("/{token}")
@app.delete("/api/projects/{token}")
def delete_project(token: str) -> dict[str, Any]:
    with db() as c:
        p = get_project_or_404(c, token)
        if p["status"] not in {"REGISTERED", "PAUSED", "VERIFIED", "ERROR", "RECONCILED_INTO_SOT"}:
            raise HTTPException(409, "Project metadata cannot be deleted while work is active")
        event(c, token, "PROJECT_DELETED", f'Project "{p["project_name"]}" metadata deleted')
        c.execute("UPDATE projects SET deleted_at=?, updated_at=? WHERE project_token=?", (utcnow(), utcnow(), token))
        return {"ok": True, "project_token": token}

@app.get("/{token}/status")
@app.get("/api/projects/{token}/status")
def project_status(token: str) -> dict[str, Any]:
    with db() as c:
        return full_project(c, token)

def engine_not_ready(token: str, action: str) -> None:
    with db() as c:
        get_project_or_404(c, token)
        ready, reason = engine_state()
        event(c, token, "OPERATION_REJECTED", f"{action} was not executed: {reason}", details={"action": action, "engine_ready": ready})
    raise HTTPException(status_code=501, detail={"code": "ENGINE_NOT_READY", "message": reason, "action": action})

@app.post("/{token}/start")
@app.post("/api/projects/{token}/start")
def start_project(token: str): engine_not_ready(token, "start")
@app.post("/{token}/pause")
@app.post("/api/projects/{token}/pause")
def pause_project(token: str): engine_not_ready(token, "pause")
@app.post("/{token}/resume")
@app.post("/api/projects/{token}/resume")
def resume_project(token: str): engine_not_ready(token, "resume")
@app.post("/{token}/restart")
@app.post("/api/projects/{token}/restart")
def restart_project(token: str): engine_not_ready(token, "restart")
@app.post("/{token}/promote")
@app.post("/api/projects/{token}/promote")
def promote_project(token: str): engine_not_ready(token, "promote")

@app.post("/{token}/sources")
@app.post("/api/projects/{token}/sources")
def add_source(token: str, payload: AddSource) -> dict[str, Any]:
    fp = source_fingerprint(payload.path)
    with db() as c:
        get_project_or_404(c, token)
        exists = c.execute("SELECT * FROM project_sources WHERE project_token=? AND source_fingerprint=? AND current_path=?", (token, fp["fingerprint"], fp["current_path"])).fetchone()
        if exists:
            return {"source": dict(exists), "deduplicated": True}
        source_id = "SRC-" + sha256_text(token + fp["fingerprint"] + fp["current_path"])[:16].upper()
        now = utcnow()
        c.execute("INSERT INTO project_sources VALUES(?,?,?,?,?,?,?,?,?)", (source_id, token, fp["fingerprint"], fp["current_path"], payload.operator_label or "Source", "REGISTERED", now, now, json.dumps(fp["evidence"], sort_keys=True)))
        event(c, token, "SOURCE_ADDED", f"Source added: {fp['current_path']}", details={"source_id": source_id, "fingerprint": fp["fingerprint"]})
        return {"source": dict(c.execute("SELECT * FROM project_sources WHERE source_id=?", (source_id,)).fetchone()), "deduplicated": False}

@app.delete("/{token}/sources/{source_id}")
@app.delete("/api/projects/{token}/sources/{source_id}")
def remove_source(token: str, source_id: str) -> dict[str, Any]:
    with db() as c:
        get_project_or_404(c, token)
        src = c.execute("SELECT * FROM project_sources WHERE project_token=? AND source_id=?", (token, source_id)).fetchone()
        if not src:
            raise HTTPException(404, "Source not found")
        c.execute("DELETE FROM project_sources WHERE source_id=?", (source_id,))
        event(c, token, "SOURCE_REMOVED", f"Source removed from project: {src['current_path']}", details={"source_id": source_id})
        return {"ok": True}

@app.post("/{token}/targets")
@app.post("/api/projects/{token}/targets")
def add_target(token: str, payload: AddTarget) -> dict[str, Any]:
    target = canonical_path(payload.path)
    with db() as c:
        get_project_or_404(c, token)
        target_id = "TGT-" + sha256_text(token + target)[:16].upper()
        now = utcnow()
        c.execute("INSERT OR IGNORE INTO project_targets(target_id,project_token,target_path,label,status,added_at) VALUES(?,?,?,?,?,?)",
                  (target_id, token, target, payload.label or "Target", "ASSIGNED", now))
        c.execute("UPDATE projects SET target_path=?,updated_at=? WHERE project_token=?", (target, now, token))
        event(c, token, "TARGET_ADDED", f"Target assigned: {target}", details={"target_id": target_id})
        return {"target": dict(c.execute("SELECT * FROM project_targets WHERE target_id=?", (target_id,)).fetchone())}

@app.get("/aggregate")
@app.get("/api/reports/aggregate")
def aggregate_report() -> dict[str, Any]:
    with db() as c:
        total = c.execute("SELECT COUNT(*) n FROM projects WHERE deleted_at IS NULL").fetchone()["n"]
        active = c.execute("SELECT COUNT(*) n FROM projects WHERE deleted_at IS NULL AND status NOT IN ('REGISTERED','PAUSED','VERIFIED','ERROR','RECONCILED_INTO_SOT')").fetchone()["n"]
        paused = c.execute("SELECT COUNT(*) n FROM projects WHERE deleted_at IS NULL AND status='PAUSED'").fetchone()["n"]
        complete = c.execute("SELECT COUNT(*) n FROM projects WHERE deleted_at IS NULL AND status IN ('VERIFIED','RECONCILED_INTO_SOT')").fetchone()["n"]
        sources = c.execute("SELECT COUNT(*) n FROM project_sources s JOIN projects p ON p.project_token=s.project_token WHERE p.deleted_at IS NULL").fetchone()["n"]
        runs = c.execute("SELECT COUNT(*) n FROM project_runs r JOIN projects p ON p.project_token=r.project_token WHERE p.deleted_at IS NULL").fetchone()["n"]
        events_n = c.execute("SELECT COUNT(*) n FROM project_events e JOIN projects p ON p.project_token=e.project_token WHERE p.deleted_at IS NULL").fetchone()["n"]
        return {"version": API_VERSION, "projects_total": total, "projects_active": active, "projects_paused": paused, "projects_complete": complete,
                "sources_total": sources, "runs_total": runs, "events_total": events_n, "raw_bytes_scanned": 0, "unique_bytes": 0,
                "exact_duplicate_bytes": 0, "verification_failures": 0, "collisions": 0, "current_sot_bytes": 0}

@app.get("/timeline")
@app.get("/api/reports/timeline")
def timeline_report(limit: int = Query(default=250, ge=1, le=2000)) -> dict[str, Any]:
    with db() as c:
        rows = c.execute("SELECT e.*,p.project_name FROM project_events e JOIN projects p ON p.project_token=e.project_token WHERE p.deleted_at IS NULL ORDER BY e.timestamp DESC LIMIT ?", (limit,)).fetchall()
        return {"events": [dict(r) for r in rows], "version": API_VERSION}

@app.get("/{token}/report")
@app.get("/api/projects/{token}/report")
def project_report(token: str) -> dict[str, Any]:
    with db() as c:
        p = full_project(c, token)
        sources = [dict(r) for r in c.execute("SELECT * FROM project_sources WHERE project_token=? ORDER BY added_at", (token,)).fetchall()]
        targets = [dict(r) for r in c.execute("SELECT * FROM project_targets WHERE project_token=? ORDER BY added_at", (token,)).fetchall()]
        runs = [dict(r) for r in c.execute("SELECT * FROM project_runs WHERE project_token=? ORDER BY COALESCE(started_at,'') DESC", (token,)).fetchall()]
        events = [dict(r) for r in c.execute("SELECT * FROM project_events WHERE project_token=? ORDER BY timestamp DESC LIMIT 1000", (token,)).fetchall()]
        return {"project": p, "sources": sources, "targets": targets, "runs": runs, "events": events, "version": API_VERSION}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("sot_project_api:app", host="127.0.0.1", port=8082, reload=False)
