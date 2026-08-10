#!/usr/bin/env python3
"""
SOT Helper Service
UI/API Version: 0.3.1
Build: 2026.08.10.1

ARCHITECTURE RULE
-----------------
This is the ONE auxiliary SOT HTTP service. It runs on 127.0.0.1:8081 and owns:
  - dynamic WSL filesystem discovery
  - project identity and persistence
  - source/target assignment
  - reporting metadata

Do not split these functions into additional daemons or ports unless an actual
technical boundary requires it. The deterministic reconciliation engine (sotctl)
will be invoked by this service when implemented; it will not require another
HTTP service.

Tailscale may mount this service at /api and may either preserve or strip that
prefix depending on proxy configuration. Therefore the API intentionally exposes
both /api/... and stripped aliases such as /fs, /projects and /reports.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import shutil
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from urllib.parse import unquote

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

API_VERSION = "0.3.1"
BUILD_ID = "2026.08.10.1"
SERVICE_PORT = 8081
DB_PATH = Path(
    os.environ.get(
        "SOT_PROJECT_DB",
        str(Path.home() / ".openclaw" / "sot-project" / "projects.sqlite"),
    )
).expanduser()
ENGINE_ENABLED = os.environ.get("SOT_ENGINE_ENABLED", "0") == "1"
SOTCTL = os.environ.get("SOTCTL_PATH") or shutil.which("sotctl")

app = FastAPI(title="SOT Helper Service", version=API_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Shared utilities
# ============================================================================

def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def canonical_path(value: str) -> str:
    raw = os.path.expanduser(str(value).strip())
    if not raw:
        raise HTTPException(422, "Path cannot be empty")
    return os.path.realpath(raw)


def canonical_target_path(value: str) -> str:
    path = Path(canonical_path(value))
    if not path.exists():
        raise HTTPException(404, "Target path not found")
    if not path.is_dir():
        raise HTTPException(400, "Target path is not a directory")
    return str(path)


def decode_mount_field(value: str) -> str:
    return (
        value.replace("\\040", " ")
        .replace("\\011", "\t")
        .replace("\\012", "\n")
        .replace("\\134", "\\")
    )


# ============================================================================
# Dynamic filesystem browser
# ============================================================================

SYSTEM_PREFIXES = ("/proc", "/sys", "/dev", "/run", "/snap")
WINDOWS_INVALID_NAME = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
WINDOWS_RESERVED_NAMES = {
    "CON", "PRN", "AUX", "NUL",
    *(f"COM{i}" for i in range(1, 10)),
    *(f"LPT{i}" for i in range(1, 10)),
}


def discover_mounts() -> list[Path]:
    """Discover mounts on EVERY request; no cached allowed-root list."""
    found: dict[str, Path] = {}

    mnt = Path("/mnt")
    if mnt.is_dir():
        try:
            for entry in mnt.iterdir():
                try:
                    if entry.is_dir():
                        found[str(entry)] = entry
                except (PermissionError, OSError):
                    pass
        except (PermissionError, OSError):
            pass

    mountinfo = Path("/proc/self/mountinfo")
    if mountinfo.exists():
        try:
            for line in mountinfo.read_text(encoding="utf-8", errors="replace").splitlines():
                fields = line.split()
                if len(fields) < 5:
                    continue
                mount_string = decode_mount_field(fields[4])
                if mount_string == "/" or mount_string.startswith(SYSTEM_PREFIXES):
                    continue
                mount_path = Path(mount_string)
                try:
                    if mount_path.is_dir():
                        found[str(mount_path)] = mount_path
                except (PermissionError, OSError):
                    pass
        except (PermissionError, OSError):
            pass

    def sort_key(path: Path):
        text = str(path)
        if re.fullmatch(r"/mnt/[A-Za-z]", text):
            return (0, text.lower())
        return (1, text.lower())

    return sorted(found.values(), key=sort_key)


def allowed_roots() -> list[Path]:
    roots = discover_mounts()
    home = Path.home()
    if home.is_dir():
        roots.append(home)
    return roots


def build_root_entries() -> list[tuple[str, Path]]:
    entries: list[tuple[str, Path]] = []
    seen: set[str] = set()
    for mount in discover_mounts():
        text = str(mount)
        match = re.fullmatch(r"/mnt/([A-Za-z])", text)
        label = match.group(1).upper() + ":" if match else text
        if label not in seen:
            seen.add(label)
            entries.append((label, mount))
    home = Path.home()
    if home.is_dir() and "WSL Home" not in seen:
        entries.append(("WSL Home", home))
    return entries


def alias_to_path(value: str) -> Optional[Path]:
    raw = unquote(value).strip()
    if raw.lower() == "wsl home":
        return Path.home()
    candidate = raw.lstrip("/")
    match = re.fullmatch(r"([A-Za-z]):(?:[\\/](.*))?", candidate)
    if not match:
        return None
    base = Path("/mnt") / match.group(1).lower()
    remainder = match.group(2) or ""
    if remainder:
        for part in [p for p in re.split(r"[\\/]+", remainder) if p]:
            base = base / part
    return base


def resolve_browser_path(requested: str) -> Path:
    requested = unquote(requested or "").strip()
    alias = alias_to_path(requested)
    candidate = alias if alias is not None else Path(requested).expanduser()
    try:
        candidate = candidate.resolve(strict=False)
    except OSError as exc:
        raise HTTPException(400, f"Unable to resolve path: {exc}") from exc

    for root in allowed_roots():
        try:
            candidate.relative_to(root.resolve(strict=False))
            return candidate
        except (ValueError, OSError):
            continue
    raise HTTPException(400, f"Path is not within a currently visible WSL mount: {requested}")


def list_directory(path: str = "/") -> JSONResponse:
    if path in ("", "/"):
        roots = build_root_entries()
        return JSONResponse(
            content={
                "path": "/",
                "folders": [label for label, _ in roots],
                "files": [],
                "paths": {label: str(real) for label, real in roots},
                "rescanned_at": utcnow(),
            }
        )

    target = resolve_browser_path(path)
    if not target.exists():
        raise HTTPException(404, "Path not found")
    if not target.is_dir():
        raise HTTPException(400, "Path is not a directory")

    folders: list[str] = []
    files: list[str] = []
    try:
        entries = list(target.iterdir())
    except PermissionError as exc:
        raise HTTPException(403, "Permission denied") from exc
    except OSError as exc:
        raise HTTPException(500, str(exc)) from exc

    for entry in entries:
        try:
            if entry.is_dir():
                folders.append(entry.name)
            elif entry.is_file():
                files.append(entry.name)
        except (PermissionError, OSError):
            continue

    folders.sort(key=str.casefold)
    files.sort(key=str.casefold)
    return JSONResponse(
        content={
            "path": str(target),
            "folders": folders,
            "files": files,
            "rescanned_at": utcnow(),
        }
    )


class MkdirRequest(BaseModel):
    parent_path: Optional[str] = None
    folder_name: Optional[str] = None
    # v0.3.1 pre-release compatibility aliases; canonical names are above.
    parent: Optional[str] = None
    name: Optional[str] = None


def validate_child_name(raw: str) -> str:
    name = str(raw or "").strip()
    if not name:
        raise HTTPException(422, "Target folder name is required")
    if name in {".", ".."} or ".." in Path(name).parts:
        raise HTTPException(422, "Target folder name cannot contain path traversal")
    if WINDOWS_INVALID_NAME.search(name):
        raise HTTPException(422, "Target folder name contains invalid characters")
    if name.endswith((" ", ".")):
        raise HTTPException(422, "Target folder name cannot end with a space or period")
    stem = name.split(".", 1)[0].upper()
    if stem in WINDOWS_RESERVED_NAMES:
        raise HTTPException(422, "Target folder name is reserved")
    return name


def make_target_directory(payload: MkdirRequest) -> dict[str, Any]:
    parent_raw = payload.parent_path or payload.parent
    name_raw = payload.folder_name or payload.name
    if not parent_raw:
        raise HTTPException(422, "Target parent path is required")
    parent = resolve_browser_path(parent_raw)
    if not parent.exists():
        raise HTTPException(404, "Target parent path not found")
    if not parent.is_dir():
        raise HTTPException(400, "Target parent path is not a directory")

    name = validate_child_name(name_raw or "")
    target = (parent / name).resolve(strict=False)
    if target.parent != parent.resolve(strict=False):
        raise HTTPException(422, "Target folder escapes selected parent")

    if target.exists():
        if not target.is_dir():
            raise HTTPException(409, "A file already exists with that target name")
        return {
            "path": str(target),
            "parent_path": str(parent),
            "folder_name": name,
            "created": False,
            "already_existed": True,
        }

    try:
        target.mkdir()
    except PermissionError as exc:
        raise HTTPException(403, "Target parent is not writable") from exc
    except FileExistsError:
        if target.is_dir():
            return {
                "path": str(target),
                "parent_path": str(parent),
                "folder_name": name,
                "created": False,
                "already_existed": True,
            }
        raise HTTPException(409, "Target name became occupied by a file")
    except OSError as exc:
        raise HTTPException(500, f"Unable to create target folder: {exc}") from exc

    if not target.is_dir():
        raise HTTPException(500, "Target folder creation did not produce a directory")
    return {
        "path": str(target),
        "parent_path": str(parent),
        "folder_name": name,
        "created": True,
        "already_existed": False,
    }


@app.get("/fs")
@app.get("/api/fs")
def api_fs(path: str = "/"):
    return list_directory(path)


@app.post("/fs/mkdir")
@app.post("/api/fs/mkdir")
def api_fs_mkdir(payload: MkdirRequest):
    return make_target_directory(payload)


# ============================================================================
# Project persistence
# ============================================================================

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
    path: Optional[str] = None
    current_path: Optional[str] = None
    source_type: Optional[str] = None
    operator_label: Optional[str] = None
    label: Optional[str] = None
    locator: Optional[str] = None
    client_source_id: Optional[str] = None
    source_fingerprint: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class AddTarget(BaseModel):
    path: str
    label: Optional[str] = None


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


def ensure_column(c: sqlite3.Connection, table: str, column: str, ddl: str) -> None:
    cols = {row["name"] for row in c.execute(f"PRAGMA table_info({table})").fetchall()}
    if column not in cols:
        c.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")


def init_db() -> None:
    with db() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS projects (
              project_token TEXT PRIMARY KEY,
              project_name TEXT NOT NULL,
              initial_project_name TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              status TEXT NOT NULL,
              current_stage TEXT NOT NULL,
              current_run_id TEXT,
              target_path TEXT,
              openclaw_session_key TEXT,
              notes TEXT,
              semantic_signature TEXT NOT NULL,
              promoted_at TEXT,
              deleted_at TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_projects_signature
              ON projects(semantic_signature, deleted_at);

            CREATE TABLE IF NOT EXISTS project_sources (
              source_id TEXT PRIMARY KEY,
              project_token TEXT NOT NULL,
              source_fingerprint TEXT NOT NULL,
              current_path TEXT NOT NULL,
              operator_label TEXT,
              status TEXT NOT NULL,
              added_at TEXT NOT NULL,
              last_seen_at TEXT NOT NULL,
              fingerprint_evidence_json TEXT,
              source_type TEXT NOT NULL DEFAULT 'wsl_path',
              original_locator TEXT,
              client_source_id TEXT,
              metadata_json TEXT,
              FOREIGN KEY(project_token) REFERENCES projects(project_token)
            );
            CREATE INDEX IF NOT EXISTS idx_sources_project
              ON project_sources(project_token);
            CREATE INDEX IF NOT EXISTS idx_sources_fingerprint
              ON project_sources(source_fingerprint);

            CREATE TABLE IF NOT EXISTS project_targets (
              target_id TEXT PRIMARY KEY,
              project_token TEXT NOT NULL,
              target_path TEXT NOT NULL,
              label TEXT,
              status TEXT NOT NULL,
              added_at TEXT NOT NULL,
              promoted_at TEXT,
              FOREIGN KEY(project_token) REFERENCES projects(project_token)
            );

            CREATE TABLE IF NOT EXISTS project_runs (
              run_id TEXT PRIMARY KEY,
              project_token TEXT NOT NULL,
              started_at TEXT,
              ended_at TEXT,
              status TEXT NOT NULL,
              restart_of_run_id TEXT,
              checkpoint_state TEXT,
              FOREIGN KEY(project_token) REFERENCES projects(project_token)
            );

            CREATE TABLE IF NOT EXISTS project_events (
              event_id TEXT PRIMARY KEY,
              project_token TEXT NOT NULL,
              run_id TEXT,
              timestamp TEXT NOT NULL,
              event_type TEXT NOT NULL,
              actor TEXT,
              message TEXT,
              details_json TEXT,
              FOREIGN KEY(project_token) REFERENCES projects(project_token)
            );
            CREATE INDEX IF NOT EXISTS idx_events_project
              ON project_events(project_token, timestamp);

            CREATE TABLE IF NOT EXISTS idempotency_keys (
              idempotency_key TEXT PRIMARY KEY,
              project_token TEXT NOT NULL,
              request_hash TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            """
        )
        # Migrate existing v0.3.0 databases in place without creating a second DB.
        ensure_column(c, "project_sources", "source_type", "TEXT NOT NULL DEFAULT 'wsl_path'")
        ensure_column(c, "project_sources", "original_locator", "TEXT")
        ensure_column(c, "project_sources", "client_source_id", "TEXT")
        ensure_column(c, "project_sources", "metadata_json", "TEXT")


