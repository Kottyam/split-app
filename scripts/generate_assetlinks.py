import json
import sys
from pathlib import Path

if len(sys.argv) not in (2, 3):
    raise SystemExit('Usage: python3 scripts/generate_assetlinks.py SHA256_CERT_FINGERPRINT [output_path]')

fingerprint = sys.argv[1].upper().replace(' ', '')
parts = fingerprint.split(':')
if len(parts) != 32 or any(len(part) != 2 for part in parts):
    raise SystemExit('Fingerprint must be the colon-separated SHA-256 certificate fingerprint from the Play signing certificate.')

payload = [{
    'relation': ['delegate_permission/common.handle_all_urls'],
    'target': {
        'namespace': 'android_app',
        'package_name': 'app.kharcha.splitter',
        'sha256_cert_fingerprints': [fingerprint],
    },
}]

output = Path(sys.argv[2]) if len(sys.argv) == 3 else Path('client/public/.well-known/assetlinks.json')
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
print(f'Wrote Digital Asset Links to {output}')
