/*
 * Copyright (c) 2012 Trent Mick. All rights reserved.
 * Copyright (c) 2012 Joyent Inc. All rights reserved.
 *
 * Test logging with (accidental) usage of buffers.
 */

import { inspect, format } from 'util';

import { Logger } from '../src/logger';
import { LevelNames, LogFields } from '../src/types';
import { getPathFile } from './util';

class Catcher {
  records: LogFields[] = [];

  write(record: LogFields) {
    this.records.push(record);
  }
}

describe(getPathFile(__filename), () => {
  let catcher: Catcher;
  let log: Logger;

  beforeAll(() => {
    catcher = new Catcher();
    log = new Logger({
      name: 'buffer.test',
      streams: [
        {
          type: 'raw',
          stream: catcher,
          level: 'trace',
        },
      ],
    });
  });

  it('log.info(BUFFER)', (done) => {
    const buffer = Buffer.from('foo');

    const levels: LevelNames[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

    levels.forEach((level) => {
      log[level].call(log, buffer);
      let rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual(inspect(buffer));
      expect(rec['0'] === undefined).toEqual(true);
      expect(rec.parent === undefined).toEqual(true);

      log[level].call(log, buffer, 'bar');
      rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual(inspect(buffer) + ' bar');
    });
    done();
  });
});
