import * as assert from 'assert-plus';

import { RequestListener, ApplicationOptions, Logger } from './types';

export class Application {
  protected readonly options: ApplicationOptions;
  protected serverName: string;
  log: Logger;

  constructor(options?: ApplicationOptions) {
    assert.optionalObject(options, 'options');
    if (Array.isArray(options)) {
      throw new TypeError('Invalid server options - only object are allowed, got: array');
    }
    this.options = options = { ...options };

    assert.optionalObject(options.log, 'options.log');
    if (options.log && typeof options.log.debug != 'function') {
      throw new TypeError(
        `Invalid "options.log.debug()" - only function are allowed, got: ${typeof options.log.debug}`
      );
    }
    this.log = options.log || { debug: () => {} };

    assert.optionalString(options.serverName, 'options.serverName');
    this.serverName = options.serverName || 'restify-ts';

    this.log.debug('Created instance of Application');
  }

  requestListener: RequestListener = (request, response) => {
    response.setHeader('server', this.serverName);
    response.end('Hello World!');
  };
}
