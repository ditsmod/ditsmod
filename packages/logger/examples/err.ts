// Example logging an error:

import { Logger } from '../src/logger';

const log = new Logger({
  name: 'myserver',
  serializers: {
    err: Logger.stdSerializers.err // <--- use this
  }
});

try {
  throw new TypeError('boom');
} catch (err) {
  log.warn({ err }, 'operation went boom: %s', err); // <--- here
}

log.info(new TypeError('how about this?')); // <--- alternatively this

try {
  throw new Error('boom string');
} catch (err) {
  log.error(err);
}
