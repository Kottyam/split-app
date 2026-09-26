from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ANDROID = ROOT / 'android-app'
APP_GRADLE = ANDROID / 'app' / 'build.gradle'
MANIFEST = ANDROID / 'app' / 'src' / 'main' / 'AndroidManifest.xml'
TWA_MANIFEST = ANDROID / 'twa-manifest.json'
WEB_MANIFEST = ROOT / 'client' / 'public' / 'manifest.json'
ASSETLINKS = ROOT / 'client' / 'public' / '.well-known' / 'assetlinks.json'

errors: list[str] = []

def require(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)

app_gradle = APP_GRADLE.read_text()
android_manifest = MANIFEST.read_text()
twa = json.loads(TWA_MANIFEST.read_text())
web = json.loads(WEB_MANIFEST.read_text())
assetlinks = json.loads(ASSETLINKS.read_text())

require('applicationId "app.kharcha.splitter"' in app_gradle, 'Android applicationId must remain app.kharcha.splitter')
require('namespace "app.kharcha.splitter"' in app_gradle, 'Android namespace must remain app.kharcha.splitter')
require('targetSdkVersion 36' in app_gradle, 'Android target SDK must remain API 36 for the current Play requirement')
require('compileSdkVersion 36' in app_gradle, 'Android compile SDK must remain API 36')
require('signingConfigs' in app_gradle and 'validateReleaseSigning' in app_gradle, 'Release signing validation must be configured')
require('androidx.biometric:biometric:1.1.0' in app_gradle, 'BiometricPrompt dependency is required')
require(twa.get('packageId') == 'app.kharcha.splitter', 'TWA packageId must match the Android applicationId')
require(twa.get('host') == 'appassets.androidplatform.net', 'TWA host must use the bundled WebViewAssetLoader origin')
require(twa.get('appVersionName') == '1.0.0', 'TWA appVersionName must match the web release version')
require(twa.get('appVersionCode') == 63, 'TWA appVersionCode must match the current Android release version code 63')
require(twa.get('startUrl') == '/assets/web/index.html?android=1', 'TWA startUrl must point to the bundled web application')
require(twa.get('themeColor') == '#FFFAF2', 'TWA status-bar theme must remain neutral cream')
require(twa.get('backgroundColor') == '#FFFAF2', 'TWA splash background must match the app cream surface')
require(web.get('display') == 'standalone', 'PWA display must remain standalone')
require(web.get('start_url') == '/', 'PWA start_url must remain root')
require(isinstance(assetlinks, list) and assetlinks, 'Digital Asset Links must be a non-empty JSON array')
require(assetlinks[0].get('target', {}).get('package_name') == 'app.kharcha.splitter', 'Digital Asset Links package must match the Android applicationId')
require('4D:BD:34:9E:67:7D:9F:2F:98:A7:91:4D:E0:8C:FC:BB:F1:45:89:09:3C:84:84:3A:1D:D4:6C:64:D4:4E:B9:1B' in assetlinks[0].get('target', {}).get('sha256_cert_fingerprints', []), 'Digital Asset Links must include the current debug APK fingerprint')
require('android:exported="true"' in android_manifest, 'Launcher activity must declare android:exported=true')
require('android.permission.READ_CONTACTS' in android_manifest, 'Add from Contact requires READ_CONTACTS permission')
require('android.permission.CAMERA' in android_manifest, 'Merchant QR scanning requires CAMERA permission')
require((ANDROID / 'app' / 'src' / 'main' / 'java' / 'app' / 'kharcha' / 'splitter' / 'MainActivity.java').exists(), 'MainActivity source is required')
main_activity = (ANDROID / 'app' / 'src' / 'main' / 'java' / 'app' / 'kharcha' / 'splitter' / 'MainActivity.java').read_text()
require('KharchaContacts' in main_activity and 'pickContacts' in main_activity, 'Native contact bridge is required')
require('onPermissionRequest' in main_activity and 'RESOURCE_VIDEO_CAPTURE' in main_activity, 'WebView camera permission handling is required')
require('KharchaShare' in main_activity and 'shareText' in main_activity and 'Intent.ACTION_SEND' in main_activity, 'Native Android share chooser is required')
require('KharchaSecurity' in main_activity and 'BiometricPrompt' in main_activity and 'BIOMETRIC_STRONG' in main_activity and 'DEVICE_CREDENTIAL' in main_activity, 'Native biometric/device-lock bridge is required')
require('consumeDeviceAuthResult' in main_activity and 'pending_device_auth_result' in main_activity, 'Persistent device-auth result handoff is required')
require('showContactLoading' in main_activity and 'contactExecutor.execute' in main_activity, 'Non-blocking contact loading state is required')
require('android:debuggable="true"' not in android_manifest, 'Production manifest must not enable android:debuggable')
require('android:usesCleartextTraffic="true"' not in android_manifest, 'Production manifest must not enable cleartext traffic')
require((ANDROID / 'gradlew').exists(), 'Gradle wrapper is required for reproducible Android builds')
require((ANDROID / 'app' / 'src' / 'main' / 'res' / 'layout' / 'activity_splash.xml').exists(), 'Document-driven splash layout is required')
require((ANDROID / 'app' / 'src' / 'main' / 'res' / 'drawable-nodpi' / 'kharcha_logo_mobile.webp').exists(), 'Updated Kharcha mobile logo resource is required')
require((ANDROID / 'app' / 'src' / 'main' / 'res' / 'mipmap-mdpi' / 'ic_launcher.png').exists(), 'Launcher icon is required')
require((ANDROID / 'app' / 'src' / 'main' / 'java' / 'app' / 'kharcha' / 'splitter' / 'LauncherActivity.java').exists(), 'LauncherActivity source is required')
require('kharchasplit-rlsqgpta.manus.space' not in main_activity, 'MainActivity must not contain the hosted Manus URL')
require('fallbackToHostedApp' not in main_activity, 'MainActivity must not contain a hosted fallback')
require('WebViewAssetLoader' in main_activity and 'appassets.androidplatform.net/assets/web/index.html' in main_activity, 'Bundled WebViewAssetLoader loading is required')

if errors:
    print('Android packaging verification failed:')
    for error in errors:
        print(f'- {error}')
    sys.exit(1)

print('Android packaging verification passed.')
print(f"Application ID: {twa['packageId']}")
print(f"Target SDK: 36")
print(f"TWA host: {twa['host']}")
print('Release signing: validated at Gradle release-task time')
