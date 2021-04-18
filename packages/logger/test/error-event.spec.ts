/*
 * Copyright 2016 Trent Mick
 *
 * Test emission and handling of 'error' event in a logger with a 'path'
 * stream.
 */

import { EventEmitter } from 'events';

import { Logger } from '../src/logger';
import { getPathFile } from './util';
import { LoggerStream } from '../src';

const BOGUS_PATH = '/this/path/is/bogus.log';

describe(getPathFile(__filename), () => {
  it('error event on file stream (reemitErrorEvents=undefined)', (done) => {
    const log = new Logger({
      name: 'error-event-1',
      streams: [{ path: BOGUS_PATH }],
    });

    log.on('error', (err: Error & { code: string }, stream: LoggerStream) => {
      expect(err).toBeTruthy();
      expect(err.code).toEqual('ENOENT');
      expect(stream).toBeTruthy();
      expect(stream.path).toEqual(BOGUS_PATH);
      expect(stream.type).toEqual('file');
      done();
    });

    log.info('info log message');
  });

  it('error event on file stream (reemitErrorEvents=true)', (done) => {
    const log = new Logger({
      name: 'error-event-2',
      streams: [
        {
          path: BOGUS_PATH,
          reemitErrorEvents: true,
        },
      ],
    });

    log.on('error', (err: Error & { code: string }, stream: LoggerStream) => {
      expect(err).toBeTruthy();
      expect(err.code).toEqual('ENOENT');
      expect(stream).toBeTruthy();
      expect(stream.path).toEqual(BOGUS_PATH);
      expect(stream.type).toEqual('file');
      done();
    });

    log.info('info log message');
  });

  it('error event on file stream (reemitErrorEvents=false)', (done) => {
    const log = new Logger({
      name: 'error-event-3',
      streams: [
        {
          path: BOGUS_PATH,
          reemitErrorEvents: false,
        },
      ],
    });

    log.on('error', (err: Error, stream: LoggerStream) => {
      done.fail('should not have gotten error event on logger');
    });

    // Hack into the underlying created file stream to catch the error event.
    log.streams[0].stream.on('error', (err: Error) => {
      expect(err).toBeTruthy();
      done();
    });

    log.info('info log message');
  });

  class MyErroringStream extends EventEmitter {
    write() {
      this.emit('error', new Error('boom'));
    }
  }

  it('error event on raw stream (reemitErrorEvents=undefined)', (done) => {
    const estream = new MyErroringStream();

    const log = new Logger({
      name: 'error-event-raw',
      streams: [
        {
          stream: estream,
          type: 'raw',
        },
      ],
    });

    log.on('error', (err: Error, stream: LoggerStream) => {
      done.fail('should not have gotten error event on logger');
    });

    estream.on('error', function (err) {
      expect(err).toBeTruthy();
      done();
    });

    log.info('info log message');
  });

  it('error event on raw stream (reemitErrorEvents=false)', (done) => {
    const estream = new MyErroringStream();

    const log = new Logger({
      name: 'error-event-raw',
      streams: [
        {
          stream: estream,
          type: 'raw',
          reemitErrorEvents: false,
        },
      ],
    });

    log.on('error', (err: Error, stream: LoggerStream) => {
      done.fail('should not have gotten error event on logger');
    });

    estream.on('error', function (err) {
      expect(err).toBeTruthy();
      done();
    });

    log.info('info log message');
  });

  it('error event on raw stream (reemitErrorEvents=true)', (done) => {
    const estream = new MyErroringStream();

    const log = new Logger({
      name: 'error-event-raw',
      streams: [
        {
          stream: estream,
          type: 'raw',
          reemitErrorEvents: true,
        },
      ],
    });

    log.on('error', (err: Error, stream: LoggerStream) => {
      expect(err).toBeTruthy();
      expect(err.message).toEqual('boom');
      expect(stream).toBeTruthy();
      expect(stream.stream instanceof MyErroringStream).toBeTruthy();
      expect(stream.type).toEqual('raw');
      done();
    });

    log.info('info log message');
  });
});
