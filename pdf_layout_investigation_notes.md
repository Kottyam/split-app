# Group Fund PDF layout investigation notes

## User-provided reference PDFs

| File | Visual finding |
| --- | --- |
| `/home/ubuntu/upload/Canteen-August2026.pdf` | Severe horizontal clipping. Most content is pushed off-page to the right, leaving a large blank area on the left. The visible table and summary are cut mid-column, indicating an oversized fixed-width or shifted print container. |
| `/home/ubuntu/upload/Onam-August2026.pdf` | The first page is mostly readable, but the right side of the summary table is still clipped. Later pages also show partial-width rendering, with a large blank area and only the left portion of the table visible. |

## Initial inference

The regression appears consistent with a fixed desktop-width report container or transform/centering logic that is being rendered into a narrower PDF viewport during browser/native print capture. The repair should focus on the Group Fund report HTML width, print CSS, page margins, overflow handling, and any Android native WebView-to-PDF scaling behavior.
