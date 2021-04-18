/*
 * Copyright (c) 2012 Trent Mick. All rights reserved.
 *
 * Test type checking on creation of the Logger.
 */

import { Logger } from '../src/logger';
import { getPathFile } from './util';

// tslint:disable
describe(getPathFile(__filename), () => {

  it('ensure Logger creation options', () => {
    expect(function () { new (<any>Logger)(); }).toThrowError(/options \(object\) is required/);
    expect(function () { new Logger(<any>{}); }).toThrowError(/options\.name \(string\) is required/);
    expect(function () { new Logger({ name: 'foo' }); }).not.toThrow('just options.name should be sufficient');

    let options = <any>{ name: 'foo', stream: process.stdout, streams: [] };
    expect(function () { new Logger(options); }).toThrowError(/cannot mix "streams" and "stream" options/);

    // https://github.com/trentm/node-bunyan/issues/3
    options = { name: 'foo', streams: {} };
    expect(function () { new Logger(options); }).toThrowError(/invalid options.streams: must be an array/);

    options = { name: 'foo', serializers: 'a string' };
    expect(function () { new Logger(options); }).toThrowError(/invalid options.serializers: must be an object/);

    options = { name: 'foo', serializers: [1, 2, 3] };
    expect(function () { new Logger(options); }).toThrowError(/invalid options.serializers: must be an object/);
  });

  it('ensure Logger constructor is safe without new', () => {
    expect(function () { new Logger({ name: 'foo' }); }).not.toThrow('constructor should call self with new if necessary');
  });

  it('ensure Logger creation options (createLogger)', () => {
    expect(function () { new (<any>Logger)(); }).toThrowError(/options \(object\) is required/);
    expect(function () { new Logger(<any>{}); }).toThrowError(/options\.name \(string\) is required/);
    expect(function () { new Logger({ name: 'foo' }); }).not.toThrow('just options.name should be sufficient');

    let options = <any>{ name: 'foo', stream: process.stdout, streams: [] };
    expect(function () { new Logger(options); }).toThrowError(/* JSSTYLED */
      /cannot mix "streams" and "stream" options/);

    // https://github.com/trentm/node-bunyan/issues/3
    options = { name: 'foo', streams: {} };
    expect(function () { new Logger(options); }).toThrowError(/invalid options.streams: must be an array/);

    options = { name: 'foo', serializers: 'a string' };
    expect(function () { new Logger(options); }).toThrowError(/invalid options.serializers: must be an object/);

    options = { name: 'foo', serializers: [1, 2, 3] };
    expect(function () { new Logger(options); }).toThrowError(/invalid options.serializers: must be an object/);
  });


  it('ensure Logger child() options', done => {
    const log = new Logger({ name: 'foo' });
    expect(function () { log.child(); }).not.toThrow('no options should be fine');
    expect(function () { log.child({}); }).not.toThrow('empty options should be fine too');
    expect(function () { log.child(<any>{ name: 'foo' }); }).toThrowError(/invalid options.name: child cannot set logger name/);

    let options = <any>{ stream: process.stdout, streams: [] };
    expect(function () { log.child(options); }).toThrowError(/* JSSTYLED */
      /cannot mix "streams" and "stream" options/);

    // https://github.com/trentm/node-bunyan/issues/3
    options = { streams: {} };
    expect(function () { log.child(options); }).toThrowError(/invalid options.streams: must be an array/);

    options = { serializers: 'a string' };
    expect(function () { log.child(options); }).toThrowError(/invalid options.serializers: must be an object/);

    options = { serializers: [1, 2, 3] };
    expect(function () { log.child(options); }).toThrowError(/invalid options.serializers: must be an object/);
    done();
  });

  it('ensure Logger() rejects non-Logger parents', () => {
    const dad = new Logger({ name: 'dad', streams: [] });
    expect(function () { new Logger(<any>{}, {}); }).toThrowError(/invalid Logger creation: do not pass a second arg/);
    expect(function () { new Logger(dad, {}); }).not.toThrow('Logger allows Logger instance as parent');
  });
});
