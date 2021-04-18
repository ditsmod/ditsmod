// Example handling an fs error for a Bunyan-created
// stream: we create a logger to a file that is read-only.

import { existsSync, statSync, writeFileSync, chmodSync } from 'fs';

import { Logger } from '../src/logger';

const FILENAME = __dirname + '/handle-fs-error.log';
const S_IWUSR = 0o200; // mask for owner write permission in stat mode

console.warn('- Log file is "%s".', FILENAME);

if (!existsSync(FILENAME)) {
  console.warn('- Touch log file.');
  writeFileSync(FILENAME, 'touch\n');
}

// tslint:disable-next-line:no-bitwise
if (statSync(FILENAME).mode & S_IWUSR) {
  console.warn('- Make log file read-only.');
  chmodSync(FILENAME, 0o444);
}

console.warn('- Create logger.');

const log = new Logger({
  name: 'handle-fs-error',
  streams: [{ path: FILENAME }]
});

log.on('error', err => {
  console.warn('- The logger emitted an error:', err);
});

console.warn('- Call log.info(...).');
log.info('info log message');
console.warn('- Called log.info(...).');

setTimeout(() => {
  console.warn('- Call log.warn(...).');
  log.warn('warn log message');
  console.warn('- Called log.warn(...).');
}, 1000);
