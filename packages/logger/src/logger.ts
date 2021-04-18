import { format, inspect } from 'util';
import * as assert from 'assert-plus';
import * as os from 'os';
import * as fs from 'fs';
import { Writable } from 'stream';

import { RingBuffer } from './ring-buffer';
import { RotatingFileStream } from './rotating-file-stream';
import { xxx, safeCycles, fastAndSafeJsonStringify, getFullErrorStack, getCaller3Info, isWritable } from './utils';
import {
  LogFields,
  LevelNames,
  LoggerOptions,
  ChildOptions,
  LoggerStreamOptions,
  StdSerializers,
  Level,
  Serializers,
  LoggerStream,
  ExcludeLogFields
} from './types';

if (process === undefined || !process.versions || !process.versions.node) {
  throw new Error('unknown runtime environment');
}

// The 'mv' module is required for rotating-file stream support.
let mv: any;
let RotatingFileStreamClass: typeof RotatingFileStream;
try {
  mv = require('mv');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RotatingFileStreamClass = require('./rotating-file-stream').RotatingFileStream;
} catch (e) {
  mv = null;
}

export class Logger extends Writable {
  /**
   * Serialize an HTTP request.
   * A serializer is a function that serializes a JavaScript object to a
   * JSON representation for logging. There is a standard set of presumed
   * interesting objects in node.js-land.
   *
   * Trailers: Skipping for speed. If you need trailers in your app, then
   * make a custom serializer.
```ts
if (Object.keys(trailers).length > 0) {
 obj.trailers = req.trailers;
}
```
   */
  static stdSerializers: StdSerializers = {
    req(req) {
      if (!req || !req.socket) {
        return req;
      }
      return {
        method: req.method,
        url: req.url,
        headers: req.headers,
        remoteAddress: req.socket.remoteAddress,
        remotePort: req.socket.remotePort
      };
    },
    res(res) {
      if (!res || !res.statusCode) {
        return res;
      }

      return {
        statusCode: res.statusCode,
        header: res.getHeaders()
      };
    },
    err(err) {
      if (!err || !err.stack) {
        return err;
      }
      return {
        message: err.message,
        name: err.name,
        stack: getFullErrorStack(err)
      };
    }
  };
  static RingBuffer = RingBuffer;
  static RotatingFileStream = RotatingFileStreamClass;
  /**
   * Useful for custom `type == 'raw'` streams that may do JSON stringification
   * of log records themselves. Usage:
```ts
let str = JSON.stringify(rec, Logger.safeCycles());
```
   */
  static safeCycles = safeCycles;
  streams: LoggerStream[];
  trace = this.mkLogEmitter(Level.trace);
  debug = this.mkLogEmitter(Level.debug);
  info = this.mkLogEmitter(Level.info);
  warn = this.mkLogEmitter(Level.warn);
  error = this.mkLogEmitter(Level.error);
  fatal = this.mkLogEmitter(Level.fatal);
  /**
   * These are the default fields for log records (minus the attributes
   * removed in this constructor). To allow storing raw log records
   * (unrendered), `this.logFields` must never be mutated. Create a copy for
   * any changes.
   */
  protected readonly logFields: LogFields;
  protected serializers: Serializers;
  protected src: boolean;
  protected haveNonRawStreams: boolean;
  /**
   * Normalized level as number type.
   */
  protected resolvedLevel: number;
  /**
   * Create a Logger instance.
   */
  constructor(options: LoggerOptions);
  /**
   * Create a Logger instance.
   *
   * @param isSimpleChild An assertion that the given `childOptions`
   * - only add fields (no config)
   * - and no serialization handling is required for them.
   *
   * In the other words, this is fast path for frequent child creation,
   * is a signal to stream close handling that this child owns none of its streams.
   */
  constructor(logger: Logger, childOptions: ChildOptions, isSimpleChild?: boolean);
  /**
   * Create a Logger instance.
   *
   * @param isSimpleChild An assertion that the given `childOptions`
   * - only add fields (no config)
   * - and no serialization handling is required for them.
   *
   * In the other words, this is fast path for frequent child creation,
   * is a signal to stream close handling that this child owns none of its streams.
   */
  constructor(optionsOrLogger: LoggerOptions | Logger, childOptions?: ChildOptions, public isSimpleChild?: boolean) {
    super();
    xxx('Logger start:', optionsOrLogger);

    // Input arg validation.
    let parentLogger: Logger;
    let options: LoggerOptions | ChildOptions;
    if (childOptions !== undefined) {
      parentLogger = optionsOrLogger as Logger;
      options = childOptions;
      if (!(parentLogger instanceof Logger)) {
        throw new TypeError('invalid Logger creation: do not pass a second arg');
      }
    } else {
      options = optionsOrLogger as LoggerOptions;
    }

    assert.object(options, 'options (object) is required');

    if (!parentLogger) {
      if (!options.name) {
        throw new TypeError('options.name (string) is required');
      }
    } else {
      if (options.name) {
        throw new TypeError('invalid options.name: child cannot set logger name');
      }
    }

    if (options.stream && options.streams) {
      throw new TypeError('cannot mix "streams" and "stream" options');
    }

    if (options.streams && !Array.isArray(options.streams)) {
      throw new TypeError('invalid options.streams: must be an array');
    }

    if (options.serializers && (typeof options.serializers != 'object' || Array.isArray(options.serializers))) {
      throw new TypeError('invalid options.serializers: must be an object');
    }

    // Setting values.
    this.streams = [];
    if (parentLogger) {
      this.resolvedLevel = parentLogger.resolvedLevel;
      if (isSimpleChild) {
        this.streams = parentLogger.streams;
        this.serializers = parentLogger.serializers;
        this.src = parentLogger.src;
        Object.assign(this.logFields, parentLogger.logFields, options);
        return;
      }
      // Don't own parent stream.
      this.streams = parentLogger.streams.map(stream => ({ ...stream, ...{ closeOnExit: false } }));
      this.serializers = { ...parentLogger.serializers };
      this.src = parentLogger.src;
      this.logFields = { ...parentLogger.logFields };
      if (options.level) {
        this.level(options.level);
      }
    } else {
      this.resolvedLevel = Number.POSITIVE_INFINITY;
      this.serializers = null;
      this.src = false;
      this.logFields = {} as any;
    }

    // Adding streams.
    if (options.stream) {
      this.addStream({
        type: 'stream',
        stream: options.stream,
        closeOnExit: false,
        level: options.level
      });
    } else if (options.streams) {
      options.streams.forEach(loggerStream => this.addStream(loggerStream, options.level));
    } else if (parentLogger && options.level) {
      this.level(options.level);
    } else if (!parentLogger) {
      this.addStream({
        type: 'stream',
        stream: process.stdout,
        closeOnExit: false,
        level: options.level
      });
    }

    // Adding serializers.
    if (options.serializers) {
      this.addSerializers(options.serializers);
    }
    if (options.src) {
      this.src = true;
    }
    xxx('Logger: ', this);

    const logFields: LoggerOptions | ChildOptions = { ...options };
    delete logFields.stream;
    delete logFields.level;
    delete logFields.streams;
    delete logFields.serializers;
    delete logFields.src;
    if (this.serializers) {
      this.applySerializers(logFields);
    }
    if (!logFields.hostname && !this.logFields.hostname) {
      logFields.hostname = os.hostname();
    }
    if (!logFields.pid) {
      logFields.pid = process.pid;
    }
    Object.assign(this.logFields, logFields);
  }

