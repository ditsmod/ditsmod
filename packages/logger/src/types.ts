/**
 * Copyright (c) 2017 Trent Mick.
 * Copyright (c) 2017 Joyent Inc.
 * Copyright (c) 2018 Костя Третяк.
 *
 * The bunyan logging library for node.js.
 */
import * as http from 'http';
import * as http2 from 'http2';
import { WriteStream } from 'fs';

export type NodeRequest = http.IncomingMessage | http2.Http2ServerRequest;
export type NodeResponse = http.ServerResponse | http2.Http2ServerResponse;

export interface RotatingFileStreamOptions {
  path?: string;
  count?: number;
  period?: string;
}

export interface Obj {
  [k: string]: any;
}

/**
 * Levels of a log stream.
 */
export enum Level {
  trace = 10,
  debug = 20,
  info = 30,
  warn = 40,
  error = 50,
  fatal = 60
}

export type LevelNames = keyof typeof Level;

/**
 * These are the default fields for log records (minus the attributes
 * removed in this constructor). To allow storing raw log records
 * (unrendered), `this.fields` must never be mutated. Create a copy for
 * any changes.
 */
export interface LogFields {
  name?: string;
  hostname?: string;
  pid?: number;
  level?: Level | LevelNames;
  msg?: any;
  time?: Date;
  err?: Obj;
  [k: string]: any;
}

export type ExcludeLogFields = { [k in keyof LogFields]: boolean };

export interface Serializers {
  [k: string]: (...args: any[]) => Obj;
}

export interface BaseLoggerOptions {
  /**
   * Object mapping log record field names to serializing functions.
   */
  serializers?: Serializers;
  /**
   * Default `false`. Set to true to enable `src` automatic field with log call source info.
   */
  src?: boolean;
  hostname?: string;
  pid?: number;
  /**
   * All other keys are log record fields.
   */
  [k: string]: any;
}

export interface LoggerOptions1 extends BaseLoggerOptions {
  name: string;
  /**
   * The output stream for a logger with just one, e.g. `process.stdout` (cannot be used with `streams`).
   * This stream internally converted to a LoggerStream.
   */
  stream?: MinWriteStream;
  /**
   * The level for a single output stream (cannot be used with `streams`).
   */
  level?: Level | LevelNames;
  streams?: never;
}

export interface LoggerOptions2 extends BaseLoggerOptions {
  name: string;
  streams?: LoggerStreamOptions[];
  stream?: never;
}

/**
 * Note: optional should either `stream` xor `streams` are specified.
 */
export type LoggerOptions = LoggerOptions1 | LoggerOptions2;

export interface ChildOptions1 extends BaseLoggerOptions {
  /**
   * This stream internally converted to a LoggerStream.
   */
  stream?: MinWriteStream;
  streams?: never;
  name?: never;
}

export interface ChildOptions2 extends BaseLoggerOptions {
  streams?: LoggerStreamOptions[];
  stream?: never;
  name?: never;
}

export type ChildOptions = ChildOptions1 | ChildOptions2;

/**
 * Writable streams are an abstraction for a destination to which data is written.
 *
 * Note: required setting `path` or `stream`.
 */
export interface BaseLoggerStreamOptions {
  name?: string;
  /**
   * Defaults 'info'.
   */
  level?: Level | LevelNames;
  /**
   *  Default is `true` for a `file` stream when `path` is given, `false` otherwise.
   */
  closeOnExit?: boolean;

  raw?: boolean;
  /**
   * This field can be used when adding a stream to control whether `error`
   * events are re-emitted on the `Logger`.
   *
   * The behaviour is as follows:
   * - `reemitErrorEvents` not specified: only streams with type `file`
   * will re-emit error events on the `Logger` instance.
   * - `reemitErrorEvents` have `true`: error events will be re-emitted on the `Logger` for any stream
   * with a `.on()` function -- which includes file streams, process.stdout/stderr,
   * and any object that inherits from `EventEmitter`.
   * - `reemitErrorEvents` have `false`: error events will not be re-emitted for any streams.
   *
   * *Note*: `error` events are not related to log records at the `error` level
   * as produced by `log.error(...)`. See the node.js docs on error events for details.
   *
   * See `test/error-event.spec.ts`
   */
  reemitErrorEvents?: boolean;
}

export interface LoggerStreamOptions1 extends BaseLoggerStreamOptions {
  /**
   * The specify writeable stream to which
   * log records are written. E.g. `stream: process.stdout`.
   */
  stream: MinWriteStream;
  /**
   * The stream type. Often this is implied by the other fields.
   */
  type?: 'stream' | 'raw';
  path?: never;
}

export interface LoggerStreamOptions2 extends BaseLoggerStreamOptions {
  /**
   * The specify the file path to which
   * log records are written. E.g. `__dirname + '/ts-stack.log'`.
   */
  path: string;
  /**
   * The stream type. Often this is implied by the other fields.
   */
  type?: 'file';
  stream?: WriteStream;
}

export interface LoggerStreamOptions3 extends BaseLoggerStreamOptions {
  /**
   * The specify the file path to which
   * log records are written. E.g. `__dirname + '/ts-stack.log'`.
   */
  path: string;
  /**
   * The stream type. Often this is implied by the other fields.
   */
  type: 'rotating-file';
  stream?: never;
}

export type LoggerStreamOptions = LoggerStreamOptions1 | LoggerStreamOptions2 | LoggerStreamOptions3;

export interface LoggerStream extends BaseLoggerStreamOptions {
  /**
   * The specify writeable stream to which
   * log records are written. E.g. `stream: process.stdout`.
   */
  stream?: MinWriteStream;
  /**
   * The specify the file path to which
   * log records are written. E.g. `__dirname + '/ts-stack.log'`.
   */
  path?: string;
  /**
   * The stream type. Often this is implied by the other fields.
   */
  type?: 'stream' | 'raw' | 'file' | 'rotating-file';
}

export interface StdSerializers {
  [k: string]: any;
  /**
   * Serialize an Error object
   * (Core error properties are enumerable in node 0.4, not in 0.6).
   */
  err(err: Error): Obj;
  /**
   * Serialize an HTTP response.
   */
  res(res: NodeResponse): Obj;
  /**
   * Serialize an HTTP request.
   */
  req(req: NodeRequest): Obj;
}

/**
 * Min - means - minimal.
 */
export interface MinWriteStream {
  write: (...args: any[]) => any;
  [k: string]: any;
}
