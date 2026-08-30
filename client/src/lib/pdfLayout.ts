export const PDF_LAYOUT_CSS = `
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { width: 100%; max-width: 100%; margin: 0; padding: 0; overflow-x: hidden; }
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
  .report-logo, header img {
    width: 112px;
    max-width: 30%;
    height: auto;
    object-fit: contain;
    flex: 0 0 auto;
  }
  .report-heading, header > div { min-width: 0; flex: 1; }
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
  table.expenses th:nth-child(1), table.expenses td:nth-child(1) { width: 16%; }
  table.expenses th:nth-child(2), table.expenses td:nth-child(2) { width: 30%; }
  table.expenses th:nth-child(3), table.expenses td:nth-child(3) { width: 20%; }
  table.expenses th:nth-child(4), table.expenses td:nth-child(4) { width: 20%; }
  table.expenses th:nth-child(5), table.expenses td:nth-child(5) { width: 14%; }
`;
