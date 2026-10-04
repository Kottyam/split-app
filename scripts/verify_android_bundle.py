from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "android-app" / "app" / "src" / "main" / "java" / "app" / "kharcha" / "splitter" / "MainActivity.java"

errors = []
main = MAIN.read_text(encoding="utf-8")
if "https://appassets.androidplatform.net/assets/web/index.html?android=1" not in main:
    errors.append("MainActivity must load the bundled local Kharcha web app")
if "BUNDLED_APP_URL" not in main:
    errors.append("Bundled APK URL constant is missing")
if "kharchasplit-rlsqgpta.manus.space" in main or "fallbackToHostedApp" in main:
    errors.append("MainActivity still contains a legacy hosted fallback")

if errors:
    print("Android URL-runtime verification failed:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Android local-runtime verification passed.")
print("APK launch URL: https://appassets.androidplatform.net/assets/web/index.html?android=1")
