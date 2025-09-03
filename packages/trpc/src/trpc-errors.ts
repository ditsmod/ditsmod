import { CustomError } from '@ditsmod/core';

/**
 * Failed to apply HTTP interceptors: expected the fourth parameter
 * of the route decorator to be an HttpInterceptor or an extension group token, but got: ${whatIsThis}.
 *
 */
export class InvalidInterceptor extends CustomError {
  constructor(whatIsThis: string) {
    super({
      msg1:
        'Failed to apply HTTP interceptors: ' +
        'expected the fourth parameter of the route decorator to be an HttpInterceptor ' +
        `or an extension group token, but got: ${whatIsThis}.`,
      level: 'fatal',
    });
  }
}
/**
 * `Import with guards failed: Guard.prototype.canActivate must be a function, got: ${type}`
 */
export class InvalidGuard extends CustomError {
  constructor(type: string) {
    super({
      msg1: `Import with guards failed: Guard.prototype.canActivate must be a function, got: ${type}`,
      level: 'fatal',
    });
  }
}
/**
 * `Detected duplicate controllers - ${controllersList}`.
 */
export class DuplicateOfControllers extends CustomError {
  constructor(controllersList: string) {
    super({
      msg1: `Detected duplicate controllers - ${controllersList}`,
      level: 'fatal',
    });
  }
}
/**
 * `Collecting controller's metadata failed: class ${controllerName}" does not have the "@controller()" decorator.`
 */
export class ControllerDoesNotHaveDecorator extends CustomError {
  constructor(controllerName: string) {
    super({
      msg1: `Collecting controller's metadata failed: class ${controllerName}" does not have the "@controller()" decorator.`,
      level: 'fatal',
    });
  }
}

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
