const chokidar = require('chokidar');
const path = require('path');
const { exec } = require('child_process');

const watchFile = path.resolve(process.cwd(), 'faculdades.runtime.json');
const applyCmd = `node "${path.resolve(
  process.cwd(),
  'tools',
  'apply-runtime.js'
)}" "${watchFile}"`;

console.log('Watching', watchFile, 'for changes. Will run:', applyCmd);

const watcher = chokidar.watch(watchFile, { ignoreInitial: false });
watcher.on('add', (p) => {
  console.log('Detected file add:', p);
  exec(applyCmd, (err, stdout, stderr) => {
    if (err) console.error('apply-runtime error', err);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  });
});

watcher.on('change', (p) => {
  console.log('Detected file change:', p);
  exec(applyCmd, (err, stdout, stderr) => {
    if (err) console.error('apply-runtime error', err);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  });
});

watcher.on('error', (e) => console.error('Watcher error', e));
