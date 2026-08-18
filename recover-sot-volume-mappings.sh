#!/usr/bin/env bash
set -euo pipefail

letters=(p q r s)

echo '=== DISCOVER + RECOVER P/Q/R/S MAPPINGS ==='

grep_hist(){
  local d="$1"
  { cat "$HOME/.bash_history" 2>/dev/null || true; sudo cat /root/.bash_history 2>/dev/null || true; } \
    | grep -Ei "(/mnt/$d|${d^^}:|mount .*${d^^}:|drvfs)" \
    | tail -20 || true
}

for d in "${letters[@]}"; do
  D="${d^^}:"; mp="/mnt/$d"
  echo
  echo "=== $D -> $mp ==="

  echo '-- current target --'
  findmnt -T "$mp" -o TARGET,SOURCE,FSTYPE,OPTIONS -n 2>/dev/null || true
  echo "entries=$(find "$mp" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l)"

  echo '-- fstab candidates --'
  grep -E "[[:space:]]$mp[[:space:]]" /etc/fstab 2>/dev/null || true

  echo '-- systemd mount candidates --'
  systemctl cat "mnt-${d}.mount" 2>/dev/null || true

  echo '-- shell-history candidates --'
  grep_hist "$d"

  echo '-- Windows filesystem providers --'
  /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -NoProfile -Command \
    "Get-PSDrive -PSProvider FileSystem | Where-Object { \$_.Name -eq '${d^^}' } | Format-List Name,Root,DisplayRoot,Provider" 2>/dev/null | tr -d '\r' || true
  /mnt/c/Windows/System32/cmd.exe /c "net use ${d^^}:" 2>/dev/null | tr -d '\r' || true

  recovered=0

  if grep -qE "^[^#].*[[:space:]]$mp[[:space:]]" /etc/fstab 2>/dev/null; then
    echo "Attempting declared /etc/fstab mount for $mp"
    sudo umount -l "$mp" 2>/dev/null || true
    sudo mkdir -p "$mp"
    if sudo mount "$mp"; then recovered=1; fi
  fi

  if [[ $recovered -eq 0 ]]; then
    psroot=$(/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -NoProfile -Command \
      "\$x=Get-PSDrive -PSProvider FileSystem -Name '${d^^}' -ErrorAction SilentlyContinue; if(\$x){ if(\$x.DisplayRoot){\$x.DisplayRoot}else{\$x.Root} }" 2>/dev/null | tr -d '\r' | tail -1 || true)
    if [[ -n "$psroot" ]]; then
      echo "Windows reports $D as $psroot"
      sudo umount -l "$mp" 2>/dev/null || true
      sudo mkdir -p "$mp"
      if sudo mount -t drvfs "$D" "$mp" 2>/dev/null; then recovered=1
      elif [[ "$psroot" == \\\\* ]]; then
        if sudo mount -t drvfs "$psroot" "$mp"; then recovered=1; fi
      fi
    fi
  fi

  if [[ $recovered -eq 1 ]]; then
    n=$(find "$mp" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l)
    echo "RECOVERED $D entries=$n"
    findmnt -T "$mp" -o TARGET,SOURCE,FSTYPE,OPTIONS -n || true
    ls -la "$mp" | head -12
  else
    echo "UNRESOLVED $D — no authoritative mapping found; no guessed mount performed."
  fi
done

echo
echo '=== BLOCK DEVICES / FILESYSTEMS ==='
lsblk -o NAME,PATH,FSTYPE,LABEL,UUID,SIZE,MOUNTPOINTS

echo
echo '=== SOT API CHECK ==='
sudo systemctl restart openclaw-report-server.service
sleep 2
for d in "${letters[@]}"; do
  p="/mnt/$d"
  enc=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$p")
  printf '%s: ' "${d^^}"
  curl -fsS "http://127.0.0.1:18080/api/sot/fs?path=$enc&force=1" || true
  echo
done
