export class Logger {
  trace(...args: any[]): any {}
  debug(...args: any[]): any {}
  info(...args: any[]): any {}
  warn(...args: any[]): any {}
  error(...args: any[]): any {}
  fatal(...args: any[]): any {}
  log(level: keyof Logger, ...args: any[]): any {}
}

export class LoggerConfig {
  constructor(public level = 'info') {}
}
