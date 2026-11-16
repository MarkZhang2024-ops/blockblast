import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tscCandidates = [
  path.join(root, 'node_modules/typescript/bin/tsc'),
  'C:/ProgramData/cocos/editors/Creator/3.8.8/resources/resources/3d/engine/node_modules/typescript/bin/tsc',
  'C:/ProgramData/cocos/editors/Creator/3.8.4/resources/resources/3d/engine/node_modules/typescript/bin/tsc',
];
const tsc = tscCandidates.find((candidate) => existsSync(candidate));
if (!tsc) {
  console.error('找不到 typescript。请安装依赖，或使用本机的 Cocos Creator 3.8。');
  process.exit(1);
}

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run([tsc, '-p', 'tsconfig.tests.json']);
run([
  '--test',
  'temp/tests-out/tests/board.test.js',
  'temp/tests-out/tests/lookahead.test.js',
  'temp/tests-out/tests/fairness.test.js',
  'temp/tests-out/tests/session.test.js',
]);
run([tsc, '-p', 'tsconfig.ui.json']);
console.log('tests and typecheck passed');
