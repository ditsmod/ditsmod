# Logger

## LoggerMethod

```ts
interface LoggerMethod {
  /**
   * Is the log.<level>() enabled?
   */
  (): boolean;
  /**
   * Log a simple string message (or number).
   */
  (msg: string | number): void;
  /**
   * Special case to log an `Error` instance to the record.
   * This adds an `err` field with exception details
   * (including the stack) and sets `msg` to the exception
   * message or you can specify the `msg`.
   */
  (error: Error, msg?: string, ...params: any[]): void;
  /**
   * The first field can optionally be a `fields` object, which
   * is merged into the log record.
   *
   * To pass in an Error *and* other fields, use the `err`
   * field name for the Error instance.
   */
  (obj: AnyObj, msg?: string, ...params: any[]): void;
  /**
   * Uses `util.format` for msg formatting.
   */
  (format: any, ...params: any[]): void;
}
```

## Logger

```ts
class Logger {
  trace: LoggerMethod;
  debug: LoggerMethod;
  info: LoggerMethod;
  warn: LoggerMethod;
  error: LoggerMethod;
  fatal: LoggerMethod;
  log(level: keyof Logger, ...args: any[]): void;
}
```

## LoggerConfig

```ts
class LoggerConfig {
  level = 'info';
  /**
   * Determines the depth of the inspect object to be logged.
   */
  depth?: number = 0;
}
```