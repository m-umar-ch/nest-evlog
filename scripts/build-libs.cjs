const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const tsc = path.join(
  root,
  'node_modules',
  'typescript',
  'bin',
  'tsc',
);

for (const lib of ['queues', 'job-logging']) {
  const dir = path.join(root, 'libs', lib);
  execSync(`node "${tsc}" -p tsconfig.json`, { cwd: dir, stdio: 'inherit' });
}
