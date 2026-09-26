from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "android-app" / "app" / "src" / "main" / "assets" / "web"
INDEX = BUNDLE / "index.html"
MAIN = ROOT / "android-app" / "app" / "src" / "main" / "java" / "app" / "kharcha" / "splitter" / "MainActivity.java"

errors = []
if not INDEX.is_file() or INDEX.stat().st_size == 0:
    errors.append("bundled index.html is missing or empty")
else:
    html = INDEX.read_text(encoding="utf-8")
    checks = [
        ('<div id="root"></div>' in html, "index.html root element missing"),
        (bool(re.search(r'<script type="module" crossorigin src="./assets/[^"]+\.js"', html)), "index.html does not reference a relative module bundle"),
        ('%VITE_ANALYTICS_ENDPOINT%' not in html, "analytics endpoint placeholder remains in index.html"),
        ('%VITE_ANALYTICS_WEBSITE_ID%' not in html, "analytics website-id placeholder remains in index.html"),
    ]
    errors.extend(message for ok, message in checks if not ok)

patterns = [
    r"kharchasplit-rlsqgpta\.manus\.space",
    r"manus\.space",
    r"manus-storage",
    r"__manus__",
    r"VITE_ANALYTICS_ENDPOINT",
    r"VITE_ANALYTICS_WEBSITE_ID",
    r"VITE_OAUTH_PORTAL_URL",
    r"BUILT_IN_FORGE_API_URL",
    r"BUILT_IN_FORGE_API_KEY",
    r"OAUTH_SERVER_URL",
]
if BUNDLE.exists():
    for path in BUNDLE.rglob("*"):
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                errors.append(f"bundled runtime contains forbidden reference {pattern} in {path.relative_to(BUNDLE)}")

main = MAIN.read_text(encoding="utf-8")
for needle, message in [
    ("WebViewAssetLoader", "WebViewAssetLoader is missing"),
    ("appassets.androidplatform.net/assets/web/index.html", "bundled app URL is missing"),
]:
    if needle not in main:
        errors.append(message)
if "kharchasplit-rlsqgpta.manus.space" in main or "fallbackToHostedApp" in main:
    errors.append("MainActivity still contains a hosted fallback")

if errors:
    print("Android bundled-runtime verification failed:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Android bundled-runtime verification passed.")
