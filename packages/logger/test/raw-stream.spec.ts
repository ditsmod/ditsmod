/*
 * Copyright (c) 2012 Trent Mick. All rights reserved.
 *
 * Test `type: 'raw'` Logger streams.
 */

import { format } from 'util';

import { Logger } from '../src/logger';
import { LogFields } from '../src/types';
import { getPathFile } from './util';

class CapturingStream {
  constructor(public recs: LogFields[]) {}

  write(rec: LogFields) {
    this.recs.push(rec);
  }
}

describe(getPathFile(__filename), () => {
  it('raw stream', () => {
    const recs: LogFields[] = [];

    const log = new Logger({
      name: 'raw-stream-test',
      streams: [
        {
          stream: new CapturingStream(recs),
          type: 'raw',
        },
      ],
    });

    log.info('first');
    log.info({ two: 'deux' }, 'second');

    expect(recs.length).toEqual(2);
    expect(typeof recs[0]).toEqual('object');
    expect(recs[1].two).toEqual('deux');
  });

  it('raw streams and regular streams can mix', () => {
    const rawRecs: LogFields[] = [];
    const nonRawRecs: LogFields[] = [];

    const log = new Logger({
      name: 'raw-stream-test',
      streams: [
        {
          stream: new CapturingStream(rawRecs),
          type: 'raw',
        },
        {
          stream: new CapturingStream(nonRawRecs),
        },
      ],
    });

    log.info('first');
    log.info({ two: 'deux' }, 'second');

    expect(rawRecs.length).toEqual(2);
    expect(typeof rawRecs[0]).toEqual('object');
    expect(rawRecs[1].two).toEqual('deux');

    expect(nonRawRecs.length).toEqual(2);
    expect(typeof nonRawRecs[0]).toEqual('string');
  });

  it('child adding a non-raw stream works', () => {
    const parentRawRecs: LogFields[] = [];
    const rawRecs: LogFields[] = [];
    const nonRawRecs: LogFields[] = [];

    const logParent = new Logger({
      name: 'raw-stream-test',
      streams: [
        {
          stream: new CapturingStream(parentRawRecs),
          type: 'raw',
        },
      ],
    });

    const logChild = logParent.child({
      child: true,
      streams: [
        {
          stream: new CapturingStream(rawRecs),
          type: 'raw',
        },
        {
          stream: new CapturingStream(nonRawRecs),
        },
      ],
    });

    logParent.info('first');
    logChild.info({ two: 'deux' }, 'second');

    expect(rawRecs.length).toEqual(1);
    expect(typeof rawRecs[0]).toEqual('object');
    expect(rawRecs[0].two).toEqual('deux');
    expect(nonRawRecs.length).toEqual(1);
    expect(typeof nonRawRecs[0]).toEqual('string');
  });
});