def project_event(
    c: sqlite3.Connection,
    token: str,
    event_type: str,
    message: str,
    *,
    run_id: Optional[str] = None,
    actor: str = "portal",
    details: Optional[dict] = None,
) -> None:
    c.execute(
        "INSERT INTO project_events(event_id,project_token,run_id,timestamp,event_type,actor,message,details_json) VALUES(?,?,?,?,?,?,?,?)",
        (
            "EVT-" + secrets.token_hex(10).upper(),
            token,
            run_id,
            utcnow(),
            event_type,
            actor,
            message,
            json.dumps(details or {}, sort_keys=True),
        ),
    )


def get_project_or_404(c: sqlite3.Connection, token: str) -> sqlite3.Row:
    row = c.execute(
        "SELECT * FROM projects WHERE project_token=? AND deleted_at IS NULL",
        (token,),
    ).fetchone()
    if not row:
        raise HTTPException(404, "Project not found")
    return row


def engine_state() -> tuple[bool, str]:
    if not ENGINE_ENABLED:
        return False, "Execution engine intentionally disabled until sotctl is installed and enabled"
    if not SOTCTL:
        return False, "SOT_ENGINE_ENABLED=1 but sotctl is not available"
    return False, "sotctl was found, but project worker orchestration is not implemented in API v0.3.1"


