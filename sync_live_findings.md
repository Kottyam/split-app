# Edit & Sync live preview findings

On 2026-08-25, the live Trips route exposed the Share chooser and an Edit & Sync dialog. Clicking Edit & Sync successfully created a link at /edit-sync/{token}; the backend endpoint therefore responded for Share creation.

The Edit & Sync dialog displayed a raw missing translation key `editSyncDescription` instead of a localized description. The recipient link loaded the selected Trip and showed Open editable copy. After opening the copy, the detail page showed the recipient banner. The banner immediately reported `5 editSyncPendingChanges` even though no user edit was made, because the Trip copy remaps IDs and the diff compares remapped IDs against the original snapshot.

Clicking Send to Original Sender for Synchronization succeeded and changed the banner to the raw key `editSyncSubmitted`, but the recipient detail page did not visibly show the generated owner-review URL. The review URL is only set in EditSyncRecipient, which is not the page used after opening the editable copy. The owner therefore has no visible link to open unless it is manually recovered from clipboard/share behavior.

The backend database contains `share_sessions` and `sync_packages`, and a non-mutating getShare invalid-token request returned structured null data. The main observed failure is the broken handoff/UI visibility and missing localization, not absent database tables.

After the hot update, the recipient page now shows localized copy-protection text and the Send Back action. Submitting from the editable Trip detail now visibly shows “Your synchronization is pending”, the generated `/sync-review/{token}` URL, and a Copy Link button. An older editable copy created before the root-ID fix still showed 2 review changes; this is stale local data, while newly created copies use normalized root identity for comparison.

A fresh editable Trip copy created after the fix opens with no synchronization banner and no false pending changes when untouched. The original generated link still opens correctly, and the owner-review handoff remains available after Send Back.

After mounting the persistent owner review component, the original Trip detail now visibly shows a Review Changes section and pending synchronization count. The first package was created before the new packageToken migration, so it cannot render a direct review button; a fresh Send Back after migration is required to verify the new clickable owner entry.

A fresh Edit & Sync link still opens the editable Trip route, not the View Only route. A fresh copy created after the packageToken migration opens without a false pending-change banner when untouched, confirming the two sharing modes are distinct at the route level.

A fresh editable Trip copy was modified by adding a member. The detail page immediately showed the local-copy banner, Review Changes count, and Send to Original Sender for Synchronization action. This confirms the editable route and local edit workflow are active; the next check is the new owner-side pending entry after Send Back.

After a fresh recipient member edit and Send Back, the original owner Trip detail now shows a persistent Review Changes section with a clickable pending package row labeled with the Trip name, recipient, and timestamp. This confirms the owner no longer needs to find the review link manually.

The owner-side pending row opens the review page and displays the submitted member details. However, approving the package incorrectly reports the same recipient-added member as a conflict even though the owner had not added it; this disables Synchronize. The merge algorithm must treat identical additions on both sides as non-conflicting and retain the recipient addition.

Mobile visual verification: More now contains an Edit & Sync entry using existing Kharcha card styling; /sync-updates renders within the existing cream, green, orange, and navy design with the current localized labels and bottom navigation preserved.