  /**
   * Resolve a level number or name (in lowercase) to a level number value.
   *
   * @param nameOrNumber A level name (in lowercase) or positive integer level.
   */
  static resolveLevel(nameOrNumber: LevelNames | Level): number {
    let resolvedLevel: number;
    const type = typeof nameOrNumber;
    if (typeof nameOrNumber == 'string') {
      resolvedLevel = Level[nameOrNumber];
      if (!resolvedLevel) {
        throw new Error(format('unknown level name: "%s"', nameOrNumber));
      }
    } else if (type != 'number') {
      throw new TypeError(format('cannot resolve level: invalid arg (%s):', type, nameOrNumber));
    } else if (nameOrNumber < 0 || Math.floor(nameOrNumber) !== nameOrNumber) {
      throw new TypeError(format('level is not a positive integer: %s', nameOrNumber));
    } else {
      resolvedLevel = nameOrNumber;
    }
    return resolvedLevel;
  }

  /**
   * ### Usage:
```ts
import { Logger } from '@ditsmod/logger';
const log = new Logger({name: 'myLogger'});
log.addStream({
  name: 'myNewStream',
  stream: process.stderr,
  level: 'debug'
});
```
   */
  addStream(loggerStreamOptions: LoggerStreamOptions, defaultLevel: Level | LevelNames = Level.info) {
    const loggerStream: LoggerStream = { ...loggerStreamOptions };

    // Implicit 'type' from other args.
    if (!loggerStream.type) {
      if (loggerStream.stream) {
        loggerStream.type = 'stream';
      } else if (loggerStream.path) {
        loggerStream.type = 'file';
      }
    }

    loggerStream.raw = loggerStream.type == 'raw'; // PERF: Allow for faster check in `_emit`.

    if (loggerStream.level !== undefined) {
      loggerStream.level = Logger.resolveLevel(loggerStream.level);
    } else {
      loggerStream.level = Logger.resolveLevel(defaultLevel);
    }

    if (loggerStream.level < this.resolvedLevel) {
      this.resolvedLevel = loggerStream.level;
    }

    switch (loggerStream.type) {
      case 'stream':
        assert.ok(isWritable(loggerStream.stream), '"stream" stream is not writable: ' + inspect(loggerStream.stream));
        if (!loggerStream.closeOnExit) {
          loggerStream.closeOnExit = false;
        }
        break;
      case 'file':
        if (loggerStream.reemitErrorEvents === undefined) {
          loggerStream.reemitErrorEvents = true;
        }
        if (!loggerStream.stream) {
          loggerStream.stream = fs.createWriteStream(loggerStream.path, { flags: 'a', encoding: 'utf8' });
          if (!loggerStream.closeOnExit) {
            loggerStream.closeOnExit = true;
          }
        } else {
          if (!loggerStream.closeOnExit) {
            loggerStream.closeOnExit = false;
          }
        }
        break;
      case 'rotating-file':
        assert.ok(!loggerStream.stream, '"rotating-file" stream should not give a "stream"');
        assert.ok(loggerStream.path);
        assert.ok(mv, '"rotating-file" stream type is not supported: missing "mv" module');
        loggerStream.stream = new RotatingFileStreamClass(loggerStream);
        if (!loggerStream.closeOnExit) {
          loggerStream.closeOnExit = true;
        }
        break;
      case 'raw':
        if (!loggerStream.closeOnExit) {
          loggerStream.closeOnExit = false;
        }
        break;
      default:
        throw new TypeError('unknown stream type "' + loggerStream.type + '"');
    }

    if (loggerStream.reemitErrorEvents && typeof loggerStream.stream.on == 'function') {
      /**
       * @todo: When we have `<logger>.close()`,
       * it should remove event listeners to not leak Logger instances.
       */
      loggerStream.stream.on('error', (err: Error) => this.emit('error', err, loggerStream));
    }

    this.streams.push(loggerStream);
    delete this.haveNonRawStreams; // reset
  }