def decode_source_row(row: sqlite3.Row) -> dict[str, Any]:
    out = dict(row)
    raw = out.get("metadata_json")
    if raw:
        try:
            out["metadata"] = json.loads(raw)
        except json.JSONDecodeError:
            out["metadata"] = {"decode_error": True}
    else:
        out["metadata"] = {}
    return out


def full_project(c: sqlite3.Connection, token: str) -> dict[str, Any]:
    p = dict(get_project_or_404(c, token))
    p["sources"] = [
        decode_source_row(r)
        for r in c.execute(
            "SELECT source_id,source_type,source_fingerprint,current_path,original_locator,client_source_id,operator_label,status,added_at,last_seen_at,metadata_json FROM project_sources WHERE project_token=? ORDER BY added_at",
            (token,),
        ).fetchall()
    ]
    p["targets"] = [
        dict(r)
        for r in c.execute(
            "SELECT * FROM project_targets WHERE project_token=? ORDER BY added_at",
            (token,),
        ).fetchall()
    ]
    ready, reason = engine_state()
    p["engine_ready"] = ready
    p["engine_reason"] = reason
    p["last_checkpoint"] = None
    return p


def source_fingerprint(path_value: str) -> dict[str, Any]:
    original = str(path_value)
    path = Path(canonical_path(path_value))
    if not path.exists():
        raise HTTPException(404, f"Source path not found: {original}")
    if not path.is_dir():
        raise HTTPException(400, f"Source path is not a directory: {original}")
    evidence: dict[str, Any] = {"exists": True, "kind": "folder", "source_type": "wsl_path"}
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
                    st = child.stat()
                    sample.append(
                        [child.name, bool(child.is_dir()), int(st.st_size if child.is_file() else 0)]
                    )
                except OSError:
                    sample.append([child.name, None, None])
        except OSError:
            pass
        evidence["sample"] = sample
    return {
        "source_type": "wsl_path",
        "fingerprint": sha256_text(json.dumps(evidence, sort_keys=True, separators=(",", ":"))),
        "current_path": str(path),
        "original_locator": original,
        "client_source_id": None,
        "label": None,
        "metadata": {},
        "evidence": evidence,
    }


