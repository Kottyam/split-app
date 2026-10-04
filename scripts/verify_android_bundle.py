from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "android-app" / "app" / "src" / "main" / "java" / "app" / "kharcha" / "splitter" / "MainActivity.java"

errors = []
main = MAIN.read_text(encoding="utf-8")
if "https://www.kharchasplit.in/?android=1" not in main:
    errors.append("MainActivity must load the production Kharcha website URL")
if "REMOTE_APP_URL" not in main:
    errors.append("Remote APK URL constant is missing")
if "kharchasplit-rlsqgpta.manus.space" in main or "fallbackToHostedApp" in main:
    errors.append("MainActivity still contains a legacy hosted fallback")

if errors:
    print("Android URL-runtime verification failed:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Android URL-runtime verification passed.")
print("APK launch URL: https://www.kharchasplit.in/?android=1")
