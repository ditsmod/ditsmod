import { Logger } from '../src/logger';

const log = new Logger({ name: 'safe-json-stringify-2' });

// And using `Object.defineProperty`.
const obj = {};
Object.defineProperty(obj, 'boom', {
  get: function () { throw new Error('defineProperty ouch!'); },
  enumerable: true // enumerable is false by default
});
// Twice to test the 'warnKey' usage.
for (let i = 0; i < 2; i++) {
  log.info({ obj: obj }, 'using defineProperty');
}