def normalize_source(item: Any, index: int) -> dict[str, Any]:
    default_label = f"Source {index + 1}"
    if isinstance(item, str):
        result = source_fingerprint(item)
        result["label"] = default_label
        return result
    if not isinstance(item, dict):
        raise HTTPException(422, f"Invalid source at index {index}")

    source_type = str(item.get("source_type") or "wsl_path").strip().lower()
    if source_type == "browser-device":
        source_type = "browser_local"

    label = str(item.get("operator_label") or item.get("label") or default_label)
    if source_type == "browser_local":
        locator = str(item.get("locator") or item.get("current_path") or "").strip()
        client_source_id = str(item.get("client_source_id") or "").strip()
        metadata = item.get("metadata") if isinstance(item.get("metadata"), dict) else {}
        supplied_fp = str(item.get("source_fingerprint") or "").strip().lower()
        if supplied_fp and not re.fullmatch(r"[0-9a-f]{64}", supplied_fp):
            raise HTTPException(422, f"Invalid browser-local fingerprint at index {index}")
        if not locator:
            if not client_source_id:
                raise HTTPException(422, f"Browser-local source {index} needs a locator or client source id")
            locator = f"device://{client_source_id}"
        if not supplied_fp:
            basis = {"source_type": source_type, "locator_name": metadata.get("directory_name"), "metadata": metadata}
            supplied_fp = sha256_text(json.dumps(basis, sort_keys=True, separators=(",", ":")))
        evidence = {
            "kind": "browser_local_directory",
            "source_type": source_type,
            "client_source_id": client_source_id or None,
            "metadata": metadata,
        }
        return {
            "source_type": source_type,
            "fingerprint": supplied_fp,
            "current_path": locator,
            "original_locator": locator,
            "client_source_id": client_source_id or None,
            "label": label,
            "metadata": metadata,
            "evidence": evidence,
        }

    path = item.get("path") or item.get("current_path") or item.get("source_root_path")
    if not path:
        raise HTTPException(422, f"WSL source at index {index} has no path")
    result = source_fingerprint(str(path))
    result["label"] = label
    return result


