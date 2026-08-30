import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Android launch flow", () => {
  const root = resolve(import.meta.dirname, "../../..");
  const splash = readFileSync(
    resolve(root, "android-app/app/src/main/java/app/kharcha/splitter/SplashActivity.java"),
    "utf8",
  );
  const main = readFileSync(
    resolve(root, "android-app/app/src/main/java/app/kharcha/splitter/MainActivity.java"),
    "utf8",
  );
  const lockGate = readFileSync(resolve(root, "client/src/components/AppLockGate.tsx"), "utf8");
  const manifest = readFileSync(
    resolve(root, "android-app/app/src/main/AndroidManifest.xml"),
    "utf8",
  );
  const css = readFileSync(resolve(root, "client/src/index.css"), "utf8");
  const splashLayout = readFileSync(resolve(root, "android-app/app/src/main/res/layout/activity_splash.xml"), "utf8");
  const splashTheme = readFileSync(resolve(root, "android-app/app/src/main/res/values/splash_theme.xml"), "utf8");

  it("routes normal Android launches through the direct branded WebView launcher", () => {
    expect(manifest).toContain('<uses-permission android:name="android.permission.INTERNET" />');
    expect(manifest).toContain('android:name=".MainActivity"');
    expect(manifest).toContain('android:exported="true"');
    expect(manifest).toContain('<action android:name="android.intent.action.MAIN" />');
    expect(manifest).toContain('<category android:name="android.intent.category.LAUNCHER" />');
    expect(main).toContain("MIN_SPLASH_DURATION_MS = 650L");
    expect(main).toContain("splashOverlay.setAlpha(1f)");
    expect(main).toContain("setContentView(root)");
    expect(main).toContain("setDuration(120L)");
    expect(manifest).toContain('android:theme="@style/Theme.Kharcha.Splash"');
    expect(splashLayout).toContain('android:src="@drawable/kharcha_logo_mobile"');
    expect(splashTheme).toContain('android:windowBackground">@color/splashWhite');
    expect(manifest).not.toContain('<activity android:name=".SplashActivity"');
    expect(manifest).not.toContain('android.support.customtabs.trusted.SPLASH_IMAGE_DRAWABLE');
    expect(manifest).not.toContain('@drawable/kharcha_logo_reference');
  });

  it("keeps the WebView surface available and the legacy TWA deep-link activity available", () => {
    expect(manifest).toContain('android:name="LauncherActivity"');
    expect(manifest).not.toContain('android:name=".SplashActivity"');
    expect(manifest).toContain('android:name="LauncherActivity"');
    expect(main).toContain("new WebView(this)");
    expect(main).toContain("Search contact name or number");
    expect(main).toContain("Select All");
    expect(main).toContain("Clear All");
    expect(main).toContain("Add selected");
    expect(main).toContain("matchesContact");
    expect(main).toContain("KharchaSecurity");
    expect(main).toContain("isDeviceAuthAvailable");
    expect(main).toContain("requestDeviceAuth");
    expect(main).toContain("BiometricPrompt");
    expect(main).toContain("BIOMETRIC_STRONG");
    expect(main).toContain("DEVICE_CREDENTIAL");
    expect(main).toContain("persistDeviceAuthResult");
    expect(main).toContain("deviceAuthInFlight");
    expect(main).toContain("deviceAuthResultSent");
    expect(main).toContain("if (deviceAuthResultSent) return;");
    expect(main).toContain("consumeDeviceAuthResult");
    expect(main).toContain("Reading contacts");
    expect(main).toContain("showContactLoading");
    expect(main).toContain("contactExecutor.execute");
    expect(splash).not.toContain("intent.putExtras(getIntent())");
  });

  it("does not relock the WebView during an Android credential visibility round-trip", () => {
    expect(lockGate).toContain("deviceAuthInFlightRef");
    expect(lockGate).toContain("if (deviceAuthInFlightRef.current) return;");
    expect(lockGate).toContain("setSessionUnlocked(true)");
    expect(lockGate).toContain("deviceAuthInFlightRef.current = false;");
  });

  it("protects app content from Android system bars", () => {
    expect(css).toContain("--android-status-offset: max(env(safe-area-inset-top), 2.75rem)");
    expect(css).toContain("padding-top: var(--android-status-offset)");
    expect(css).toContain("html.android-shell .sticky.top-0");
    expect(css).toContain("top: var(--android-status-offset)");
    expect(css).toContain("background: #ffffff");
    expect(css).toContain("html.android-shell .android-trip-tabs");
    expect(css).toContain("html.android-shell .android-budget-edit");
    expect(css).toContain("html.android-shell .android-action-row");
    expect(css).toContain("html.android-shell .android-section-header");
  });
});
