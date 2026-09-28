"""Build the pinned decoder with the collection-format extension patch."""
import argparse
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REVISION = 'a4e0a69e0c1a7d948e9b34ef3769a3bb4bbdb66f'


def build(upstream):
    upstream = upstream.resolve()
    if not upstream.is_relative_to(ROOT / 'work'):
        raise ValueError('Use an upstream checkout below work/')
    if not upstream.exists():
        upstream.mkdir(parents=True)
        subprocess.run(['git', 'init', str(upstream)], check=True)
        subprocess.run(['git', '-C', str(upstream), 'fetch', '--depth=1',
                        'https://github.com/Frodo45127/rpfm', REVISION], check=True)
        subprocess.run(['git', '-C', str(upstream), 'checkout', '--detach', 'FETCH_HEAD'], check=True)
    revision = subprocess.check_output(['git', '-C', str(upstream), 'rev-parse', 'HEAD'], text=True).strip()
    if revision != REVISION:
        raise ValueError('Upstream revision mismatch')
    patch = ROOT / 'scripts/battlefield-decoder/patches/collection-formats.patch'
    already = subprocess.run(['git', '-C', str(upstream), 'apply', '--reverse', '--check', str(patch)], capture_output=True)
    if already.returncode:
        subprocess.run(['git', '-C', str(upstream), 'apply', '--check', str(patch)], check=True)
        subprocess.run(['git', '-C', str(upstream), 'apply', str(patch)], check=True)
    actual = subprocess.check_output(['git','-C',str(upstream),'diff','--binary'])
    if actual != patch.read_bytes():
        raise ValueError('Upstream checkout contains changes outside the pinned patch')
    os.environ.setdefault('CARGO_TARGET_DIR', str(ROOT/'work/battlefield-decoder-target'))
    config = 'patch."https://github.com/Frodo45127/rpfm".rpfm_lib.path="' + (upstream / 'rpfm_lib').as_posix() + '"'
    subprocess.run(['cargo', 'build', '--locked', '--manifest-path', str(ROOT / 'scripts/battlefield-decoder/Cargo.toml'),
                    '--config', config], check=True, cwd=ROOT)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--upstream', type=Path, default=ROOT / 'work/rpfm')
    build(parser.parse_args().upstream)
