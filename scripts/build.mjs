import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url), ts = require('../vendor/typescript/typescript.cjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), source = path.join(root, 'apps/web/src'), out = path.join(root, 'dist/web');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
let count = 0;
const bundle = [];
function walk(dir) { for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) {
        walk(file);
        continue;
    }
    const relative = path.relative(source, file);
    if (/\.tsx?$/.test(file) && !file.endsWith('.d.ts')) {
        const target = path.join(out, relative.replace(/\.tsx?$/, '.js'));
        fs.mkdirSync(path.dirname(target), { recursive: true });
        const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, removeComments: false } });
        const errors = result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error);
        if (errors?.length)
            throw new Error(errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
        fs.writeFileSync(target, result.outputText);
        const cjs = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText;
        bundle.push(JSON.stringify(relative.replace(/\.tsx?$/, '.js').split(path.sep).join('/')) + ':function(require,module,exports){\n' + cjs + '\n}');
        count++;
    }
    else if (file.endsWith('.css')) {
        fs.copyFileSync(file, path.join(out, relative));
    }
} }
walk(source);
fs.writeFileSync(path.join(out, 'app.bundle.js'), '(function(){\nconst modules={' + bundle.join(',\n') + '},cache={};function resolve(from,name){const parts=(from.slice(0,from.lastIndexOf(\'/\')+1)+name).split(\'/\'),out=[];for(const part of parts){if(part===\'..\')out.pop();else if(part!==\'.\'&&part)out.push(part);}return out.join(\'/\');}function load(id){if(cache[id])return cache[id].exports;if(!modules[id])throw Error(\'Unknown module \'+id);const module=cache[id]={exports:{}};modules[id](name=>load(resolve(id,name)),module,module.exports);return module.exports;}load(\'app/App.js\');})();');
fs.mkdirSync(path.join(out, 'vendor'), { recursive: true });
for (const name of ['react.production.min.js', 'react-dom.production.min.js'])
    fs.copyFileSync(path.join(root, 'vendor/react', name), path.join(out, 'vendor', name));
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#1c3c31"><meta name="color-scheme" content="light"><title>КОНТУР · Team Space</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='10' fill='%23244e3b'/%3E%3Cpath d='M12 8v24M28 8 16 20l12 12' stroke='%23d8eba9' stroke-width='5' fill='none'/%3E%3C/svg%3E"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><noscript>Для приложения нужен JavaScript.</noscript><script src="/vendor/react.production.min.js"></script><script src="/vendor/react-dom.production.min.js"></script><script src="/app.bundle.js"></script></body></html>`);
const runtime = path.join(root, 'dist/runtime');
fs.rmSync(runtime, { recursive: true, force: true });
fs.mkdirSync(path.join(runtime, 'apps/server'), { recursive: true });
fs.cpSync(path.join(root, 'apps/server/src'), path.join(runtime, 'apps/server/src'), { recursive: true });
fs.mkdirSync(path.join(runtime, 'packages'), { recursive: true });
fs.cpSync(path.join(root, 'packages/contracts'), path.join(runtime, 'packages/contracts'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/server.mjs'), `import {createApp} from './runtime/apps/server/src/http/server.mjs';\nimport {fileURLToPath} from 'node:url';\nconst app=createApp({dataDir:process.env.DATA_DIR||fileURLToPath(new URL('../data',import.meta.url)),webDir:fileURLToPath(new URL('./web',import.meta.url))});\nconst host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||4310);\napp.server.listen(port,host,()=>console.log(\
\
\
\
'КОНТУР Team Space → http://'+host+':'+port+' · mock runtime · Node '+process.version));\nlet closing=false;for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{if(closing)return;closing=true;app.close().then(()=>process.exit(0));});\n`);
console.log('Built ' + count + ' TypeScript modules; vendored React 16.0.0 / ReactDOM 16.0.1; standalone server; no runtime npm dependencies.');
