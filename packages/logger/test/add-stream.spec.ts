/*
 * Copyright (c) 2016 Trent Mick. All rights reserved.
 *
 * Test stream adding.
 */

import { Logger } from '../src/logger';
import { LoggerOptions } from '../src/types';
import { getPathFile } from './util';

describe(getPathFile(__filename), () => {
  it('non-writables passed as stream', () => {
    const things = ['process.stdout', {}];
    things.forEach(function (thing: any) {
      const regexp = new RegExp(/"stream" stream is not writable/);
      expect(() => new Logger({ name: 'foo', stream: thing })).toThrowError(regexp);
    });
  });

  it('proper stream', () => {
    const options: LoggerOptions = { name: 'foo', stream: process.stdout };
    expect(() => new Logger(options)).not.toThrow();
  });
});
