"""Retrieve a configured battlefield variant without guessing ambiguous selectors."""
import argparse
from contextlib import closing
import json
from pathlib import Path
import sqlite3
import gzip
import hashlib
import tempfile


def query_asset(database, source_path):
    """Resolve an exact native source artifact without scanning inventories."""
    with closing(sqlite3.connect(database.resolve().as_uri() + '?mode=ro', uri=True)) as db:
        row = db.execute('SELECT record_json FROM assets WHERE path=?',
                         (source_path.replace('\\', '/'),)).fetchone()
        return {'status': 'resolved_source_asset', 'asset': json.loads(row[0])} if row else {'status': 'not_found', 'source_path': source_path}


def query(database, selector, mode=None):
    with closing(sqlite3.connect(database.resolve().as_uri() + '?mode=ro', uri=True)) as db:
        db.row_factory = sqlite3.Row
        normalized = selector.replace('\\', '/').rstrip('/')
        sql = '''select * from variants where
          (variant_key=? or atlas_map_key=? or battle_key=? or label=? or specification=?)'''
        if mode:
            if mode not in ('singleplayer', 'multiplayer'):
                raise ValueError('Unsupported mode')
            sql += ' and released=1 and ' + mode + '=1'
        records = db.execute(sql + ' order by variant_key', (selector, selector, selector, selector, normalized)).fetchall()
        provenance = json.loads(db.execute("select value_json from metadata where key='manifest'").fetchone()[0])
        if not records:
            return {'status': 'not_found', 'selector': selector, 'provenance': provenance}
        if len(records) != 1:
            return {'status': 'ambiguous', 'selector': selector, 'provenance': provenance,
                    'candidates': [{k: r[k] for k in ('variant_key', 'atlas_map_key', 'battle_key', 'label')} for r in records]}
        return {'status': 'resolved_configured_variant', 'provenance': provenance,
                'packet': json.loads(records[0]['packet_json'])}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database', required=True, type=Path)
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument('--select')
    selection.add_argument('--asset', help='Exact source asset path from a collection packet')
    parser.add_argument('--mode', choices=['singleplayer', 'multiplayer'])
    args = parser.parse_args()
    with tempfile.TemporaryDirectory() as tmp:
        database = args.database
        if database.suffix == '.gz':
            manifest_path = database.parent / 'manifest.json'
            if manifest_path.exists():
                expected = json.loads(manifest_path.read_bytes()).get('compressed_database_sha256')
                if expected and hashlib.sha256(database.read_bytes()).hexdigest() != expected:
                    raise ValueError('Compressed collection database hash mismatch')
            database = Path(tmp) / 'collection.sqlite'
            with gzip.open(args.database, 'rb') as source, database.open('wb') as output:
                import shutil
                shutil.copyfileobj(source, output)
        result = query_asset(database, args.asset) if args.asset else query(database, args.select, args.mode)
        print(json.dumps(result, indent=2, ensure_ascii=False))
