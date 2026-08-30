# Kharcha Android APK

Kharcha is publicly available at https://kharchasplit-rlsqgpta.manus.space/.

The Android packaging project is under `android-app/` and uses package ID `app.kharcha.splitter`. It opens the published Kharcha PWA inside a Trusted Web Activity wrapper with the Kharcha launcher mark, splash screen, and orange status-bar branding. See [`ANDROID_RELEASE.md`](ANDROID_RELEASE.md) for the production AAB workflow.

## Install on Android

Download `Kharcha.apk` to an Android phone, open it from Files or Downloads, and allow the browser/file manager to install apps from that source if Android asks. Confirm the installation and launch **Kharcha** from the app drawer.

The first launch should have internet access so the published PWA can load. Kharcha retains its existing localStorage-based offline-first behavior after the web app has been loaded; UPI actions still depend on a compatible UPI app installed on the phone.

## Signing and release status

A production Play upload requires a permanent owner-controlled upload keystore. The private key is intentionally not included. The Gradle release task now fails if signing properties are missing, preventing accidental unsigned release uploads. Use `ANDROID_RELEASE.md` for keystore, AAB, Digital Asset Links, testing, and Play Console instructions.

## Verification

The Android wrapper was configuration-checked and compiled locally against Android SDK Platform 36 with the Gradle wrapper and full JDK. A debug build and an ephemeral-key signed release AAB build both succeeded; the ephemeral key and bundle were removed afterward. The web suite passed 144 Vitest tests, the production web build succeeded, and Android packaging verification passed.
