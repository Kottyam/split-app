import ts from 'typescript'; import fs from 'fs'; import path from 'path';

/** AST scan for user-visible English that bypasses t(). Returns `file:line:kind: text` hits. */
export function scanHardcodedStrings(root = 'client/src'): string[] {
const files: string[] = [];
const walk = (d: string) => { for (const f of fs.readdirSync(d)) { const p = path.join(d,f); if (fs.statSync(p).isDirectory()) { if (f !== 'ui') walk(p); } else if (/\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !/contexts\/(language|LanguageContext|translationDictionary)/.test(p)) files.push(p); } };
walk(root);
const ATTRS = new Set(['placeholder','title','aria-label','alt','label','description','tooltip']);
const hits: string[] = [];
const ALLOW = new Set(['UPI', 'Cash', 'PDF', 'QR', 'Kharcha', 'English', 'OK', 'ID', 'en-IN']);
const PROPS = new Set(['label','title','description','message','text','heading','placeholder','subtitle','hint','empty','emptyText','confirmText','cancelText','helper','helperText','tooltip','name']);
const NON_PROSE_ATTRS = new Set(['className','href','src','type','id','key','variant','size','to','value','name','role','htmlFor','inputMode','autoComplete','accept','pattern','mode','side','align','orientation','data-testid','target','rel','method','lang','dir','style','fill','stroke','d','viewBox','xmlns','strokeWidth','strokeLinecap','strokeLinejoin','defaultValue','tabIndex','form','capture','loading','decoding','referrerPolicy','download']);
const looksLikeProse = (t: string) => !/^[a-z]{2}(-[A-Z]{2})?$/.test(t) && !ALLOW.has(t.trim()) && /[A-Za-z]{2,}/.test(t) && !/^[a-z0-9_.:/#@?=&%-]+$/.test(t) && !/^(https?:|upi:|mailto:|tel:|data:|\/|\.|#)/.test(t) && !/^[a-z]+([A-Z][a-z0-9]*)+$/.test(t) && !/(^|\s)(flex|grid|text-|bg-|px-|py-|p-|m-|w-|h-|rounded|border|gap-|items-|justify-|font-|shadow|hidden|inline|block|space-)/.test(t);
const insideJsxExpr = (n: ts.Node): boolean => { let c: ts.Node | undefined = n.parent; while (c) { if (ts.isCallExpression(c) && !/^(toast(\.\w+)?|alert|window\.alert|confirm|window\.confirm)$/.test(c.expression.getText())) return false; if (ts.isJsxAttribute(c)) return !NON_PROSE_ATTRS.has(c.name.getText()); if (ts.isJsxExpression(c)) return true; if (ts.isBinaryExpression(c) && /^(===|!==|==|!=)$/.test(c.operatorToken.getText())) return false; if (ts.isElementAccessExpression(c) || ts.isSwitchStatement(c) || ts.isCaseClause(c) || ts.isImportDeclaration(c) || ts.isFunctionLike(c) && !ts.isArrowFunction(c)) return false; c = c.parent; } return false; };
for (const f of files) {
  const sf = ts.createSourceFile(f, fs.readFileSync(f,'utf8'), ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const rep = (n: ts.Node, kind: string, text: string) => { const t = text.replace(/\s+/g,' ').trim(); if (/[A-Za-z]{2,}/.test(t) && !ALLOW.has(t) && !/\bt\(/.test(t)) hits.push(`${f}:${sf.getLineAndCharacterOfPosition(n.getStart()).line+1}:${kind}: ${t.slice(0,160)}`); };
  const visit = (n: ts.Node) => {
    if (ts.isJsxText(n)) rep(n,'jsx',n.text);
    else if (ts.isJsxAttribute(n) && n.initializer && ts.isStringLiteral(n.initializer) && ATTRS.has(n.name.getText())) rep(n,'attr:'+n.name.getText(), n.initializer.text);
    else if (ts.isJsxExpression(n) && n.expression && (ts.isStringLiteral(n.expression) || ts.isNoSubstitutionTemplateLiteral(n.expression)) && !ts.isJsxAttribute(n.parent)) rep(n,'jsxexpr',n.expression.text);
    else if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && insideJsxExpr(n) && looksLikeProse(n.text)) rep(n,'expr',n.text);
    else if (ts.isPropertyAssignment(n) && PROPS.has(n.name.getText().replace(/['"]/g,'')) && (ts.isStringLiteral(n.initializer) || ts.isNoSubstitutionTemplateLiteral(n.initializer)) && looksLikeProse(n.initializer.text)) rep(n,'prop:'+n.name.getText(),n.initializer.text);
    else if (ts.isCallExpression(n)) {
      const callee = n.expression.getText();
      if (/^(toast(\.\w+)?|alert|window\.alert|confirm|window\.confirm|prompt|window\.prompt)$/.test(callee)) for (const a of n.arguments) if (ts.isStringLiteral(a) || ts.isTemplateExpression(a) || ts.isNoSubstitutionTemplateLiteral(a)) rep(a,'call:'+callee,a.getText());
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
  return hits;
}
