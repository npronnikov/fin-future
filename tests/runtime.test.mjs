import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('.nvmrc satisfies the Node.js version required by package.json', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const nvmVersion = readFileSync(new URL('../.nvmrc', import.meta.url), 'utf8').trim();
  const requiredMajor = Number(packageJson.engines.node.match(/\d+/)?.[0]);
  const configuredMajor = Number(nvmVersion.match(/\d+/)?.[0]);

  assert.ok(Number.isInteger(requiredMajor), 'package.json must declare a minimum Node.js major version');
  assert.ok(Number.isInteger(configuredMajor), '.nvmrc must declare a Node.js major version');
  assert.ok(
    configuredMajor >= requiredMajor,
    `.nvmrc selects Node.js ${nvmVersion}, but package.json requires ${packageJson.engines.node}`,
  );
});
