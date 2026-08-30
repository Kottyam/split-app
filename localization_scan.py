from pathlib import Path
import re

ROOT = Path('/home/ubuntu/kharcha/client/src')
TARGET_DIRS = [ROOT / 'pages', ROOT / 'components']
SKIP_NAMES = {'ComponentShowcase.tsx'}
SKIP_PARTS = {'ui'}

patterns = [
    ('jsx', re.compile(r'>\s*([^<{\n][^<{]*?)\s*<')),
    ('prop', re.compile(r'\b(placeholder|title|aria-label|alt)\s*=\s*(["\'])(.*?)\2')),
    ('browser', re.compile(r'\b(?:window\.)?(?:alert|confirm|prompt)\s*\(\s*(["\'`])(.+?)\1')),
]

for directory in TARGET_DIRS:
    for path in sorted(directory.glob('*.tsx')):
        if path.name in SKIP_NAMES:
            continue
        lines = path.read_text(encoding='utf-8').splitlines()
        for line_no, line in enumerate(lines, 1):
            for kind, pattern in patterns:
                for match in pattern.finditer(line):
                    if kind == 'prop':
                        value = match.group(3)
                        label = f'{match.group(1)}={value}'
                    elif kind == 'browser':
                        value = match.group(2)
                        label = value
                    else:
                        value = match.group(1).strip()
                        label = value
                    if not value or not re.search(r'[A-Za-z]', value):
                        continue
                    if len(value) > 180:
                        value = value[:177] + '...'
                    print(f'{path.relative_to(ROOT)}:{line_no}:{kind}: {value}')
