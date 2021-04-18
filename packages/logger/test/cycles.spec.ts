/*
 * Copyright (c) 2012 Trent Mick. All rights reserved.
 *
 * Make sure cycles are safe.
 */

import { Writable } from 'stream';

import { Logger } from '../src/logger';
import { Obj, LogFields } from '../src/types';
import { getPathFile } from './util';

describe(getPathFile(__filename), () => {
  let writable: Writable;
  let outputArr: Obj[];
  let log: Logger;
  let expectData: LogFields[];

  beforeAll(() => {
    writable = new Writable();
    // writable.writable = true;
    outputArr = [];

    writable.write = (c: Obj) => {
      outputArr.push(JSON.parse(`${c}`));
      return true;
    };

    writable.end = function (c: Obj) {
      if (c) {
        this.write(c);
      }
      this.emit('end');
    };

    // these are lacking a few fields that will probably never match
    expectData = [
      {
        name: 'blammo',
        level: 30,
        msg: `bango { bang: 'boom', KABOOM: [Circular] }`,
      },
      {
        name: 'blammo',
        level: 30,
        msg: `kaboom { bang: 'boom', KABOOM: [Circular] }`,
      },
      {
        name: 'blammo',
        level: 30,
        bang: 'boom',
        KABOOM: {
          bang: 'boom',
          KABOOM: '[Circular]',
        },
        msg: '',
      },
    ];

    log = new Logger({
      name: 'blammo',
      streams: [
        {
          type: 'stream',
          level: 'info',
          stream: writable,
        },
      ],
    });
  });

  it('cycles', () => {
    writable.on('end', () => {
      outputArr.forEach((o, i) => {
        // Drop variable parts for comparison.
        delete o.hostname;
        delete o.pid;
        delete o.time;
        // Hack object/dict comparison: JSONify.
        expect(JSON.stringify(o)).toEqual(JSON.stringify(expectData[i]));
      });
    });

    const obj: Obj = { bang: 'boom' };
    obj.KABOOM = obj;
    log.info('bango', obj);
    log.info('kaboom', obj.KABOOM);
    log.info(obj);
    writable.end();
  });
});
