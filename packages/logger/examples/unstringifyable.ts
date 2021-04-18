import { Logger } from '../src/logger';

// See how bunyan behaves with an un-stringify-able object.

const log = new Logger({ src: true, name: 'foo' });

// Make a circular object (cannot be JSON-ified).
const myobj = { foo: 'bar' } as any;
myobj.myobj = myobj;

log.info({ obj: myobj }, 'hi there'); // <--- here
