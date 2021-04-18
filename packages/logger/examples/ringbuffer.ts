import { Logger } from '../src/logger';

/* Create a ring buffer that stores the last 100 records. */
const ringbuffer = new Logger.RingBuffer({ limit: 100 });
const log = new Logger({
  name: 'foo',
  streams: [
    {
      type: 'raw',
      stream: ringbuffer,
      level: 'debug'
    }
  ]
});

log.info('hello world');
console.log(ringbuffer.records);