  /**
   * Add serializers
   *
   * @param serializers Object mapping log record field names to serializing functions.
   */
  addSerializers(serializers: Serializers = {}) {
    if (!this.serializers) {
      this.serializers = {};
    }
    Object.keys(serializers).forEach(field => {
      const serializer = serializers[field];
      if (typeof serializer != 'function') {
        throw new TypeError(`invalid serializer for "${field}" field: must be a function`);
      } else {
        this.serializers[field] = serializer;
      }
    });
  }

  /**
   * Create a child logger, typically to add a few log record fields
   * and maybe with other level.
   *
   * This can be useful for debugging a 'component':
   *
```ts
const parentLogger = new Logger({
  name: 'parentLogger',
  streams: [{
    path: '/path/to/app.log',
    level: 'warn'
  }]
});

const childLogger = parentLogger.child({
  component: 'field-for-identify-this-logger',
  level: 'debug'
});

const component = new Component({..., logger: childLogger});
```
   * Then log records from the component code will have the same structure as
   * the app log, plus the component `field-for-identify-this-logger` field and `debug` level.
   *
   * @param options Set of options to apply to the child.
   * All of the same options for a new Logger apply here. Notes:
   *  - The parent's streams are inherited and cannot be removed in this
   *    call. Any given `streams` are *added* to the set inherited from
   *    the parent.
   *  - The parent's serializers are inherited, though can effectively be
   *    overwritten by using duplicate keys.
   *  - Can use `level` to set the level of the streams inherited from
   *    the parent. The level for the parent is NOT affected.
   * @param isSimple Set to true to assert that `options`:
   * 1. only add fields (no config)
   * 2. no serialization handling is required for them. I other words, this is a fast path
   *    for frequent child creation.
   */
  child(options: ChildOptions = {}, isSimple: boolean = false) {
    return new Logger(this, options, isSimple);
  }

