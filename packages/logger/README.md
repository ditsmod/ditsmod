`@ditsmod/logger` is a fork of popular library `bunyan` from [this state](https://github.com/trentm/node-bunyan/tree/fe31b8).
`@ditsmod/logger` is **a simple and fast JSON logging library** writen on TypeScript for node.js services:

```ts
import { Logger } from '@ditsmod/logger';

const log = new Logger({name: 'myapp'});
log.info('hi');
```

See usage in [tests](test)
