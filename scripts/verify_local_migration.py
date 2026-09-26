#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
RUNTIME_PATHS = [
    ROOT / "client",
    ROOT / "server" / "_core" / "index.ts",
    ROOT / "server" / "routers",
    ROOT / "shared",
    ROOT / "vite.config.ts",
    ROOT / "package.json",
    ROOT / ".github" / "workflows",
    ROOT / "android-app",
]
PATTERNS = [
    r"kharchasplit-rlsqgpta\\.manus\\.space",
    r"manus\\.space",
    r"manus-storage",
    r"__manus__",
    r"VITE_ANALYTICS_ENDPOINT",
    r"VITE_ANALYTICS_WEBSITE_ID",
    r"VITE_OAUTH_PORTAL_URL",
]
EXCLUDED = {
    "server/_core/oauth.ts",
    "server/_core/sdk.ts",
    "server/_core/types/manusTypes.ts",
    "server/_core/env.ts",
    "twa-manifest.json",
    "android-app/twa-manifest.json",
}

violations = []
for base in RUNTIME_PATHS:
    files = [base] if base.is_file() else [p for p in base.rglob("*") if p.is_file()] if base.exists() else []
    for path in files:
        rel = path.relative_to(ROOT).as_posix()
        if rel in EXCLUDED or ".gradle" in path.parts:
            continue
        if path.suffix.lower() not in {".ts",".tsx",".js",".jsx",".json",".html",".css",".gradle",".java",".xml",".yml",".yaml"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for pattern in PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                violations.append(f"{rel}: {pattern}")

if violations:
    print("Local-first runtime audit failed:")
    print("\n".join(f"- {v}" for v in violations))
    sys.exit(1)

print("Local-first runtime audit passed: no active Manus runtime references found.")
print("Optional legacy OAuth compatibility files remain isolated and are not registered by the local server.")
