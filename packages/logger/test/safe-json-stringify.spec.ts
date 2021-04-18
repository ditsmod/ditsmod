/*
 * Copyright (c) 2015 Trent Mick. All rights reserved.
 *
 * If available, use `safe-json-stringfy` as a fallback stringifier.
 * This covers the case where an enumerable property throws an error
 * in its getter.
 *
 * See <https://github.com/trentm/node-bunyan/pull/182>
 */

import { exec } from 'child_process';
import { getPathFile } from './util';

describe(getPathFile(__filename), () => {
  it('__defineGetter__ boom', (done) => {
    const cmd = process.execPath + ' ' + __dirname + '/safe-json-stringify-1.js';
    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        done.fail(err);
      }
      const rec = JSON.parse(stdout.trim());
      expect(rec.obj.boom).toEqual('[Throws: __defineGetter__ ouch!]');
      done();
    });
  });

  it('defineProperty boom', (done) => {
    const cmd = process.execPath + ' ' + __dirname + '/safe-json-stringify-2.js';
    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        done.fail(err);
      }
      const recs = stdout.trim().split(/\n/g);
      expect(recs.length).toEqual(2);
      const rec = JSON.parse(recs[0]);
      expect(rec.obj.boom).toEqual('[Throws: defineProperty ouch!]');
      done();
    });
  });
});
