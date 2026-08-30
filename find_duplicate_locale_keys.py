from pathlib import Path
import re
text = Path('client/src/contexts/languageAudit.ts').read_text()
blocks = [('auditEnglishSources', text[text.index('auditEnglishSources'):text.index('const wordMaps')])]
for locale in ['en','ml','hi','ta','kn','te','mr','bn','gu','pa','or','as']:
    start = text.find(f'  {locale}: {{')
    if start < 0:
        continue
    next_starts = [text.find(f'\n  {other}: {{', start + 1) for other in ['en','ml','hi','ta','kn','te','mr','bn','gu','pa','or','as']]
    ends = [pos for pos in next_starts if pos >= 0]
    end = min(ends) if ends else text.find('\n};', start)
    blocks.append((locale, text[start:end]))
for name, body in blocks:
    keys = re.findall(r"(?:^|[,{] )([A-Za-z][A-Za-z0-9_]*)\s*:", body)
    duplicates = sorted({key for key in keys if keys.count(key) > 1})
    print(name, duplicates)
