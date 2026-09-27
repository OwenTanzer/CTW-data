"""Retrieve a configured battlefield variant without guessing ambiguous selectors."""
import argparse
import json
from pathlib import Path
import sqlite3


def query(database, selector, mode=None):
    with sqlite3.connect(database.resolve().as_uri() + '?mode=ro', uri=True) as db:
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
    parser.add_argument('--select', required=True)
    parser.add_argument('--mode', choices=['singleplayer', 'multiplayer'])
    args = parser.parse_args()
    print(json.dumps(query(args.database, args.select, args.mode), indent=2, ensure_ascii=False))
