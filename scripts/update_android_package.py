from pathlib import Path
import shutil

root = Path('/home/ubuntu/kharcha/android-app')
old = 'space.manus.kharchasplit_rlsqgpta.twa'
new = 'app.kharcha.splitter'

for path in root.rglob('*'):
    if not path.is_file() or 'build' in path.parts or path.name.endswith('.keystore'):
        continue
    try:
        text = path.read_text()
    except UnicodeDecodeError:
        continue
    if old in text:
        path.write_text(text.replace(old, new))

old_dir = root / 'app/src/main/java/space/manus/kharchasplit_rlsqgpta/twa'
new_dir = root / 'app/src/main/java/app/kharcha/splitter'
if old_dir.exists():
    new_dir.parent.mkdir(parents=True, exist_ok=True)
    if new_dir.exists():
        shutil.rmtree(new_dir)
    shutil.move(str(old_dir), str(new_dir))
    for path in new_dir.glob('*.java'):
        text = path.read_text().replace('package space.manus.kharchasplit_rlsqgpta.twa;', 'package app.kharcha.splitter;')
        path.write_text(text)

print(f'Renamed Android application namespace to {new}')
