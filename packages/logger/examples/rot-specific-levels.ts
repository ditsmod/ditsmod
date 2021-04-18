import { Logger } from '../src/logger';
import { safeCycles } from '../src/utils';
import { LogFields } from '../src/types';

class SpecificLevelStream {
  levels: {};
  stream: LogFields;

  constructor(levels, stream) {
    const self = this;
    this.levels = {};
    levels.forEach(lvl => {
      self.levels[Logger.resolveLevel(lvl)] = true;
    });
    this.stream = stream;
  }

  write(rec) {
    if (this.levels[rec.level] !== undefined) {
      const str = JSON.stringify(rec, safeCycles()) + '\n';
      this.stream.write(str);
    }
  }
}

const log = new Logger({
  name: 'rot-specific-levels',
  streams: [
    {
      type: 'raw',
      level: 'debug',
      stream: new SpecificLevelStream(
        ['debug'],
        new Logger.RotatingFileStream({
          path: __dirname + '/rot-specific-levels.debug.log',
          period: '3000ms',
          count: 10
        })
      )
    },
    {
      type: 'raw',
      level: 'info',
      stream: new SpecificLevelStream(
        ['info'],
        new Logger.RotatingFileStream({
          path: __dirname + '/rot-specific-levels.info.log',
          period: '3000ms',
          count: 10
        })
      )
    }
  ]
});

setInterval(() => {
  log.trace('hi on trace'); // goes nowhere
  log.debug('hi on debug'); // goes to rot-specific-levels.debug.log.*
  log.info('hi on info'); // goes to rot-specific-levels.info.log.*
}, 1000);
