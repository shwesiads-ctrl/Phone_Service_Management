"""Build the GitHub source ZIP after fresh frontend/server builds. Requires Python 3."""
from pathlib import Path
import subprocess
import zipfile
import json

root = Path(__file__).resolve().parent.parent
target = root / 'downloads/FixFlow-LAN-Work-Updated.zip'
paths = set(subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=root).decode().split('\0'))
paths.discard('')
paths.discard(str(target.relative_to(root)))
paths.update(str(path.relative_to(root)) for path in (root / 'dist').rglob('*') if path.is_file())
paths.add('server.cjs')
assert (root / 'dist/index.html').is_file() and (root / 'server.cjs').is_file(), 'Build frontend and server first.'
target.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name in sorted(paths):
        path = root / name
        if name.startswith('data/') or any(part in {'.git', 'node_modules', '.security'} for part in Path(name).parts):
            continue
        if path.is_file():
            archive.write(path, name)
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    assert not any(name.startswith('data/') or '.security/' in name or 'node_modules/' in name for name in archive.namelist())
    for name in ['dist/index.html', 'server.cjs', 'LICENSE', 'SETUP.md', 'src/views/DevicesView.tsx', 'scripts/fixtures/legacy-demo-db.json']:
        assert name in archive.namelist(), name
    release = json.loads(archive.read('src/config/release.json'))
    assert json.loads(archive.read('package.json'))['version'] == release['version']
    print(f"ZIP {release['version']} verified: {len(archive.namelist())} files; no live database, backups or recovery credentials.")
