import { Logger } from '../src/logger';

const log = new Logger({
  name: 'default',
  streams: [{
    path: __dirname + '/log.spec.rot.log',
    type: 'rotating-file'
  }]
});
console.log('done');