  /**
   * A convenience method to reopen `file` streams on a logger. This can be
   * useful with external log rotation utilities that move and re-open log files
   * (e.g. `logrotate` on Linux, `logadm` on SmartOS/Illumos). Those utilities
   * typically have rotation options to copy-and-truncate the log file, but
   * you may not want to use that. An alternative is to do this in your
   * application:
```ts
import { Logger } from '@ditsmod/logger';

const log = new Logger({
  name: 'name-for-logger',
  type: 'rotating-file'
});
...

process.on('SIGUSR2', function () {
  log.reopenFileStreams();
});
...
```
   * See: [Reload streams ability](https://github.com/trentm/node-bunyan/issues/104).
   */
  reopenFileStreams() {
    this.streams.forEach(loggerStream => {
      if (loggerStream.type == 'file') {
        if (loggerStream.stream) {
          // Not sure if typically would want this, or more immediate `s.stream.destroy()`.
          loggerStream.stream.end();
          delete loggerStream.stream;
        }
        loggerStream.stream = fs.createWriteStream(loggerStream.path, { flags: 'a', encoding: 'utf8' });
        loggerStream.stream.on('error', (err: Error) => this.emit('error', err, loggerStream));
      }
    });
  }

  /**
   * Getter or setter the level of all streams on this logger.
   *
   * ### Getter usage:
```ts
// Returns the current log level,
// lowest level of all its streams.
log.level() // returns 10 == INFO
```
   * ### Setter usage:
```ts
log.level(INFO); // set all streams to level INFO
log.level('info'); // can use 'info' et all aliases
```
   */
  level(): number;
  level(nameOrNumber: LevelNames | Level): void;
  level(nameOrNumber?: LevelNames | Level) {
    if (nameOrNumber === undefined) {
      return this.resolvedLevel;
    }
    const resolvedLevel = Logger.resolveLevel(nameOrNumber);
    this.streams.forEach(stream => (stream.level = resolvedLevel));
    this.resolvedLevel = resolvedLevel;
  }

