from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "android-app/app/src/main/assets/web"

# Android startup intentionally uses the live HTTPS WebView page.
# The previous embedded-WebView patch caused a blank screen on-device.
if not (ASSETS / "index.html").exists():
    raise SystemExit("Android web bundle is missing: android-app/app/src/main/assets/web/index.html")

print("Android bundle verified; leaving MainActivity HTTPS startup unchanged")
