import { Logger } from '../src/logger';

const log = new Logger({
  name: 'amon',
  streams: [
    {
      level: 'info',
      stream: process.stdout
    },
    {
      level: 'error',
      path: __dirname + '/multi.log'
    }
  ]
});

log.debug('hi nobody on debug');
log.info('hi stdout on info');
log.error('hi both on error');
log.fatal('hi both on fatal');