  /**
   * Getter or setter the level of a particular stream on this logger.
   *
   * ### Getter usage:
```ts
// Returns an array of the levels of each stream.
log.levels(); // -> [TRACE, INFO]

// Returns a level of the identified stream.
log.levels(0); // -> TRACE (level of stream at index 0)
log.levels('foo'); // level of stream with name 'foo'
```
   *
   * ### Setter usage:
```ts
log.levels(0, INFO); // set level of stream 0 to INFO
log.levels(0, 'info'); // can use 'info' et all aliases
log.levels('foo', WARN); // set stream named 'foo' to WARN
```
   * ### Stream names
   *
   * When streams are defined, they can optionally be given
   * a name. For example,
```ts
const log = new Logger({
  streams: [
    {
      name: 'foo',
      path: '/var/log/my-service/foo.log'
      level: 'trace'
    },
  ...
```
   *
   * @param nameOrNumber The stream index or name.
   * @param value The level value (INFO) or alias ('info').
   * If not given, this is a 'get' operation.
   * @throws {Error} If there is no stream with the given name.
   */
  levels(): (number | LevelNames)[];
  levels(nameOrNumber: number | string): Level | LevelNames;
  levels(nameOrNumber: number | string, value: Level | LevelNames): void;
  levels(nameOrNumber?: number | string, value?: Level | LevelNames) {
    if (nameOrNumber === undefined) {
      assert.equal(value, undefined);
      return this.streams.map(s => s.level);
    }

    let stream: LoggerStream;

    if (typeof nameOrNumber == 'number') {
      stream = this.streams[nameOrNumber];
      if (stream === undefined) {
        throw new Error('invalid stream index: ' + nameOrNumber);
      }
    } else {
      stream = this.streams.find(s => s.name == nameOrNumber);
      if (!stream) {
        throw new Error(format('no stream with name "%s"', nameOrNumber));
      }
    }

    if (value === undefined) {
      return stream.level;
    } else {
      const newLevel = Logger.resolveLevel(value);
      stream.level = newLevel;
      if (newLevel < this.resolvedLevel) {
        this.resolvedLevel = newLevel;
      }
    }
  }

  /**
   * Apply registered serializers to the appropriate keys in the given fields.
   *
   * Pre-condition: This is only called if there is at least one serializer.
   *
   * @param logFields The log record fields.
   * @param excludeLogFields Optional mapping of keys to `true` for keys to NOT apply a serializer.
   */
  protected applySerializers(logFields: LogFields, excludeLogFields?: ExcludeLogFields) {
    xxx('applySerializers: excludeFields', excludeLogFields);

    Object.keys(this.serializers).forEach(name => {
      if (logFields[name] === undefined || (excludeLogFields && excludeLogFields[name])) {
        return;
      }
      xxx('applySerializers; apply to "%s" key', name);
      try {
        logFields[name] = this.serializers[name](logFields[name]);
      } catch (err) {
        const message =
          `Logger: ERROR: Exception thrown from the "${name}" ` +
            'Logger serializer. This should never happen. This is a bug ' +
            'in that serializer function.\n' +
            err.stack || err;

        this.warn(message);

        logFields[name] = `(Error in Logger serializer broke "${name}" field. See stderr for details.)`;
      }
    });
  }

