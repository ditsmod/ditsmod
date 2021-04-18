import { Logger } from '../src/logger';
import { getPathFile } from './util';
import { LogFields, Level } from '../src/types';

class Catcher {
  records: string[] = [];

  write(record: LogFields) {
    this.records.push(record.msg);
  }
}

describe(getPathFile(__filename), () => {
  const catcherStdout = new Catcher();
  const catcherStderr = new Catcher();
  let log: Logger;

  beforeAll(() => {
    log = new Logger({
      name: 'check-work-levels',
      streams: [
        {
          name: 'stdout',
          type: 'raw',
          stream: catcherStdout,
          level: 'debug'
        },
        {
          name: 'stderr',
          type: 'raw',
          stream: catcherStderr
        }
      ]
    });
  });
  it('Default debug level from log.level()', () => {
    expect(log.level()).toEqual(Level.debug);
  });
  it('Level for first steam is Level.debug', () => {
    expect(log.levels()[0]).toEqual(Level.debug);
    expect(log.levels(0)).toEqual(Level.debug);
  });
  it('Level for second steam is Level.info', () => {
    expect(log.levels()[1]).toEqual(Level.info);
    expect(log.levels(1)).toEqual(Level.info);
  });
  it('Second level is Level.info from log.levels', () => {
    expect(log.levels('stdout')).toEqual(Level.debug);
  });
  it('should throw error because trying get level non exists stream name', () => {
    expect(() => log.levels('foo')).toThrowError(/name/);
  });
  it('should output right level msg', () => {
    log.trace('no one should see this');
    log.debug('should see this once (on stdout)');
    log.info('should see this twice');
    log.levels('stdout', Level.info);
    log.debug('no one should see this either');
    log.level('trace');
    log.trace('should see this twice as 4th and 5th emitted log messages');
    expect(catcherStdout.records.length).toEqual(3);
    expect(catcherStdout.records[0]).toEqual('should see this once (on stdout)');
    expect(catcherStdout.records[1]).toEqual('should see this twice');
    expect(catcherStdout.records[2]).toEqual('should see this twice as 4th and 5th emitted log messages');
    expect(catcherStderr.records.length).toEqual(2);
    expect(catcherStderr.records[0]).toEqual('should see this twice');
    expect(catcherStderr.records[1]).toEqual('should see this twice as 4th and 5th emitted log messages');
  });
});
