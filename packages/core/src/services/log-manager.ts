import { Injectable } from '@ts-stack/di';

import { LogItem } from './log';

/**
 * Holds the log buffer, and indicates whether to send logs to the buffer.
 */
@Injectable()
export class LogManager {
  /**
   * If `bufferLogs === true` then all messages will be buffered.
   *
   * If you need logging all buffered messages, call `log.flush()`.
   */
  bufferLogs: boolean = true;
  readonly buffer: LogItem[] = [];
}
