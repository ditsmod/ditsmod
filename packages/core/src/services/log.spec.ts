import { format } from 'util';

import { Logger, LoggerConfig } from '../types/logger';
import { DefaultLogger } from './default-logger';
import { Log } from './log';

describe('Log', () => {
  class LogMock extends Log {
    override bufferLogs = true;

    override moduleAlreadyImported(level: keyof Logger, ...args: any[]) {
      this.setLog(level, `${format(args[0])}, ${args[1]}`);
    }
  }

  let log: LogMock;

  beforeEach(() => {
    const config = new LoggerConfig();
    const logger = new DefaultLogger(config) as Logger;
    log = new LogMock(logger);
  });

  it('case 1', () => {
    expect(log.bufferLogs).toBe(true);
    expect(log.buffer).toEqual([]);
  });

  it('case 2', () => {
    class One {}
    log.moduleAlreadyImported('trace', One, 'two');
    expect(log.buffer.length).toBe(1);
    expect(log.buffer[0].level).toEqual('trace');
    expect(log.buffer[0].msg).toEqual('[class One], two');
    log.flush();
    expect(log.buffer).toEqual([]);
  });
});
