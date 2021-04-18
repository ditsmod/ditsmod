/*
 * Copyright (c) 2015 Trent Mick.
 *
 * Test `src: true` usage.
 */

import { Logger } from '../src/logger';
import { LogFields } from '../src/types';
import { getPathFile } from './util';

// Intentionally on line 8 for tests below:
function logSomething(log: Logger) { log.info('something'); }

class CapturingStream {
  constructor(public recs: LogFields[]) { }

  write(rec: LogFields) {
    this.recs.push(rec);
  }
}

describe(getPathFile(__filename), () => {
  it('src', () => {
    const records: LogFields[] = [];

    const log = new Logger({
      name: 'src-test',
      src: true,
      streams: [
        {
          stream: new CapturingStream(records),
          type: 'raw'
        }
      ]
    });

    log.info('top-level');
    logSomething(log);

    expect(records.length).toEqual(2);
    records.forEach(function (rec: LogFields) {
      expect(rec.src).toBeTruthy();
      expect(typeof (rec.src)).toEqual('object');
      expect(rec.src.file).toEqual(__filename);
      expect(rec.src.line).toBeTruthy();
      expect(typeof (rec.src.line)).toEqual('number');
    });
    const rec = records[1];
    expect(rec.src.func).toBeTruthy();
    expect(rec.src.func).toEqual('logSomething');
    expect(rec.src.line).toEqual(10);
  });
});
