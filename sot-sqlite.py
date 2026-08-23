#!/usr/bin/env python3
"""Small SQLite process adapter used when the sqlite3 CLI is unavailable."""

import argparse
import json
import pathlib
import sqlite3
import sys


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("database")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--backup")
    parser.add_argument("--dump")
    args = parser.parse_args()

    database = pathlib.Path(args.database)
    database.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(database), timeout=10)
    connection.execute("PRAGMA foreign_keys=ON")
    connection.execute("PRAGMA busy_timeout=10000")
    try:
        if args.backup:
            destination = pathlib.Path(args.backup)
            destination.parent.mkdir(parents=True, exist_ok=True)
            with sqlite3.connect(str(destination), timeout=10) as target:
                connection.backup(target)
            return
        if args.dump:
            destination = pathlib.Path(args.dump)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text("\n".join(connection.iterdump()) + "\n", encoding="utf-8")
            return

        script = sys.stdin.read()
        if args.json:
            cursor = connection.execute(script)
            columns = [item[0] for item in cursor.description or []]
            rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
            print(json.dumps(rows, separators=(",", ":")))
        else:
            connection.executescript(script)
            connection.commit()
    finally:
        connection.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"SQLite adapter failed: {error}", file=sys.stderr)
        raise SystemExit(1)
