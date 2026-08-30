# Kharcha Android release guide

## What was prepared

Kharcha remains the existing React + Node + tRPC web application. The Android target uses a small native launcher around the published PWA at `https://kharchasplit-rlsqgpta.manus.space/`; the backend, database, authentication, localStorage data model, 12-language localization, and business logic are not duplicated or rewritten. The launcher now uses an embedded WebView for reliable startup on devices where the TWA handoff crashes, while the TWA activity remains available for verified deep links.

The Android wrapper uses application ID `app.kharcha.splitter`, target/compile SDK 36, a document-driven native `SplashActivity` with the supplied Kharcha logo on a cream canvas, the existing Kharcha launcher icon, the published domain, and Android back-button handling in the embedded WebView. The native splash contains no user controls and transitions automatically to the stable WebView after a short branded launch interval. The WebView launch URL carries an Android-only marker that scopes compact mobile density and safe-area styling to the Android wrapper; the normal web portal keeps its existing layout. The web shell includes Android safe-area viewport metadata, and production error UI no longer exposes raw stack traces. API diagnostics remain available only in development builds.

The wrapper does not invent native functionality. Web Share, download/export, file selection, UPI deep links, and localStorage continue to use the embedded WebView and Android hand-offs already used by the web app. The first launch needs network access to load the hosted PWA; once loaded, the existing local-first behavior remains available through the app’s WebView storage profile. A WebView profile cannot automatically read Chrome/TWA localStorage; users must update an existing WebView-based APK without uninstalling it to retain that profile, or restore a backup when moving from a browser/TWA profile.

## A. Generate the Android AAB

Install the prerequisites on the build machine: Android Studio or Android command-line tools with Android SDK Platform 36 and Platform-Tools, JDK 17 or a compatible newer JDK, and Node.js with pnpm. The repository already contains the Gradle wrapper, so a separate Gradle installation is not required.

From the repository root, run:

```bash
pnpm install
pnpm build
pnpm android:verify
```

Create a permanent upload keystore once, outside source control:

```bash
keytool -genkeypair -v \
  -keystore android-app/kharcha-upload.jks \
  -alias kharcha-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Set the signing values for the current shell. Do not paste the passwords into Git, this document, or a public CI log:

```bash
export RELEASE_STORE_FILE="$PWD/android-app/kharcha-upload.jks"
export RELEASE_STORE_PASSWORD='your-keystore-password'
export RELEASE_KEY_ALIAS='kharcha-upload'
export RELEASE_KEY_PASSWORD='your-key-password'
```

Build the release bundle:

```bash
pnpm android:aab
```

The Gradle release task fails deliberately when signing values are missing. This prevents accidentally treating an unsigned release as Play-ready.

## B. Sign the AAB

For a new Play Store app, use Google Play App Signing. The bundle is signed locally with the upload key configured above, then Google Play re-signs the distributed APKs with the protected app-signing key. Keep the upload keystore and passwords in a password manager and maintain an encrypted backup. Never commit the keystore or `keystore.properties` to Git; the repository ignores `.jks`, `.keystore`, APK, AAB, and local Android build output files.

If a CI provider is used, store `RELEASE_STORE_FILE` as a protected file secret and the three password/alias values as protected secrets. The Android Gradle configuration accepts either Gradle properties or environment variables and uses the same application ID for every update.

## C. AAB output location

After a successful build, the release bundle is located at:

```text
android-app/app/build/outputs/bundle/release/app-release.aab
```

A debug APK for direct device installation is located at:

```text
android-app/app/build/outputs/apk/debug/app-debug.apk
```

The repository now includes the Android SDK Platform 36, Platform-Tools, and a full JDK in the validation environment. The debug wrapper build and a signed release AAB build were both validated with an ephemeral test key; the test key and test bundle were removed afterward. A production AAB must still be generated with the owner’s permanent upload key. No private production signing key is included.

## D. Test on a real Android phone

Enable Developer Options and USB debugging on the phone, connect it to the build machine, and verify the device:

```bash
adb devices
cd android-app
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Test the launch, Android back button, login/session continuity, all four modules, all 12 languages, localStorage persistence, expense creation/editing, CSV/PDF/download flows, Web Share and WhatsApp/SMS hand-offs, UPI deep links, file selection, network loss/recovery, and the Help & Guide email link. Also test a clean install and an update install over an older build; the package ID must remain `app.kharcha.splitter` and the app version code must increase for every Play upload.

