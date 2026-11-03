export const PDF_LAYOUT_CSS = `
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { width: 100%; max-width: 100%; margin: 0; padding: 0; overflow-x: hidden; height: auto; min-height: 0; }
  .report > :last-child, body > :last-child { margin-bottom: 0 !important; page-break-after: auto; break-after: auto; }
  body {
    font-family: Arial, sans-serif;
    color: #18324b;
    background: #ffffff;
    font-size: 11px;
    line-height: 1.35;
    width: 100%;
    max-width: 186mm;
    margin: 0 auto;
    overflow-wrap: anywhere;
  }
  .report { width: 100%; max-width: 186mm; margin: 0 auto; }
  @media screen {
    body { padding: 14px; max-width: 794px; }
    .report { max-width: 100%; }
  }
  @media print {
    body { padding: 0; max-width: none; }
    .report { max-width: none; }
  }
  .report-header, header {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    border-bottom: 2px solid #16834b;
    padding-bottom: 10px;
    margin-bottom: 12px;
  }
  .report-heading, header > div { min-width: 0; flex: 1; }
  .brand-name { color: #16834b; font-size: 25px; line-height: 1; font-weight: 800; letter-spacing: 1.5px; margin-bottom: 8px; }
  .brand-wordmark { font-family: 'Poppins', 'Nunito', Arial, sans-serif; font-size: 30px; font-weight: 800; letter-spacing: 0.5px; line-height: 1; margin: 0 0 6px; }
  .brand-block { flex: 0 0 auto; margin: 0 0 6px; }
  .brand-block .brand-wordmark { margin: 0; }
  .brand-tagline { font-family: 'Poppins', 'Nunito', Arial, sans-serif; font-size: 10.5px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-top: 3px; line-height: 1.1; }
  .brand-tagline .wm-blue { color: #023b81; }
  .brand-tagline .wm-green { color: #038f27; }
  .brand-tagline .wm-orange { color: #fd6d00; }
  .report-header.stacked { display: block; }
  .summary.cards-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); background: #ffffff; border: none; padding: 0; }
  .summary.cards-4 .metric { border-top: 4px solid var(--card-accent, #023b81); background: #f7faff; font-weight: 700; color: #5b6670; }
  .summary.cards-4 .metric strong { color: #023b81; font-size: 15px; }
  .summary.cards-4 .metric small { display: block; font-weight: 600; font-size: 9.5px; margin-top: 2px; color: #5b6670; }
  .brand-wordmark .wm-blue { color: #023b81; }
  .brand-wordmark .wm-green { color: #038f27; }
  .brand-wordmark .wm-orange { color: #fd6d00; }
  .brand-name::after { content: ''; display: block; width: 54px; height: 4px; margin-top: 5px; border-radius: 4px; background: #e87817; }
  h1 { font-size: 22px; line-height: 1.15; font-weight: 700; margin: 0 0 4px; overflow-wrap: anywhere; }
  h2, h3 { color: #16834b; break-after: avoid; page-break-after: avoid; }
  h2 { font-size: 15px; margin: 20px 0 8px; }
  h3 { font-size: 15px; margin: 18px 0 8px; }
  p, .meta { font-size: 11px; line-height: 1.35; color: #5b6670; margin: 0 0 10px; overflow-wrap: anywhere; }
  .summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
    margin: 10px 0 16px;
    padding: 10px;
    border: 1px solid #16834b;
    border-radius: 6px;
    background: #f2fbf3;
    overflow-wrap: anywhere;
  }
  .metric { min-width: 0; border: 1px solid #c7d8cc; border-radius: 6px; padding: 9px; background: #f2fbf3; overflow-wrap: anywhere; }
  .metric strong, .summary strong { display: block; margin-top: 4px; font-size: 14px; overflow-wrap: anywhere; white-space: normal; }
  table { width: 100%; max-width: 100%; table-layout: fixed; border-collapse: collapse; margin: 6px 0 16px; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th, td {
    min-width: 0;
    border: 1px solid #c7d8cc;
    padding: 6px 7px;
    text-align: left;
    font-size: 10px;
    line-height: 1.25;
    vertical-align: top;
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
    white-space: normal !important;
    hyphens: auto;
  }
  th { background: #eef4fb; font-weight: 700; }
  .empty { font-size: 11px; color: #5b6670; }
  .member-name, .expense-note { overflow-wrap: anywhere !important; word-break: break-word !important; }
  table.category th:first-child, table.category td:first-child { width: 70%; }
  table.member th:nth-child(1), table.member td:nth-child(1) { width: 30%; }
  table.member th:nth-child(2), table.member td:nth-child(2), table.member th:nth-child(3), table.member td:nth-child(3) { width: 20%; }
  table.member th:nth-child(4), table.member td:nth-child(4) { width: 30%; }
  table.settlement th:nth-child(1), table.settlement td:nth-child(1), table.settlement th:nth-child(2), table.settlement td:nth-child(2) { width: 28%; }
  table.settlement th:nth-child(3), table.settlement td:nth-child(3) { width: 22%; }
  table.settlement th:nth-child(4), table.settlement td:nth-child(4) { width: 22%; }
  table.expenses th:nth-child(1), table.expenses td:nth-child(1) { width: 12%; }
  table.expenses th:nth-child(2), table.expenses td:nth-child(2) { width: 22%; }
  table.expenses th:nth-child(3), table.expenses td:nth-child(3) { width: 16%; }
  table.expenses th:nth-child(4), table.expenses td:nth-child(4) { width: 16%; }
  table.expenses th:nth-child(5), table.expenses td:nth-child(5) { width: 12%; }
  table.expenses th:nth-child(6), table.expenses td:nth-child(6) { width: 22%; }
`;

/** Text wordmark for PDFs, using the logo's colours (Khar = blue, ch = green, a = orange). */
export const KHARCHA_PDF_TAGLINE = 'Split Smart Live Smart';
export const KHARCHA_PDF_WORDMARK_HTML = '<div class="brand-block"><div class="brand-wordmark" aria-label="Kharcha"><span class="wm-blue">Khar</span><span class="wm-green">ch</span><span class="wm-orange">a</span></div><div class="brand-tagline"><span class="wm-blue">Split Smart</span> <span class="wm-green">Live</span> <span class="wm-orange">Smart</span></div></div>';
