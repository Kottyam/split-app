from pathlib import Path
import re
source = Path('client/src/contexts/languageAudit.ts').read_text()
source_keys = set(re.findall(r"\b(audit[A-Za-z0-9]+)\s*:", source.split('const wordMaps', 1)[0]))
used = set()
for path in Path('client/src').rglob('*'):
    if path.suffix not in {'.ts', '.tsx'}:
        continue
    used.update(re.findall(r"['\"](audit[A-Za-z0-9]+)['\"]", path.read_text()))
print('Missing:', sorted(used - source_keys))
print('Unused count:', len(source_keys - used))
