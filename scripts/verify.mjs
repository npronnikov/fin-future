import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = path.join(root, 'CHECKSUMS.sha256');
if (!fs.existsSync(manifest)) {
    console.error('CHECKSUMS.sha256 not found');
    process.exit(1);
}
let checked = 0;
const failures = [];
for (const line of fs.readFileSync(manifest, 'utf8').trim().split('\n')) {
    const m = line.match(/^([0-9a-f]{64})  (.+)$/);
    if (!m) {
        failures.push('Malformed checksum line');
        continue;
    }
    const full = path.resolve(root, m[2]);
    if (!full.startsWith(root + path.sep)) {
        failures.push('Unsafe path: ' + m[2]);
        continue;
    }
    try {
        const actual = createHash('sha256').update(fs.readFileSync(full)).digest('hex');
        if (actual !== m[1])
            failures.push('Mismatch: ' + m[2]);
        else
            checked++;
    }
    catch (e) {
        failures.push('Missing/unreadable: ' + m[2]);
    }
}
console.log(JSON.stringify({ checked, failures }, null, 2));
if (failures.length)
    process.exitCode = 1;
