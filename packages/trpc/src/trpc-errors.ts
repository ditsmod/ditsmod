import { CustomError } from '@ditsmod/core';

/**
 * `http2.createSecureServer() not found (see the settings in main.ts)`
 */
export class CreateSecureServerInHttp2NotFound extends CustomError {
  constructor() {
    super({
      msg1: 'http2.createSecureServer() not found (see the settings in main.ts)',
      level: 'fatal',
    });
  }
}
