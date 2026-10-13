"""Rebuild the retained qualification fixture without fetching new native values."""
import datetime as dt
import importlib.util
import json
from pathlib import Path
BASE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qualification_history',BASE/'market-navigator-rebuild-history.py')
h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
if __name__=='__main__':
    result=h.build(BASE/'market-navigator-rebuild-data',BASE/'market-navigator-rebuild-archive',BASE/'market-navigator-rebuild-seed.json',BASE/'market-navigator-rebuild-archive-inventory.json',dt.datetime(2026,10,7,22,tzinfo=dt.timezone.utc))
    print(json.dumps(result))
