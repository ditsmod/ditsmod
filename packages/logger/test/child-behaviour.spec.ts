/*
 * Copyright (c) 2012 Trent Mick. All rights reserved.
 *
 * Test some `<Logger>.child(...)` behaviour.
 */

import { Logger } from '../src/logger';
import { LogFields } from '../src/types';
import { getPathFile } from './util';

class CapturingStream {
  constructor(public records: LogFields[] = []) { }

  write(record: LogFields) {
    this.records.push(record);
  }
}

describe(getPathFile(__filename), () => {
  it('child can add stream', () => {
    const dadStream = new CapturingStream();
    const dad = new Logger({
      name: 'surname',
      streams: [{
        type: 'raw',
        stream: dadStream,
        level: 'info'
      }]
    });

    const sonStream = new CapturingStream();
    const son = dad.child({
      component: 'son',
      streams: [{
        type: 'raw',
        stream: sonStream,
        level: 'debug'
      }]
    });

    dad.info('info from dad');
    dad.debug('debug from dad');
    son.debug('debug from son');

    expect(dadStream.records.length).toEqual(1);
    expect(dadStream.records[0].msg).toEqual('info from dad');
    expect(sonStream.records.length).toEqual(1);
    expect(sonStream.records[0].component).toEqual('son');
    expect(sonStream.records[0].msg).toEqual('debug from son');
  });

  it('child can set level of inherited streams', () => {
    const dadStream = new CapturingStream();
    const dad = new Logger({
      name: 'surname',
      streams: [{
        type: 'raw',
        stream: dadStream,
        level: 'info'
      }]
    });

    const son = dad.child({
      component: 'son',
      level: 'debug'
    });

    dad.info('info from dad');
    dad.debug('debug from dad');
    son.debug('debug from son');

    expect(dadStream.records.length).toEqual(2);
    expect(dadStream.records[0].msg).toEqual('info from dad');
    expect(dadStream.records[1].component).toEqual('son');
    expect(dadStream.records[1].msg).toEqual('debug from son');
  });

  it('child can set level of inherited streams and add streams', done => {
    const dadStream = new CapturingStream();
    const dad = new Logger({
      name: 'surname',
      streams: [{
        type: 'raw',
        stream: dadStream,
        level: 'info'
      }]
    });

    const sonStream = new CapturingStream();
    const son = dad.child({
      component: 'son',
      level: 'trace',
      streams: [{
        type: 'raw',
        stream: sonStream,
        level: 'debug'
      }]
    });

    dad.info('info from dad');
    dad.trace('trace from dad');
    son.trace('trace from son');
    son.debug('debug from son');

    expect(dadStream.records.length).toEqual(3);
    expect(dadStream.records[0].msg).toEqual('info from dad');
    expect(dadStream.records[1].msg).toEqual('trace from son');
    expect(dadStream.records[2].msg).toEqual('debug from son');
    expect(dadStream.records[2].component).toEqual('son');

    expect(sonStream.records.length).toEqual(1);
    expect(sonStream.records[0].msg).toEqual('debug from son');
    expect(sonStream.records[0].component).toEqual('son');
    done();
  });

  it('child should not lose parent "hostname"', done => {
    const dadStream = new CapturingStream();
    const dad = new Logger({
      name: 'hostname-test',
      hostname: 'bar0',
      streams: [{
        type: 'raw',
        stream: dadStream,
        level: 'info'
      }]
    });

    const son = dad.child({ component: 'son' });

    dad.info('HI');
    son.info('hi');

    expect(dadStream.records.length).toEqual(2);
    expect(dadStream.records[0].hostname).toEqual('bar0');
    expect(dadStream.records[1].hostname).toEqual('bar0');
    expect(dadStream.records[1].component).toEqual('son');
    done();
  });
});
