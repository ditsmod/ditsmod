
// A helper script to log a few times. We attempt to NOT emit
// to stdout or stderr because this is used for dtrace testing
// and we don't want to mix output.

import { Logger } from '../src/logger';

const log = new Logger({
  name: 'play',
  serializers: Logger.stdSerializers
});

log.debug({ foo: 'bar' }, 'hi at debug');
log.trace('hi at trace');
