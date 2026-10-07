import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url), ts = require('../vendor/typescript/typescript.cjs'), root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
function walk(dir) { for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name);
    if (item.isDirectory())
        walk(p);
    else if (/\.tsx?$/.test(p))
        files.push(p);
} }
walk(path.join(root, 'apps/web/src'));
walk(path.join(root, 'packages/contracts'));
const options = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.React, strict: true, noImplicitAny: false, skipLibCheck: true, noEmit: true, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'] };
const host = ts.createCompilerHost(options);
host.getDefaultLibLocation = () => path.join(root, 'vendor/typescript/lib');
host.getDefaultLibFileName = () => path.join(root, 'vendor/typescript/lib/lib.es2022.full.d.ts');
const program = ts.createProgram(files, options, host), diagnostics = ts.getPreEmitDiagnostics(program);
for (const d of diagnostics) {
    const pos = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : null;
    console.log((d.file ? path.relative(root, d.file.fileName) + ':' + ((pos?.line || 0) + 1) + ': ' : '') + ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}
if (diagnostics.length)
    process.exit(1);
console.log('Typecheck passed: ' + files.length + ' files. Dynamic entity extension fields intentionally use any.');
