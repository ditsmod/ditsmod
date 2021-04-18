/*
 * Test the RingBuffer output stream.
 */

import { Logger } from '../src/logger';
import { getPathFile } from './util';
import { RingBuffer } from '../src/ring-buffer';

describe(getPathFile(__filename), () => {
  let ringBuffer: RingBuffer;
  let log1: Logger;

  beforeAll(() => {
    ringBuffer = new Logger.RingBuffer({ limit: 5 });
    log1 = new Logger({
      name: 'log1',
      streams: [
        {
          stream: ringBuffer,
          type: 'raw',
          level: 'info'
        }
      ]
    });
  });
  it('ringbuffer', () => {
    log1.info('hello');
    log1.trace('there');
    log1.error('android');
    expect(ringBuffer.records.length).toEqual(2);
    expect(ringBuffer.records[0]['msg']).toEqual('hello');
    expect(ringBuffer.records[1]['msg']).toEqual('android');
    log1.error('one');
    log1.error('two');
    log1.error('three');
    expect(ringBuffer.records.length).toEqual(5);
    log1.error('four');
    expect(ringBuffer.records.length).toEqual(5);
    expect(ringBuffer.records[0]['msg']).toEqual('android');
    expect(ringBuffer.records[1]['msg']).toEqual('one');
    expect(ringBuffer.records[2]['msg']).toEqual('two');
    expect(ringBuffer.records[3]['msg']).toEqual('three');
    expect(ringBuffer.records[4]['msg']).toEqual('four');
  });
});
