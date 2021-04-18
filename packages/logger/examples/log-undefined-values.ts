import { Logger } from '../src/logger';
import { LogFields } from '../src/types';

function replacer() {
  // Note: If node > 0.10, then could use Set here (see `safeCyclesSet()`
  // in bunyan.js) for a performance improvement.
  const seen = [];
  return (key, val) => {
    if (val === undefined) {
      return '[Undefined]';
    } else if (!val || typeof val != 'object') {
      return val;
    }
    if (seen.indexOf(val) !== -1) {
      return '[Circular]';
    }
    seen.push(val);
    return val;
  };
}

class LogUndefinedValuesStream {
  constructor(public stream: NodeJS.WriteStream) {}

  write(rec: LogFields) {
    const str = JSON.stringify(rec, replacer()) + '\n';
    this.stream.write(str);
  }
}

const log = new Logger({
  name: 'log-undefined-values',
  streams: [
    {
      level: 'info',
      type: 'raw',
      stream: new LogUndefinedValuesStream(process.stdout)
    }
  ]
});

log.info({ anull: null, aundef: undefined, anum: 42, astr: 'foo' }, 'hi');
