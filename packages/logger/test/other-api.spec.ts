/*
 * Copyright (c) 2012 Trent Mick. All rights reserved.
 *
 * Test other parts of the exported API.
 */

import { Logger } from '../src/logger';
import { getPathFile } from './util';
import { Level } from '../src';

describe(getPathFile(__filename), () => {
  it('<LEVEL>s', () => {
    expect(Level.trace).toBeTruthy();
    expect(Level.debug).toBeTruthy();
    expect(Level.info).toBeTruthy();
    expect(Level.warn).toBeTruthy();
    expect(Level.error).toBeTruthy();
    expect(Level.fatal).toBeTruthy();
  });

  it('resolveLevel()', () => {
    expect(Logger.resolveLevel('trace')).toEqual(Level.trace);
    expect(Logger.resolveLevel('debug')).toEqual(Level.debug);
    expect(Logger.resolveLevel('info')).toEqual(Level.info);
    expect(Logger.resolveLevel('warn')).toEqual(Level.warn);
    expect(Logger.resolveLevel('error')).toEqual(Level.error);
    expect(Logger.resolveLevel('fatal')).toEqual(Level.fatal);
  });
});
