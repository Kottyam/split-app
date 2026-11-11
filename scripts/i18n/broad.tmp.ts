import ts from 'typescript'; import fs from 'fs'; import path from 'path';
const files: string[] = [];
const walk = (d: string) => { for (const f of fs.readdirSync(d)) { const p = path.join(d,f); if (fs.statSync(p).isDirectory()) { if (f !== 'ui') walk(p); } else if (/\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !/contexts\/|ComponentShowcase|DashboardLayout|AIChatBox|Map\.tsx|helpGuideContent|categoryTranslations/.test(p)) files.push(p); } };
walk('client/src');
for (const f of files) {
  const sf = ts.createSourceFile(f, fs.readFileSync(f,'utf8'), ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (n: ts.Node) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
      const text = (n as any).text as string;
      let c: ts.Node | undefined = n.parent, skip = false;
      while (c) { if (ts.isImportDeclaration(c) || ts.isExportDeclaration(c)) { skip = true; break; } if (ts.isCallExpression(c) && /^(t|translate|console\.\w+|Error|new Error|localStorage\.\w+|querySelector|getElementById|addEventListener|removeEventListener|dispatchEvent|require)$/.test(c.expression.getText())) { skip = true; break; } if (ts.isJsxAttribute(c) && /^(className|data-testid|id|key|href|type|style)$/.test(c.name.getText())) { skip = true; break; } if (ts.isNewExpression(c) && /Error/.test(c.expression.getText())) { skip = true; break; } c = c.parent; }
      if (!skip && /[A-Za-z]{2,} [A-Za-z]{2,}/.test(text) && !/(^|\s)(flex|grid|text-|bg-|px-|py-|rounded|border|font-|items-|justify-|gap-|shadow|w-|h-|min-|max-|hover:|mt-|mb-|ml-|mr-)/.test(text)) {
        console.log(`${f.replace('client/src/','')}:${sf.getLineAndCharacterOfPosition(n.getStart()).line+1}: ${text.replace(/\s+/g,' ').slice(0,140)}`);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
