import { Logger } from '../src/logger';

const log = new Logger({ name: 'safe-json-stringify-1' });

const obj = <any>{};
obj.__defineGetter__('boom', function () { throw new Error('__defineGetter__ ouch!'); });
log.info({ obj: obj }, 'using __defineGetter__');
