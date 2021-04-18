// Show the usage of `src: true` config option to get log call source info in
// log records (the `src` field).

import { Logger } from '../src/logger';

const log = new Logger({ name: 'src-example', src: true });

log.info('one');
log.info('two');
function doSomeFoo() {
  log.info({ foo: 'bar' }, 'three');
}
doSomeFoo();

class Wuzzle {
  log: any;
  constructor(options) {
    this.log = options.log;
    this.log.info('creating a wuzzle');
  }

  woos() {
    this.log.warn('This wuzzle is woosey.');
  }
}

const wuzzle = new Wuzzle({ log: log.child({ component: 'wuzzle' }) });
wuzzle.woos();
log.info('done with the wuzzle');
