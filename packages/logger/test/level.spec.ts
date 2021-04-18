/*
 * Copyright (c) 2014 Trent Mick. All rights reserved.
 *
 * Test the `log.level(...)`.
 */

import { Logger } from '../src/logger';
import { getPathFile } from './util';
import { Level } from '../src';

// tslint:disable
describe(getPathFile(__filename), () => {
  let log1: Logger;

  beforeEach(() => {
    log1 = new Logger({
      name: 'log1',
      streams: [
        {
          path: __dirname + '/level.spec.log1.log',
          level: 'info'
        }
      ]
    });
  });

  it('log.level() -> level num', () => {
    expect(log1.level()).toEqual(Level.info);
  });

  it('log.level(<const>)', () => {
    log1.level(Level.debug);
    expect(log1.level()).toEqual(Level.debug);
  });

  it('log.level(<num>)', () => {
    log1.level(10);
    expect(log1.level()).toEqual(Level.trace);
  });

  it('log.level(<name>)', () => {
    log1.level('error');
    expect(log1.level()).toEqual(Level.error);
  });

  // A trick to turn logging off.
  // See <https://github.com/trentm/node-bunyan/pull/148#issuecomment-53232979>.
  it('log.level(FATAL + 1)', () => {
    log1.level(Level.fatal + 1);
    expect(log1.level()).toEqual(Level.fatal + 1);
  });

  it('log.level(<weird numbers>)', () => {
    log1.level(0);
    expect(log1.level()).toEqual(0);
    log1.level(Number.MAX_VALUE);
    expect(log1.level()).toEqual(Number.MAX_VALUE);
    log1.level(Infinity);
    expect(log1.level()).toEqual(Infinity);
  });

  it('log.level(<invalid values>)', () => {
    expect(function () {
      new Logger(<any>{ name: 'invalid', level: 'booga' });
    }).toThrowError('unknown level name: "booga"');

    expect(function () {
      new Logger(<any>{ name: 'invalid', level: [] });
    }).toThrowError('cannot resolve level: invalid arg (object): []');

    expect(function () {
      new Logger(<any>{ name: 'invalid', level: true });
    }).toThrowError('cannot resolve level: invalid arg (boolean): true');

    expect(function () {
      new Logger({ name: 'invalid', level: -1 });
    }).toThrowError('level is not a positive integer: -1');

    expect(function () {
      new Logger({ name: 'invalid', level: 3.14 });
    }).toThrowError('level is not a positive integer: 3.14');

    expect(function () {
      new Logger({ name: 'invalid', level: -Infinity });
    }).toThrowError('level is not a positive integer: -Infinity');
  });
});
