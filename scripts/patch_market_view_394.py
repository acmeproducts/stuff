from pathlib import Path
p=Path('market-view.html')
s=p.read_text()
if "const VERSION='3.9.3'" not in s:
    raise SystemExit('Expected Market Navigator 3.9.3 baseline')

s=s.replace('<title>Market Navigator 3.9.3</title>','<title>Market Navigator 3.9.4</title>')
s=s.replace('Version 3.9.3</small>','Version 3.9.4</small>')
s=s.replace("const VERSION='3.9.3'","const VERSION='3.9.4'")
s=s.replace('Market Navigator 3.9.3\nUsage:','Market Navigator 3.9.4\nUsage:')
s=s.replace('Version: 3.9.3','Version: 3.9.4')

# Disable both obsolete 3.8.x startup repair triggers. These bypass the current
# cache-first/WebWorker collector and were forcing five-year Yahoo backfills on every load.
s=s.replace('setTimeout(()=>repairRegimeHistory(false),1200);','/* 3.9.4: legacy automatic regime repair disabled; cache-first collector owns startup. */')
s=s.replace('localStorage.removeItem(REGIME_FOUNDATION_KEY);\nsetTimeout(()=>repairRegimeHistory(true),500);','/* 3.9.4: do not clear the persisted foundation flag and do not force a full backfill at startup. */')

# Prevent the legacy repair function from ever being invoked accidentally by later code.
needle='async function repairRegimeHistory(forceFull=false){'
if needle in s:
    s=s.replace(needle,"async function repairRegimeHistory(forceFull=false){if(!forceFull){log('Legacy regime repair suppressed; using cache-first collector');return;}/* manual compatibility path only */",1)

# The active foundation path already calls yahoo(), which parses Yahoo JSON in the blob WebWorker.
# Mark the intended ownership explicitly for future maintenance.
marker='async function ensureFoundation392(){'
if marker in s and 'CACHE_FIRST_OWNER_394' not in s:
    s=s.replace(marker,"const CACHE_FIRST_OWNER_394='IndexedDB + blob WebWorker yahoo() collector';\n"+marker,1)

p.write_text(s)
print('Patched Market Navigator to 3.9.4')