def insert_source(c: sqlite3.Connection, token: str, src: dict[str, Any], created_at: str) -> str:
    source_id = "SRC-" + sha256_text(
        token + src["source_type"] + src["fingerprint"] + src["current_path"]
    )[:16].upper()
    c.execute(
        """
        INSERT INTO project_sources(
          source_id,project_token,source_fingerprint,current_path,operator_label,status,
          added_at,last_seen_at,fingerprint_evidence_json,source_type,original_locator,
          client_source_id,metadata_json
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            source_id,
            token,
            src["fingerprint"],
            src["current_path"],
            src["label"],
            "REGISTERED",
            created_at,
            created_at,
            json.dumps(src["evidence"], sort_keys=True),
            src["source_type"],
            src.get("original_locator"),
            src.get("client_source_id"),
            json.dumps(src.get("metadata") or {}, sort_keys=True),
        ),
    )
    return source_id


# ============================================================================
# Health/version evidence
# ============================================================================

@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/")
def root_info() -> dict[str, Any]:
    ready, reason = engine_state()
    return {
        "service": "sot-helper",
        "status": "ok",
        "version": API_VERSION,
        "build": BUILD_ID,
        "port": SERVICE_PORT,
        "engine_ready": ready,
        "engine_reason": reason,
    }


@app.get("/healthz")
@app.get("/health")
@app.get("/api/health")
def health() -> dict[str, Any]:
    ready, reason = engine_state()
    return {
        "status": "ok",
        "version": API_VERSION,
        "build": BUILD_ID,
        "dynamicMountDiscovery": True,
        "mountCount": len(discover_mounts()),
        "db": str(DB_PATH),
        "engine_ready": ready,
        "engine_reason": reason,
    }


@app.get("/projects/health")
@app.get("/api/projects/health")
def projects_health() -> dict[str, Any]:
    return health()


# ============================================================================
# Projects: canonical identity and idempotent creation
# ============================================================================

@app.get("/projects")
@app.get("/api/projects")
def list_projects() -> dict[str, Any]:
    with db() as c:
        rows = c.execute(
            "SELECT project_token FROM projects WHERE deleted_at IS NULL ORDER BY updated_at DESC"
        ).fetchall()
        return {
            "projects": [full_project(c, r["project_token"]) for r in rows],
            "version": API_VERSION,
            "build": BUILD_ID,
        }


@app.post("/projects")
@app.post("/api/projects")
def create_project(
    payload: CreateProject,
    idempotency_header: Optional[str] = Header(default=None, alias="Idempotency-Key"),
) -> dict[str, Any]:
    created_at = utcnow()
    source_rows = [normalize_source(item, i) for i, item in enumerate(payload.sources)]

    target = canonical_target_path(payload.target) if payload.target else None
    semantic_obj = {
        "name": payload.project_name.strip().casefold(),
        "sources": sorted((x["source_type"], x["fingerprint"]) for x in source_rows),
        "target": target or "",
    }
    semantic_signature = sha256_text(
        json.dumps(semantic_obj, sort_keys=True, separators=(",", ":"))
    )
    request_obj = {
        "project_name": payload.project_name.strip(),
        "sources": [
            {
                "source_type": x["source_type"],
                "fingerprint": x["fingerprint"],
                "current_path": x["current_path"],
            }
            for x in source_rows
        ],
        "target": target,
        "notes": payload.notes or "",
    }
    request_hash = sha256_text(
        json.dumps(request_obj, sort_keys=True, separators=(",", ":"))
    )
    idem = (payload.idempotency_key or idempotency_header or "").strip()

    with db() as c:
        if idem:
            prior = c.execute(
                "SELECT * FROM idempotency_keys WHERE idempotency_key=?", (idem,)
            ).fetchone()
            if prior:
                if prior["request_hash"] != request_hash:
                    raise HTTPException(
                        409,
                        "Idempotency key was already used for a different project request",
                    )
                return {
                    "project": full_project(c, prior["project_token"]),
                    "deduplicated": True,
                    "reason": "idempotency_key",
                }

        existing = c.execute(
            "SELECT project_token FROM projects WHERE semantic_signature=? AND deleted_at IS NULL ORDER BY created_at LIMIT 1",
            (semantic_signature,),
        ).fetchone()
        if existing:
            if idem:
                c.execute(
                    "INSERT OR IGNORE INTO idempotency_keys VALUES(?,?,?,?)",
                    (idem, existing["project_token"], request_hash, created_at),
                )
            return {
                "project": full_project(c, existing["project_token"]),
                "deduplicated": True,
                "reason": "matching_project_identity",
            }

        token_hash = sha256_text(
            json.dumps(
                {
                    "created_at": created_at,
                    "name": payload.project_name.strip(),
                    "sources": sorted((x["source_type"], x["fingerprint"]) for x in source_rows),
                    "entropy": secrets.token_hex(16),
                },
                sort_keys=True,
            )
        )
        token = "PRJ-" + token_hash[:24].upper()
        c.execute(
            "INSERT INTO projects(project_token,project_name,initial_project_name,created_at,updated_at,status,current_stage,target_path,notes,semantic_signature) VALUES(?,?,?,?,?,?,?,?,?,?)",
            (
                token,
                payload.project_name.strip(),
                payload.project_name.strip(),
                created_at,
                created_at,
                "REGISTERED",
                "REGISTERED",
                target,
                payload.notes,
                semantic_signature,
            ),
        )

        for src in source_rows:
            insert_source(c, token, src, created_at)

        if target:
            target_id = "TGT-" + sha256_text(token + target)[:16].upper()
            c.execute(
                "INSERT INTO project_targets(target_id,project_token,target_path,label,status,added_at) VALUES(?,?,?,?,?,?)",
                (target_id, token, target, "Initial target", "ASSIGNED", created_at),
            )

        if idem:
            c.execute(
                "INSERT INTO idempotency_keys VALUES(?,?,?,?)",
                (idem, token, request_hash, created_at),
            )

        project_event(
            c,
            token,
            "PROJECT_CREATED",
            f'Project "{payload.project_name.strip()}" created',
            details={
                "source_count": len(source_rows),
                "source_types": sorted({x["source_type"] for x in source_rows}),
                "target": target,
            },
        )
        return {"project": full_project(c, token), "deduplicated": False}


@app.get("/projects/{token}")
@app.get("/api/projects/{token}")
def get_project(token: str) -> dict[str, Any]:
    with db() as c:
        return full_project(c, token)


@app.patch("/projects/{token}")
@app.patch("/api/projects/{token}")
def patch_project(token: str, payload: PatchProject) -> dict[str, Any]:
    with db() as c:
        before = dict(get_project_or_404(c, token))
        name = payload.project_name or payload.name
        updates: list[str] = []
        values: list[Any] = []

        if name is not None:
            updates.append("project_name=?")
            values.append(name.strip())
        if payload.target is not None:
            target = canonical_target_path(payload.target) if payload.target else None
            updates.append("target_path=?")
            values.append(target)
        if payload.notes is not None:
            updates.append("notes=?")
            values.append(payload.notes)
        if payload.openclaw_session_key is not None:
            updates.append("openclaw_session_key=?")
            values.append(payload.openclaw_session_key or None)

        if not updates:
            return full_project(c, token)

        updates.append("updated_at=?")
        values.append(utcnow())
        values.append(token)
        c.execute(f"UPDATE projects SET {', '.join(updates)} WHERE project_token=?", values)

        if name is not None and name.strip() != before["project_name"]:
            project_event(
                c,
                token,
                "PROJECT_RENAMED",
                f'Project renamed from "{before["project_name"]}" to "{name.strip()}"',
            )

        if payload.target is not None:
            target = canonical_target_path(payload.target) if payload.target else None
            if target:
                target_id = "TGT-" + sha256_text(token + target)[:16].upper()
                c.execute(
                    "INSERT OR IGNORE INTO project_targets(target_id,project_token,target_path,label,status,added_at) VALUES(?,?,?,?,?,?)",
                    (target_id, token, target, "Project target", "ASSIGNED", utcnow()),
                )
            project_event(
                c,
                token,
                "TARGET_CHANGED",
                f"Project target changed to {target or 'none'}",
                details={"target": target},
            )
        return full_project(c, token)


@app.delete("/projects/{token}")
@app.delete("/api/projects/{token}")
def delete_project(token: str) -> dict[str, Any]:
    with db() as c:
        p = get_project_or_404(c, token)
        if p["status"] not in {
            "REGISTERED", "PAUSED", "VERIFIED", "ERROR", "RECONCILED_INTO_SOT"
        }:
            raise HTTPException(409, "Project metadata cannot be deleted while work is active")
        project_event(
            c,
            token,
            "PROJECT_DELETED",
            f'Project "{p["project_name"]}" metadata deleted',
        )
        now = utcnow()
        c.execute(
            "UPDATE projects SET deleted_at=?,updated_at=? WHERE project_token=?",
            (now, now, token),
        )
        return {"ok": True, "project_token": token}


@app.get("/projects/{token}/status")
@app.get("/api/projects/{token}/status")
def project_status(token: str) -> dict[str, Any]:
    with db() as c:
        return full_project(c, token)


# ============================================================================
# Project operations: real engine required; never fake state transitions
# ============================================================================

def engine_not_ready(token: str, action: str) -> None:
    with db() as c:
        get_project_or_404(c, token)
        ready, reason = engine_state()
        project_event(
            c,
            token,
            "OPERATION_REJECTED",
            f"{action} was not executed: {reason}",
            details={"action": action, "engine_ready": ready},
        )
    raise HTTPException(
        status_code=501,
        detail={"code": "ENGINE_NOT_READY", "message": reason, "action": action},
    )


@app.post("/projects/{token}/start")
@app.post("/api/projects/{token}/start")
def start_project(token: str):
    engine_not_ready(token, "start")


@app.post("/projects/{token}/pause")
@app.post("/api/projects/{token}/pause")
def pause_project(token: str):
    engine_not_ready(token, "pause")


@app.post("/projects/{token}/resume")
@app.post("/api/projects/{token}/resume")
def resume_project(token: str):
    engine_not_ready(token, "resume")


@app.post("/projects/{token}/restart")
@app.post("/api/projects/{token}/restart")
def restart_project(token: str):
    engine_not_ready(token, "restart")


@app.post("/projects/{token}/promote")
@app.post("/api/projects/{token}/promote")
def promote_project(token: str):
    engine_not_ready(token, "promote")


# ============================================================================
# Source / target associations
# ============================================================================

@app.post("/projects/{token}/sources")
@app.post("/api/projects/{token}/sources")
def add_source(token: str, payload: AddSource) -> dict[str, Any]:
    src = normalize_source(payload.model_dump(exclude_none=True), 0)
    with db() as c:
        get_project_or_404(c, token)
        existing = c.execute(
            "SELECT * FROM project_sources WHERE project_token=? AND source_type=? AND source_fingerprint=? AND current_path=?",
            (token, src["source_type"], src["fingerprint"], src["current_path"]),
        ).fetchone()
        if existing:
            return {"source": decode_source_row(existing), "deduplicated": True}

        now = utcnow()
        source_id = insert_source(c, token, src, now)
        project_event(
            c,
            token,
            "SOURCE_ADDED",
            f"Source added: {src['current_path']}",
            details={
                "source_id": source_id,
                "source_type": src["source_type"],
                "fingerprint": src["fingerprint"],
            },
        )
        row = c.execute(
            "SELECT * FROM project_sources WHERE source_id=?", (source_id,)
        ).fetchone()
        return {"source": decode_source_row(row), "deduplicated": False}


@app.delete("/projects/{token}/sources/{source_id}")
@app.delete("/api/projects/{token}/sources/{source_id}")
def remove_source(token: str, source_id: str) -> dict[str, Any]:
    with db() as c:
        get_project_or_404(c, token)
        src = c.execute(
            "SELECT * FROM project_sources WHERE project_token=? AND source_id=?",
            (token, source_id),
        ).fetchone()
        if not src:
            raise HTTPException(404, "Source not found")
        c.execute("DELETE FROM project_sources WHERE source_id=?", (source_id,))
        project_event(
            c,
            token,
            "SOURCE_REMOVED",
            f"Source removed from project: {src['current_path']}",
            details={"source_id": source_id, "source_type": src["source_type"]},
        )
        return {"ok": True}


@app.post("/projects/{token}/targets")
@app.post("/api/projects/{token}/targets")
def add_target(token: str, payload: AddTarget) -> dict[str, Any]:
    target = canonical_target_path(payload.path)
    with db() as c:
        get_project_or_404(c, token)
        target_id = "TGT-" + sha256_text(token + target)[:16].upper()
        now = utcnow()
        c.execute(
            "INSERT OR IGNORE INTO project_targets(target_id,project_token,target_path,label,status,added_at) VALUES(?,?,?,?,?,?)",
            (target_id, token, target, payload.label or "Target", "ASSIGNED", now),
        )
        c.execute(
            "UPDATE projects SET target_path=?,updated_at=? WHERE project_token=?",
            (target, now, token),
        )
        project_event(
            c,
            token,
            "TARGET_ADDED",
            f"Target assigned: {target}",
            details={"target_id": target_id},
        )
        return {
            "target": dict(
                c.execute(
                    "SELECT * FROM project_targets WHERE target_id=?", (target_id,)
                ).fetchone()
            )
        }


# ============================================================================
# Reporting
# ============================================================================

@app.get("/reports/aggregate")
@app.get("/api/reports/aggregate")
def aggregate_report() -> dict[str, Any]:
    with db() as c:
        total = c.execute(
            "SELECT COUNT(*) n FROM projects WHERE deleted_at IS NULL"
        ).fetchone()["n"]
        active = c.execute(
            "SELECT COUNT(*) n FROM projects WHERE deleted_at IS NULL AND status NOT IN ('REGISTERED','PAUSED','VERIFIED','ERROR','RECONCILED_INTO_SOT')"
        ).fetchone()["n"]
        paused = c.execute(
            "SELECT COUNT(*) n FROM projects WHERE deleted_at IS NULL AND status='PAUSED'"
        ).fetchone()["n"]
        complete = c.execute(
            "SELECT COUNT(*) n FROM projects WHERE deleted_at IS NULL AND status IN ('VERIFIED','RECONCILED_INTO_SOT')"
        ).fetchone()["n"]
        sources = c.execute(
            "SELECT COUNT(*) n FROM project_sources s JOIN projects p ON p.project_token=s.project_token WHERE p.deleted_at IS NULL"
        ).fetchone()["n"]
        runs = c.execute(
            "SELECT COUNT(*) n FROM project_runs r JOIN projects p ON p.project_token=r.project_token WHERE p.deleted_at IS NULL"
        ).fetchone()["n"]
        events_n = c.execute(
            "SELECT COUNT(*) n FROM project_events e JOIN projects p ON p.project_token=e.project_token WHERE p.deleted_at IS NULL"
        ).fetchone()["n"]
        return {
            "version": API_VERSION,
            "build": BUILD_ID,
            "projects_total": total,
            "projects_active": active,
            "projects_paused": paused,
            "projects_complete": complete,
            "sources_total": sources,
            "runs_total": runs,
            "events_total": events_n,
            # Engine-derived metrics are unavailable until the engine exists.
            "raw_bytes_scanned": None,
            "unique_bytes": None,
            "exact_duplicate_bytes": None,
            "verification_failures": None,
            "collisions": None,
            "current_sot_bytes": None,
        }


@app.get("/reports/timeline")
@app.get("/api/reports/timeline")
def timeline_report(limit: int = Query(default=250, ge=1, le=2000)) -> dict[str, Any]:
    with db() as c:
        rows = c.execute(
            "SELECT e.*,p.project_name FROM project_events e JOIN projects p ON p.project_token=e.project_token WHERE p.deleted_at IS NULL ORDER BY e.timestamp DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return {
            "events": [dict(r) for r in rows],
            "version": API_VERSION,
            "build": BUILD_ID,
        }


@app.get("/projects/{token}/report")
@app.get("/api/projects/{token}/report")
def project_report(token: str) -> dict[str, Any]:
    with db() as c:
        p = full_project(c, token)
        sources = [
            decode_source_row(r)
            for r in c.execute(
                "SELECT * FROM project_sources WHERE project_token=? ORDER BY added_at",
                (token,),
            ).fetchall()
        ]
        targets = [
            dict(r)
            for r in c.execute(
                "SELECT * FROM project_targets WHERE project_token=? ORDER BY added_at",
                (token,),
            ).fetchall()
        ]
        runs = [
            dict(r)
            for r in c.execute(
                "SELECT * FROM project_runs WHERE project_token=? ORDER BY COALESCE(started_at,'') DESC",
                (token,),
            ).fetchall()
        ]
        events = [
            dict(r)
            for r in c.execute(
                "SELECT * FROM project_events WHERE project_token=? ORDER BY timestamp DESC LIMIT 1000",
                (token,),
            ).fetchall()
        ]
        return {
            "project": p,
            "sources": sources,
            "targets": targets,
            "runs": runs,
            "events": events,
            "version": API_VERSION,
            "build": BUILD_ID,
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("file_browser:app", host="127.0.0.1", port=SERVICE_PORT, reload=False)
