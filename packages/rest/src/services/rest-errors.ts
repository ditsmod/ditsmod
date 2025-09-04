import { CustomError, HttpMethod } from '@ditsmod/core';

// export class X extends CustomError {
//   constructor() {
//     super();
//   }
// }
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
/**
 * `Validation of route "${methods} ${path}" failed: Guard.prototype.canActivate
 * must be a function, got: ${type} (in ${whatIsThis})`
 */
export class FailedValidationOfRoute extends CustomError {
  constructor(methods: string, path: string, type: string, whatIsThis: string) {
    super({
      msg1:
        `Validation of route "${methods} ${path}" failed: Guard.prototype.canActivate ` +
        `must be a function, got: ${type} (in ${whatIsThis})`,
      level: 'fatal',
    });
  }
}
/**
 * `Invalid configuration of route '${fullPath}' (in ${moduleName}): path cannot start with a slash`
 */
export class InvalidConfigurationOfRoute extends CustomError {
  constructor(moduleName: string, fullPath: string) {
    super({
      msg1: `Invalid configuration of route '${fullPath}' (in ${moduleName}): path cannot start with a slash`,
      level: 'fatal',
    });
  }
}
/**
 * `Could not find the required ${guardName} in the context of ${moduleName} for
 * route "${controllerName} -> ${httpMethod} /${path}". Lookup in ${levelNames} was unsuccessful.`
 */
export class GuardNotFound extends CustomError {
  constructor(
    moduleName: string,
    controllerName: string,
    guardName: string,
    httpMethod: HttpMethod | HttpMethod[],
    path: string,
    levelNames: string,
    perReq?: boolean,
  ) {
    let msg1 = `Could not find the required ${guardName} in the context of`;
    msg1 += ` ${moduleName} for route "${controllerName} -> ${httpMethod} /${path}".`;
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
 * `Appends to "${moduleName}" failed: "${appendedModuleName}" must have controllers.`
 */
export class ModuleMustHaveControllers extends CustomError {
  constructor(moduleName: string, appendedModuleName: string) {
    super({
      msg1: `Appends to "${moduleName}" failed: "${appendedModuleName}" must have controllers.`,
      level: 'fatal',
    });
  }
}
/**
 * `Appends to "${baseMeta.name}" failed: "${appendedBaseMeta.name}" includes in both: imports and appends arrays.`
 */
export class ModuleIncludesInImportsAndAppends extends CustomError {
  constructor(moduleName: string, appendedModuleName: string) {
    super({
      msg1: `Appends to "${moduleName}" failed: "${appendedModuleName}" includes in both: imports and appends arrays.`,
      level: 'fatal',
    });
  }
}
/**
 * Failed to apply HTTP interceptors to "${httpMethod} ${path}": expected the fourth parameter
 * of the route decorator to be an HttpInterceptor or an extension group token, but got: ${whatIsThis}.
 *
 */
export class InvalidInterceptor extends CustomError {
  constructor(httpMethods: string, path: string, whatIsThis: string) {
    super({
      msg1:
        `Failed to apply HTTP interceptors to "[${httpMethods}] ${path}": ` +
        'expected the fourth parameter of the route decorator to be an HttpInterceptor ' +
        `or an extension group token, but got: ${whatIsThis}.`,
      level: 'fatal',
    });
  }
}
/**
 * `Checking deps in sandbox for route "${controllerName} -> ${httpMethod} ${path}" failed`.
 */
export class CheckingDepsInSandboxFailed extends CustomError {
  constructor(cause: Error, controllerName: string, httpMethod: HttpMethod | HttpMethod[], path: string) {
    super(
      {
        msg1: `Checking deps in sandbox for route "${controllerName} -> ${httpMethod} ${path}" failed`,
        level: 'fatal',
      },
      cause,
    );
  }
}
/**
 * Setting route '${fullPath}' failed: a handle is already registered for this path.
 */
export class HandleAlreadyRegistered extends CustomError {
  constructor(fullPath: string) {
    super({
      msg1: `Setting route '${fullPath}' failed: a handle is already registered for this path.`,
      level: 'fatal',
    });
  }
}
/**
 * Only one wildcard per path segment is allowed, has: '${path}' in path '${fullPath}'
 */
export class OnlyOneWildcardPerPath extends CustomError {
  constructor(path: string, fullPath: string) {
    super({
      msg1: `Only one wildcard per path segment is allowed, has: '${path}' in path '${fullPath}'`,
      level: 'fatal',
    });
  }
}
/**
 * wildcard route '${path}' conflicts with existing children in path '${fullPath}'
 */
export class WildcardRouteConflicts extends CustomError {
  constructor(path: string, fullPath: string) {
    super({
      msg1: `wildcard route '${path}' conflicts with existing children in path '${fullPath}'`,
      level: 'fatal',
    });
  }
}
/**
 * wildcards must be named with a non-empty name in path '${fullPath}'
 */
export class WildcardsMustNonEmpty extends CustomError {
  constructor(fullPath: string) {
    super({
      msg1: `wildcards must be named with a non-empty name in path '${fullPath}'`,
      level: 'fatal',
    });
  }
}
/**
 * `catch-all routes are only allowed at the end of the path in path '${fullPath}'`
 */
export class CatchAllRoutesOnlyAtEnd extends CustomError {
  constructor(fullPath: string) {
    super({
      msg1: `catch-all routes are only allowed at the end of the path in path '${fullPath}'`,
      level: 'fatal',
    });
  }
}
/**
 * catch-all conflicts with existing handle for the path segment root in path '${fullPath}'
 */
export class CatchAllConflictWithExistingHandle extends CustomError {
  constructor(fullPath: string) {
    super({
      msg1: `catch-all conflicts with existing handle for the path segment root in path '${fullPath}'`,
      level: 'fatal',
    });
  }
}
/**
 * no / before catch-all in path '${fullPath}'
 */
export class NoBeforeCatchAll extends CustomError {
  constructor(fullPath: string) {
    super({
      msg1: `no / before catch-all in path '${fullPath}'`,
      level: 'fatal',
    });
  }
}
/**
 * '${pathSeg}' in new path '${fullPath}' conflicts with existing wildcard '${treePath}' in existing prefix '${prefix}'
 */
export class ConflictsWithExistingWildcard extends CustomError {
  constructor(pathSeg: string, fullPath: string, treePath: string, prefix: string) {
    super({
      msg1: `'${pathSeg}' in new path '${fullPath}' conflicts with existing wildcard '${treePath}' in existing prefix '${prefix}'`,
      level: 'fatal',
    });
  }
}
/**
 * invalid node type
 */
export class InvalidNodeType extends CustomError {
  constructor() {
    super({
      msg1: 'invalid node type',
      level: 'fatal',
    });
  }
}
