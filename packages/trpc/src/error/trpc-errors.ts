import { CustomError } from '@ditsmod/core';

/**
 * `Checking deps in sandbox for "${controllerName}" failed`.
 */
export class CheckingDepsInSandboxFailed extends CustomError {
  constructor(cause: Error, controllerName: string) {
    super(
      {
        msg1: `Checking deps in sandbox for "${controllerName}" failed`,
        level: 'fatal',
      },
      cause,
    );
  }
}
/**
 * `Could not find the required ${guardName} in the context of ${moduleName} for
 * route "${controllerName}". Lookup in ${levelNames} was unsuccessful.`
 */
export class GuardNotFound extends CustomError {
  constructor(moduleName: string, controllerName: string, guardName: string, levelNames: string, perReq?: boolean) {
    let msg1 = `Could not find the required ${guardName} in the context of`;
    msg1 += ` ${moduleName} for "${controllerName}".`;
    msg1 += ` Lookup in ${levelNames} was unsuccessful.`;
    if (!perReq) {
      msg1 += ` Notice that ${controllerName} has "{ scope: 'ctx' }" in its metadata.`;
    }
    super({
      msg1,
      level: 'fatal',
    });
  }
}
/**
 * `Guard.prototype.canActivate must be a function, got: ${type} (in ${whatIsThis})`
 */
export class FailedValidationOfRoute extends CustomError {
  constructor(type: string, whatIsThis: string) {
    super({
      msg1: `Guard.prototype.canActivate must be a function, got: ${type} (in ${whatIsThis})`,
      level: 'fatal',
    });
  }
}
/**
 * Failed to apply HTTP interceptors: expected the second parameter
 * of the route decorator to be an HttpInterceptor or an extension group token, but got: ${whatIsThis}.
 *
 */
export class InvalidInterceptor extends CustomError {
  constructor(whatIsThis: string) {
    super({
      msg1:
        'Failed to apply HTTP interceptors: ' +
        'expected the second parameter of the route decorator to be an HttpInterceptor ' +
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
 * `Collecting trpcController's metadata failed: class ${controllerName}" does not have the "@trpcController()" decorator.`
 */
export class ControllerDoesNotHaveDecorator extends CustomError {
  constructor(controllerName: string) {
    super({
      msg1: `Collecting trpcController's metadata failed: class ${controllerName}" does not have the "@trpcController()" decorator.`,
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
