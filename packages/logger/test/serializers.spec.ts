/*
 * Copyright (c) 2012 Trent Mick. All rights reserved.
 *
 * Test the standard serializers in Bunyan.
 */

import * as http from 'http';
import { ChainError } from '@ts-stack/chain-error';

import { Logger } from '../src/logger';
import { LogFields } from '../src/types';
import { getPathFile } from './util';

class CapturingStream {
  constructor(public records: LogFields[]) {}

  write(record: LogFields) {
    this.records.push(record);
  }
}

describe(getPathFile(__filename), () => {
  it('req serializer', (done) => {
    const records: LogFields[] = [];
    const log = new Logger({
      name: 'serializer-test',
      streams: [
        {
          stream: new CapturingStream(records),
          type: 'raw',
        },
      ],
      serializers: {
        req: Logger.stdSerializers.req,
      },
    });

    // None of these should blow up.
    [undefined, null, {}, 1, 'string', [1, 2, 3], { foo: 'bar' }].forEach((bogusReq, i) => {
      log.info({ req: bogusReq }, 'hi');
      expect(records[i].req).toEqual(bogusReq);
    });

    // Get http request objects to play with and test.
    let realReq: http.IncomingMessage;
    const server = http.createServer((req, res) => {
      realReq = req;
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello World\n');
    });

    server.listen(8765, () => {
      http
        .get({ host: '127.0.0.1', port: 8765, path: '/' }, (res) => {
          res.resume();
          log.info({ req: realReq }, 'the request');
          const lastRecord = records[records.length - 1];
          expect(lastRecord.req.method).toEqual('GET');
          expect(lastRecord.req.url).toEqual(realReq.url);
          expect(lastRecord.req.remoteAddress).toEqual(realReq.connection.remoteAddress);
          expect(lastRecord.req.remotePort).toEqual(realReq.connection.remotePort);
          server.close();
          done();
        })
        .on('error', (err) => {
          server.close();
          done.fail('error requesting to our test server: ' + err);
        });
    });
  });

  fit('res serializer', (done) => {
    const records: LogFields[] = [];
    const log = new Logger({
      name: 'serializer-test',
      streams: [
        {
          stream: new CapturingStream(records),
          type: 'raw',
        },
      ],
      serializers: {
        res: Logger.stdSerializers.res,
      },
    });

    // None of these should blow up.
    [undefined, null, {}, 1, 'string', [1, 2, 3], { foo: 'bar' }].forEach((bogusRes, i) => {
      log.info({ res: bogusRes }, 'hi');
      expect(records[i].res).toEqual(bogusRes);
    });

    // Get http response objects to play with and test.
    let serverRes: http.ServerResponse;

    const server = http.createServer((req, res) => {
      serverRes = res;
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello World\n');
    });

    server.listen(8765, () => {
      http
        .get({ host: '127.0.0.1', port: 8765, path: '/' }, (res) => {
          res.resume();
          log.info({ res: serverRes }, 'the response');
          const lastRecord = records[records.length - 1];
          expect(lastRecord.res.statusCode).toEqual(serverRes.statusCode);
          expect(lastRecord.res.header).toEqual((serverRes as any)._header);
          server.close();
          done();
        })
        .on('error', (err) => {
          server.close();
          done.fail('error requesting to our test server: ' + err);
        });
    });
  });

  it('err serializer', () => {
    const records: LogFields[] = [];
    const log = new Logger({
      name: 'serializer-test',
      streams: [
        {
          stream: new CapturingStream(records),
          type: 'raw',
        },
      ],
      serializers: {
        err: Logger.stdSerializers.err,
      },
    });

    // None of these should blow up.
    const bogusErrs: any[] = [undefined, null, {}, 1, 'string', [1, 2, 3], { foo: 'bar' }];
    for (let i = 0; i < bogusErrs.length; i++) {
      log.info({ err: bogusErrs[i] }, 'hi');
      expect(records[i].err).toEqual(bogusErrs[i]);
    }

    const realErr = new TypeError('blah');

    log.info(realErr, 'the error');
    const lastRecord = records[records.length - 1];
    expect(lastRecord.err.message).toEqual(realErr.message);
    expect(lastRecord.err.name).toEqual(realErr.name);
    expect(lastRecord.err.stack).toEqual(realErr.stack);
  });

  it('err serializer: custom serializer', () => {
    const records: LogFields[] = [];

    function customSerializer(err: any) {
      return {
        message: err.message,
        name: err.name,
        stack: err.stack,
        beep: err.beep,
      };
    }

    const log = new Logger({
      name: 'serializer-test',
      streams: [
        {
          stream: new CapturingStream(records),
          type: 'raw',
        },
      ],
      serializers: {
        err: customSerializer,
      },
    });

    const e1 = new Error('message1');
    (e1 as any).beep = 'bop';
    const e2 = new Error('message2');

    [e1, e2].forEach((err, i) => {
      log.info(err);
      expect(records[i].err.message).toEqual(err.message);
      expect(records[i].err.beep).toEqual((err as any).beep);
    });
  });

  it('err serializer: long stack', () => {
    const records: LogFields[] = [];
    const log = new Logger({
      name: 'serializer-test',
      streams: [
        {
          stream: new CapturingStream(records),
          type: 'raw',
        },
      ],
      serializers: {
        err: Logger.stdSerializers.err,
      },
    });

    let topErr;
    let midErr;
    let bottomErr;

    // Just a ChainError.
    topErr = new ChainError('top err');
    log.info(topErr, 'the error');
    let lastRecord = records[records.length - 1];
    expect(lastRecord.err.message).toEqual(topErr.message);
    expect(lastRecord.err.name).toEqual(topErr.name);
    expect(lastRecord.err.stack).toEqual(topErr.stack);

    // Just a ChainError.
    topErr = new ChainError('top err');
    log.info(topErr, 'the error');
    lastRecord = records[records.length - 1];
    expect(lastRecord.err.message).toEqual(topErr.message);
    expect(lastRecord.err.name).toEqual(topErr.name);
    expect(lastRecord.err.stack).toEqual(topErr.stack);

    // ChainError <- TypeError
    bottomErr = new TypeError('bottom err');
    topErr = new ChainError('top err', bottomErr, true);
    log.info(topErr, 'the error');
    lastRecord = records[records.length - 1];
    expect(lastRecord.err.message).toEqual(topErr.message);
    expect(lastRecord.err.name).toEqual(topErr.name);
    let expectedStack = topErr.stack + '\ncaused by: ' + bottomErr.stack;
    expect(lastRecord.err.stack).toEqual(expectedStack);

    // ChainError <- ChainError
    bottomErr = new ChainError('bottom err');
    topErr = new ChainError('top err', bottomErr, true);
    log.info(topErr, 'the error');
    lastRecord = records[records.length - 1];
    expect(lastRecord.err.message).toEqual(topErr.message);
    expect(lastRecord.err.name).toEqual(topErr.name);
    expectedStack = topErr.stack + '\ncaused by: ' + bottomErr.stack;
    expect(lastRecord.err.stack).toEqual(expectedStack);

    // ChainError <- ChainError <- TypeError
    bottomErr = new TypeError('bottom err');
    midErr = new ChainError('mid err', bottomErr, true);
    topErr = new ChainError('top err', midErr, true);
    log.info(topErr, 'the error');
    lastRecord = records[records.length - 1];
    expect(lastRecord.err.message).toEqual(topErr.message);
    expect(lastRecord.err.name).toEqual(topErr.name);
    expectedStack = topErr.stack + '\ncaused by: ' + midErr.stack + '\ncaused by: ' + bottomErr.stack;
    expect(lastRecord.err.stack).toEqual(expectedStack);

    // ChainError <- ChainError <- ChainError
    bottomErr = new ChainError('bottom err');
    midErr = new ChainError('mid err', bottomErr, true);
    topErr = new ChainError('top err', midErr, true);
    log.info(topErr, 'the error');
    lastRecord = records[records.length - 1];
    expect(lastRecord.err.message).toEqual(topErr.message);
    expect(lastRecord.err.name).toEqual(topErr.name);
    expectedStack = topErr.stack + '\ncaused by: ' + midErr.stack + '\ncaused by: ' + bottomErr.stack;
    expect(lastRecord.err.stack).toEqual(expectedStack);
  });

  // Bunyan 0.18.3 introduced a bug where *all* serializers are applied
  // even if the log record doesn't have the associated key. That means
  // serializers that don't handle an `undefined` value will blow up.
  it('do not apply serializers if no record key', () => {
    const records: LogFields[] = [];
    const log = new Logger({
      name: 'serializer-test',
      streams: [
        {
          stream: new CapturingStream(records),
          type: 'raw',
        },
      ],
      serializers: {
        err: Logger.stdSerializers.err,
        boom() {
          throw new Error('boom');
        },
      },
    });

    log.info({ foo: 'bar' }, 'record one');
    log.info({ err: new Error('record two err') }, 'record two');

    expect(records[0].boom).toEqual(undefined);
    expect(records[0].foo).toEqual('bar');
    expect(records[1].boom).toEqual(undefined);
    expect(records[1].err.message).toEqual('record two err');
  });
});
