/*
 * Copyright (c) 2012 Trent Mick. All rights reserved.
 *
 * Test the `log.trace(...)`, `log.debug(...)`, ..., `log.fatal(...)` API.
 */

import { format } from 'util';

import { Logger } from '../src/logger';
import { getPathFile } from './util';
import { LogFields, LevelNames } from '../src/types';

// ---- test boolean `log.<level>()` calls

describe(getPathFile(__filename), () => {
  let log1: Logger;
  let log2: Logger;

  beforeEach(() => {
    log1 = new Logger({
      name: 'log1',
      streams: [
        {
          path: __dirname + '/log.spec.log1.log',
          level: 'info',
        },
      ],
    });

    log2 = new Logger({
      name: 'log2',
      streams: [
        {
          path: __dirname + '/log.spec.log2a.log',
          level: 'error',
        },
        {
          path: __dirname + '/log.spec.log2b.log',
          level: 'debug',
        },
      ],
    });
  });

  it('log.LEVEL() -> boolean', () => {
    expect(log1.trace()).toEqual(false);
    expect(log1.debug()).toEqual(false);
    expect(log1.info()).toEqual(true);
    expect(log1.warn()).toEqual(true);
    expect(log1.error()).toEqual(true);
    expect(log1.fatal()).toEqual(true);

    // Level is the *lowest* level of all streams.
    expect(log2.trace()).toEqual(false);
    expect(log2.debug()).toEqual(true);
    expect(log2.info()).toEqual(true);
    expect(log2.warn()).toEqual(true);
    expect(log2.error()).toEqual(true);
    expect(log2.fatal()).toEqual(true);
  });
});

describe(getPathFile(__filename), () => {
  // ---- test `log.<level>(...)` calls which various input types

  class Catcher {
    records: LogFields[] = [];

    write(record: LogFields) {
      this.records.push(record);
    }
  }

  const catcher = new Catcher();
  let log3: any;
  let names: LevelNames[];
  let fields: any;

  beforeAll(() => {
    log3 = new Logger({
      name: 'log3',
      streams: [
        {
          type: 'raw',
          stream: catcher,
          level: 'trace',
        },
      ],
    });

    names = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    fields = { one: 'un' };
  });

  it('log.info(undefined, <msg>)', () => {
    names.forEach(function (lvl) {
      log3[lvl].call(log3, undefined, 'some message');
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual(`undefined 'some message'`);
    });
  });

  it('log.info(<fields>, undefined)', () => {
    names.forEach(function (lvl) {
      log3[lvl].call(log3, fields, undefined);
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('undefined');
      expect(rec.one).toEqual('un');
    });
  });

  it('log.info(null, <msg>)', () => {
    names.forEach(function (lvl) {
      log3[lvl].call(log3, null, 'some message');
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('some message');
    });
  });

  it('log.info(<fields>, null)', () => {
    names.forEach(function (lvl) {
      log3[lvl].call(log3, fields, null);
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('null');
      expect(rec.one).toEqual('un');
    });
  });

  it('log.info(<str>)', () => {
    names.forEach(function (lvl) {
      log3[lvl].call(log3, 'some message');
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('some message');
    });
  });

  it('log.info(<fields>, <str>)', () => {
    names.forEach(function (lvl) {
      log3[lvl].call(log3, fields, 'some message');
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('some message');
      expect(rec.one).toEqual('un');
    });
  });

  it('log.info(<bool>)', () => {
    names.forEach(function (lvl) {
      log3[lvl].call(log3, true);
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('true');
    });
  });

  it('log.info(<fields>, <bool>)', () => {
    names.forEach(function (lvl) {
      log3[lvl].call(log3, fields, true);
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('true');
      expect(rec.one).toEqual('un');
    });
  });

  it('log.info(<num>)', () => {
    names.forEach(function (lvl) {
      log3[lvl].call(log3, 3.14);
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('3.14');
    });
  });

  it('log.info(<fields>, <num>)', () => {
    names.forEach(function (lvl) {
      log3[lvl].call(log3, fields, 3.14);
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('3.14');
      expect(rec.one).toEqual('un');
    });
  });

  it('log.info(<function>)', () => {
    const func = function func1() {};
    names.forEach(function (lvl) {
      log3[lvl].call(log3, func);
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('[Function: func1]');
    });
  });

  it('log.info(<fields>, <function>)', () => {
    const func = function func2() {};
    names.forEach(function (lvl) {
      log3[lvl].call(log3, fields, func);
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('[Function: func2]');
      expect(rec.one).toEqual('un');
    });
  });

  it('log.info(<array>)', () => {
    const arr = ['a', 1, { two: 'deux' }];
    names.forEach(function (lvl) {
      log3[lvl].call(log3, arr);
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual(format(arr));
    });
  });

  it('log.info(<fields>, <array>)', () => {
    const arr = ['a', 1, { two: 'deux' }];
    names.forEach(function (lvl) {
      log3[lvl].call(log3, fields, arr);
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual(format(arr));
      expect(rec.one).toEqual('un');
    });
  });

  /*
   * By accident (starting with trentm/node-bunyan#85 in bunyan@0.23.0),
   *      log.info(null, ...)
   * was interpreted as `null` being the object of fields. It is gracefully
   * handled, which is good. However, had I to do it again, I would have made
   * that interpret `null` as the *message*, and no fields having been passed.
   * I think it is baked now. It would take a major bunyan rev to change it,
   * but I don't think it is worth it: passing `null` as the first arg isn't
   * really an intended way to call these Bunyan methods for either case.
   */

  it('log.info(null)', () => {
    names.forEach(function (lvl) {
      log3[lvl].call(log3, null);
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('');
    });
  });

  it('log.info(null, <msg>)', () => {
    names.forEach(function (lvl) {
      log3[lvl].call(log3, null, 'my message');
      const rec = catcher.records[catcher.records.length - 1];
      expect(rec.msg).toEqual('my message');
    });
  });
});
