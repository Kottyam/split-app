import ts from 'typescript'; import fs from 'fs';
const unused = new Set<string>(JSON.parse(fs.readFileSync('/workspace/i18n-tools/unused.json','utf8')));
const targets: Record<string, (name: string) => boolean> = {
  'client/src/contexts/LanguageContext.tsx': n => n === 'english' || n === 'translations',
  'client/src/contexts/languageAudit.ts': n => n === 'auditEnglishSources',
  'client/src/contexts/languageExtras.ts': () => true,
};
let removed = 0;
for (const [file, accept] of Object.entries(targets)) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const spans: Array<[number, number]> = [];
  const del = (node: ts.Node, list: ts.NodeArray<ts.Node>) => {
    const i = list.indexOf(node); let start = node.getFullStart(); let end = node.getEnd();
    // swallow trailing comma
    const after = text.slice(end); const m = after.match(/^\s*,/); if (m) end += m[0].length;
    spans.push([start, end]);
  };
  const visitObj = (o: ts.ObjectLiteralExpression) => {
    for (const p of o.properties) {
      if (ts.isPropertyAssignment(p)) {
        const name = p.name.getText().replace(/['"]/g, '');
        if (ts.isObjectLiteralExpression(p.initializer)) visitObj(p.initializer);
        else if (unused.has(name)) del(p, o.properties);
      }
    }
  };
  const visit = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) && n.initializer && ts.isObjectLiteralExpression(n.initializer) && accept(n.name.getText())) visitObj(n.initializer);
    if (file.endsWith('LanguageContext.tsx') && ts.isTypeAliasDeclaration(n) && n.name.text === 'TranslationKey' && ts.isUnionTypeNode(n.type)) {
      for (const tnode of n.type.types) if (ts.isLiteralTypeNode(tnode) && ts.isStringLiteral(tnode.literal) && unused.has(tnode.literal.text)) {
        // remove "\n  | 'key'"
        const s = tnode.getFullStart(); const before = text.slice(0, s); const bar = before.lastIndexOf('|');
        spans.push([bar, tnode.getEnd()]);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  spans.sort((a, b) => b[0] - a[0]);
  let out = text; for (const [s, e] of spans) out = out.slice(0, s) + out.slice(e);
  fs.writeFileSync(file, out); removed += spans.length; console.log(file, spans.length);
}
