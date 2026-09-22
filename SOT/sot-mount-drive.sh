#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -ne 1 || ! "$1" =~ ^[A-Za-z]$ ]]; then
  echo "usage: sot-mount-drive <drive-letter>" >&2
  exit 64
fi

LETTER="${1^^}"
LOWER="${1,,}"
ROOT="/mnt/$LOWER"
EXPECTED="${LETTER}:"

normalize_source() {
  local v="$1"
  v="${v//\\//}"
  v="${v%/}"
  printf '%s' "${v^^}"
}

mount_state() {
  findmnt -rn -M "$ROOT" -o TARGET,FSTYPE,SOURCE 2>/dev/null || true
}

verified() {
  local line target fstype source
  line="$(mount_state)"
  [[ -n "$line" ]] || return 1
  read -r target fstype source <<<"$line"
  [[ "$target" == "$ROOT" ]] || return 1
  [[ "$fstype" == "drvfs" || "$fstype" == "9p" ]] || return 1
  [[ "$(normalize_source "$source")" == "$EXPECTED" ]] || return 1
  [[ -d "$ROOT" && -r "$ROOT" && -x "$ROOT" ]] || return 1
  ls -A "$ROOT" >/dev/null 2>&1 || return 1
  return 0
}

if verified; then
  exit 0
fi

existing="$(mount_state)"
if [[ -n "$existing" ]]; then
  read -r target fstype source <<<"$existing"
  normalized="$(normalize_source "$source")"
  if [[ "$target" != "$ROOT" || ( "$fstype" != "drvfs" && "$fstype" != "9p" ) || "$normalized" != "$EXPECTED" ]]; then
    echo "refusing conflicting mount at $ROOT (target=$target fstype=$fstype source=$source)" >&2
    exit 73
  fi
  umount "$ROOT"
fi

mkdir -p "$ROOT"
mount -t drvfs "$EXPECTED" "$ROOT"

if ! verified; then
  line="$(mount_state)"
  echo "failed to establish verified Windows mount for $EXPECTED at $ROOT ($line)" >&2
  exit 74
fi