For release-like testing, upload the AAB to a Play Console internal-testing track instead of sideloading the AAB. TWA verification should be checked on a device with a supported browser. Without a correct Digital Asset Links file, verified deep links fall back to a Custom Tab with browser UI; normal app launches still use the embedded WebView and do not depend on TWA verification.

## E. Upload to Google Play Console

1. Create the app in [Google Play Console](https://play.google.com/console/) with the product name **Kharcha** and package ID `app.kharcha.splitter`.
2. Enroll in Play App Signing when prompted and upload `app-release.aab` to the Internal testing track first.
3. Add testers, install from the Play testing URL, and inspect the Android vitals and pre-launch report.
4. Complete the store listing: app icon, feature graphic, screenshots, short description, full description, category, contact email, and privacy-policy URL.
5. Complete App content declarations, Data safety, content rating, target-audience, ads declaration, and any app-access instructions required for the login flow.
6. Confirm the target API, bundle version code, privacy disclosures, and country/price settings. The planned Premium unlock is not enabled in this build.
7. Promote from Internal testing to Closed testing and Production only after real-device testing and Play pre-launch checks are clean.

## F. Permissions

The current wrapper requests only Internet access and Contacts read access. Contacts access is used solely when the user taps Add from Contact; the native picker supports selecting multiple phone contacts and returns only the selected names and numbers to the WebView. Camera, location, Bluetooth, phone, SMS, external-storage, and notification permissions are not requested. File sharing uses Android/browser share mechanisms and the wrapper's narrowly scoped internal FileProvider configuration. UPI is launched through a `upi://` link and does not require a special Kharcha permission. Android and Play Console may still show browser-level permissions or chooser prompts for the user's selected browser and installed apps; those are not additional Kharcha manifest permissions.

## G. Remaining requirements before production release

The following items still require owner action or a release environment:

| Item | Status and action |
|---|---|
| Release upload key | Create and protect the permanent upload keystore. Never commit it. |
| Android SDK/ADB build environment | Install SDK Platform 36, Platform-Tools, and accepted licenses on the build machine or CI runner. |
| Digital Asset Links | The current deployed file is live and matches the debug APK certificate, so the debug build can use verified full-screen TWA behavior. Before Play production release, replace or extend it with the Google Play App Signing certificate fingerprint and verify it again at `/.well-known/assetlinks.json`. |
| Privacy policy and data disclosures | Publish a privacy policy describing authentication, local storage, server requests, sharing, and any analytics; complete Play Data safety accurately. |
| Store listing and review assets | Prepare screenshots for Android phones, feature graphic, icon, descriptions, contact details, content rating, target audience, and app-access instructions. |
| Testing tracks | Complete internal/closed testing and resolve pre-launch warnings. Account-specific Play testing requirements may apply. |
| Versioning | Increase `APP_VERSION_CODE` for every upload; keep the application ID unchanged for updates. |
| Premium unlock | Not implemented in this packaging pass. For the planned one-time ₹20 unlock, create a Play one-time product such as `kharcha_premium_unlock`, integrate Play Billing Library 8 or later in a native billing boundary, verify purchase tokens in the existing backend, acknowledge non-consumable purchases, handle cancellation/refund states, and store the entitlement server-side. Do not unlock Premium solely from a client callback. |

## Billing architecture for the future ₹20 Premium unlock

The current Android package deliberately remains free and does not add a fake purchase screen. When Premium is introduced, the native Android layer should own the BillingClient connection and expose only a narrow result to the web experience, such as `purchasePremium()` and `restorePremium()`. The server should validate the purchase token with the Google Play Developer API, associate the entitlement with the authenticated Kharcha user, and let the web app read the entitlement through the existing authenticated API. This preserves the current web business logic while keeping payment verification out of the browser.

Google's current guidance requires Play Billing Library 8 or later for new apps and updates from August 31, 2026, and recommends secure backend processing for one-time products.[3]

## Official references

[1]: https://developer.android.com/google/play/requirements/target-sdk "Meet Google Play's target API level requirement"
[2]: https://developer.chrome.com/docs/android/trusted-web-activity/quick-start "Quick start to Trusted Web Activities"
[3]: https://developer.android.com/google/play/billing/lifecycle/one-time "One-time purchase lifecycle"
[4]: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en "Target API level requirements for Google Play apps"

The TWA architecture and Digital Asset Links requirements are described in [2]. The current target API requirement is documented in [1] and [4]. The one-time billing lifecycle and backend verification guidance are documented in [3].
