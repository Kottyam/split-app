# Official Android release sources

- Google Play target API requirements: https://developer.android.com/google/play/requirements/target-sdk
  As of August 31, 2026, new apps and app updates must target Android 16 / API 36 or higher. Kharcha's Android wrapper currently targets API 36.

- Trusted Web Activity quick start: https://developer.chrome.com/docs/android/trusted-web-activity/quick-start
  A TWA uses the hosted PWA in a full-screen browser tab after Digital Asset Links verification. If verification fails, it falls back to a Custom Tab. The guide covers Bubblewrap, signing keys, ADB installation, and hosting /.well-known/assetlinks.json.

- Google Play Billing one-time purchase lifecycle: https://developer.android.com/google/play/billing/lifecycle/one-time
  By August 31, 2026, new apps and updates must use Play Billing Library 8 or later. One-time purchase processing should be verified in a secure backend, acknowledged for non-consumables, and handled for cancellation/refund states.

- Play Console target API help: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
  New-app and update target API rules, availability implications, and extension timing are documented here.
