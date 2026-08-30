# Branding Preview Findings

- The uploaded asset `/manus-storage/kharcha-logo-lockup_0b0066ed.png` is served successfully from the dev server as a 1057×953 PNG.
- The live `<img alt="Kharcha — Split, Track, Settle">` also reports the correct source and natural dimensions.
- The landing-page wrapper currently measures 240×128px because `imageClassName="max-h-28"` constrains the lockup to 112px and the wrapper uses `overflow-hidden`.
- The full artwork is therefore clipped in the landing preview despite the correct asset URL. The next fix should remove the landing `max-h-28` constraint or replace it with an intentional responsive height/width treatment that preserves the complete lockup.