  /**
   * Build a record object suitable for emitting from the arguments
   * provided to the a log emitter.
   */
  protected mkRecord(log: Logger, minLevel?: number, args?: any[]) {
    let excludeFields: ExcludeLogFields;
    let logFields: LogFields;
    let msgArgs: any[];

    if (args[0] instanceof Error) {
      /**
       * case call: `log.<level>(err, ...)`
       */
      logFields = {
        err: log.serializers && log.serializers.err ? log.serializers.err(args[0]) : Logger.stdSerializers.err(args[0])
      };

      excludeFields = { err: true };

      if (args.length == 1) {
        msgArgs = [logFields.err.message];
      } else {
        msgArgs = args.slice(1);
      }
    } else if (typeof args[0] != 'object' || Array.isArray(args[0])) {
      /**
       * case call: `log.<level>(msg, ...)`
       */
      logFields = null;
      msgArgs = args.slice();
    } else if (Buffer.isBuffer(args[0])) {
      /**
       * case call: `log.<level>(buffer, ...)`
       *
       * Almost certainly an error, show `inspect(buffer)`. See bunyan issue #35.
       */
      logFields = null;
      msgArgs = args.slice();
      msgArgs[0] = inspect(msgArgs[0]);
    } else {
      /**
       * case call: `log.<level>(fields, msg, ...)`
       */
      logFields = args[0];
      if (logFields && args.length == 1 && logFields.err && logFields.err instanceof Error) {
        msgArgs = [logFields.err.message];
      } else {
        msgArgs = args.slice(1);
      }
    }

    // Build up the record object.
    const rec: LogFields = { ...log.logFields };
    rec.level = minLevel;
    if (logFields) {
      if (log.serializers) {
        log.applySerializers(logFields, excludeFields);
      }
      Object.assign(rec, logFields);
    }

    rec.msg = format.apply(log, msgArgs);

    if (!rec.time) {
      rec.time = new Date();
    }
    // Get call source info
    if (log.src && !rec.src) {
      rec.src = getCaller3Info();
    }

    return rec;
  }

  /**
   * Build a log emitter function for level `minLevel`. I.e. this is the
   * creator of `log.info`, `log.error`, etc.
   */
  protected mkLogEmitter(minLevel: number) {
    return logEmitter;

    /**
     * Is the log.<level>() enabled?
     *
     * Usages:
    ```ts
    if (log.info()) {
    // info level is enabled
    }
    ```
     */
    function logEmitter(): boolean;
    /**
     * Log a simple string message (or number).
     */
    function logEmitter(msg: string | number): void;
    /**
     * Special case to log an `Error` instance to the record.
     * This adds an `err` field with exception details
     * (including the stack) and sets `msg` to the exception
     * message or you can specify the `msg`.
     */
    function logEmitter(error: Error, msg?: string, ...params: any[]): void;
    /**
     * The first field can optionally be a `fields` object, which
     * is merged into the log record.
     *
     * To pass in an Error *and* other fields, use the `err`
     * field name for the Error instance.
     */
    function logEmitter(obj: object, msg?: string, ...params: any[]): void;
    /**
     * Uses `util.format` for msg formatting.
     */
    function logEmitter(format: any, ...params: any[]): void;
    function logEmitter(...args: any[]) {
      const logger: Logger = this;
      let rec = null;

      // case call: `log.<level>()`
      if (args.length == 0) {
        return logger.resolvedLevel <= minLevel;
      }

      if (logger.resolvedLevel <= minLevel) {
        rec = logger.mkRecord(logger, minLevel, args);
        logger._emit(rec);
      }
    }
  }

  /**
   * Emit a log record.
   *
   * @param noemit Set to true to skip emission and just return the JSON string.
   */
  protected _emit(rec: LogFields, noemit?: boolean): string {
    /**
     * Lazily determine if this Logger has non-'raw' streams. If there are
     * any, then we need to stringify the log record.
     */
    if (this.haveNonRawStreams === undefined) {
      this.haveNonRawStreams = false;
      for (const stream of this.streams) {
        if (!stream.raw) {
          this.haveNonRawStreams = true;
          break;
        }
      }
    }

    // Stringify the object (creates a warning str on error).
    let str: string;
    if (noemit || this.haveNonRawStreams) {
      str = fastAndSafeJsonStringify(rec) + '\n';
    }

    if (noemit) {
      return str;
    }

    const level = rec.level;
    this.streams.forEach(s => {
      if (s.level <= level) {
        xxx('writing log rec "%s" to "%s" stream (%d <= %d): %j', rec.msg, s.type, s.level, level, rec);
        s.stream.write(s.raw ? rec : str);
      }
    });

    return str;
  }
}
