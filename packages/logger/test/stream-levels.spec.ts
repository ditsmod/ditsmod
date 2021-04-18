/*
 * Copyright (c) 2015 Trent Mick. All rights reserved.
 *
 * Test that streams (the various way they can be added to
 * a Logger instance) get the appropriate level.
 */

import { Logger } from '../src/logger';
import { getPathFile } from './util';
import { Level } from '../src';

describe(getPathFile(__filename), () => {
  let log1: Logger;

  beforeAll(() => {
    log1 = new Logger({
      name: 'log1',
      streams: [
        {
          path: __dirname + '/level.test.log1.log',
          level: 'info',
        },
      ],
    });
  });
  it('default stream log level', () => {
    const log = new Logger({
      name: 'foo',
    });
    expect(log.level()).toEqual(Level.info);
    expect(log.streams[0].level).toEqual(Level.info);
  });

  it('default stream, level=DEBUG specified', () => {
    const log = new Logger({
      name: 'foo',
      level: Level.debug,
    });
    expect(log.level()).toEqual(Level.debug);
    expect(log.streams[0].level).toEqual(Level.debug);
  });

  it('default stream, level="trace" specified', () => {
    const log = new Logger({
      name: 'foo',
      level: 'trace',
    });
    expect(log.level()).toEqual(Level.trace);
    expect(log.streams[0].level).toEqual(Level.trace);
  });

  it('stream & level="trace" specified', () => {
    const log = new Logger({
      name: 'foo',
      stream: process.stderr,
      level: 'trace',
    });
    expect(log.level()).toEqual(Level.trace);
    expect(log.streams[0].level).toEqual(Level.trace);
  });

  it('one stream, default level', () => {
    const log = new Logger({
      name: 'foo',
      streams: [
        {
          stream: process.stderr,
        },
      ],
    });
    expect(log.level()).toEqual(Level.info);
    expect(log.streams[0].level).toEqual(Level.info);
  });

  it('one stream, top-"level" specified', () => {
    const log = new Logger({
      name: 'foo',
      level: 'error',
      streams: [
        {
          stream: process.stderr,
        },
      ],
    });
    expect(log.level()).toEqual(Level.error);
    expect(log.streams[0].level).toEqual(Level.error);
  });

  it('one stream, stream-"level" specified', () => {
    const log = new Logger({
      name: 'foo',
      streams: [
        {
          stream: process.stderr,
          level: 'error',
        },
      ],
    });
    expect(log.level()).toEqual(Level.error);
    expect(log.streams[0].level).toEqual(Level.error);
  });

  it('one stream, both-"level" specified', () => {
    const log = new Logger({
      name: 'foo',
      level: 'debug',
      streams: [
        {
          stream: process.stderr,
          level: 'error',
        },
      ],
    });
    expect(log.level()).toEqual(Level.error);
    expect(log.streams[0].level).toEqual(Level.error);
  });

  it('two streams, both-"level" specified', () => {
    const log = new Logger({
      name: 'foo',
      level: 'debug',
      streams: [
        {
          stream: process.stdout,
          level: 'trace',
        },
        {
          stream: process.stderr,
          level: 'fatal',
        },
      ],
    });
    expect(log.level()).toEqual(Level.trace);
    expect(log.streams[0].level).toEqual(Level.trace);
    expect(log.streams[1].level).toEqual(Level.fatal);
  });

  it('two streams, one with "level" specified', () => {
    const log = new Logger({
      name: 'foo',
      streams: [
        {
          stream: process.stdout,
        },
        {
          stream: process.stderr,
          level: 'fatal',
        },
      ],
    });
    expect(log.level()).toEqual(Level.info);
    expect(log.streams[0].level).toEqual(Level.info);
    expect(log.streams[1].level).toEqual(Level.fatal);
  });

  // Issue #335
  it('log level 0 to turn on all logging', () => {
    const log = new Logger({
      name: 'foo',
      level: 0,
    });
    expect(log.level()).toEqual(0);
    expect(log.streams[0].level).toEqual(0);
  });
});
