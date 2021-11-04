import { format } from 'util';

import { Logger, LoggerConfig } from '../types/logger';
import { DefaultLogger } from './default-logger';
import { Log, LogItem } from './log';

describe('Log', () => {
  class LogMock extends Log {
    override moduleAlreadyImported(level: keyof Logger, ...args: any[]) {
      this.setLog(level, `${format(args[0])}, ${args[1]}`);
    }
  }

  let log: LogMock;

  beforeEach(() => {
    const config = new LoggerConfig();
    const logger = new DefaultLogger(config) as Logger;
    log = new LogMock(logger, []);
  });

  it('new LogMock should to have buffer whith empty an array', () => {
    expect(log.bufferLogs).toBeUndefined();
    expect(log.buffer).toEqual([]);
  });

  it(`after setting message to some LogMock's methods, buffer should have this message`, () => {
    class One {}
    log.bufferLogs = true;
    log.moduleAlreadyImported('trace', One, 'two');
    expect(log.buffer.length).toBe(1);
    expect(log.buffer[0].level).toEqual('trace');
    expect(log.buffer[0].msg).toEqual('[class One], two');
    log.flush();
    expect(log.buffer).toEqual([]);
  });

  it(`after sets to LogMock's constructor some message, buffer should have this message`, () => {
    const config = new LoggerConfig();
    const logger = new DefaultLogger(config) as Logger;
    const logItem = { date: new Date(), level: 'debug', msg: 'three' } as LogItem;
    log = new LogMock(logger, [logItem]);
    class One {}
    log.bufferLogs = true;
    expect(log.buffer).toEqual([logItem]);
    log.moduleAlreadyImported('trace', One, 'two');
    expect(log.buffer[0]).toEqual(logItem);
    expect(log.buffer.length).toBe(2);
    expect(log.buffer[1].level).toEqual('trace');
    expect(log.buffer[1].msg).toEqual('[class One], two');
    log.flush();
    expect(log.buffer).toEqual([]);
  });
});
