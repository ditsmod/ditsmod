import { CustomError, HttpMethod } from '@ditsmod/core';

export class RestErrorMediator {
  /**
   * Failed to apply HTTP interceptors to "${httpMethod} ${path}": expected the fourth parameter
   * of the route decorator to be an HttpInterceptor or an extension group token, but got: ${whatIsThis}.
   *
   */
  static invalidInterceptor(httpMethods: string, path: string, whatIsThis: string) {
    return new CustomError({
      code: RestErrorMediator.invalidInterceptor.name,
      msg1:
        `Failed to apply HTTP interceptors to "[${httpMethods}] ${path}": ` +
        'expected the fourth parameter of the route decorator to be an HttpInterceptor ' +
        `or an extension group token, but got: ${whatIsThis}.`,
      level: 'fatal',
    });
  }
  /**
   * `Checking deps in "sandbox" for failed`.
   */
  static checkingDepsInSandboxFailed(
    cause: Error,
    controllerName: string,
    httpMethod: HttpMethod | HttpMethod[],
    path: string,
  ) {
    return new CustomError(
      {
        code: RestErrorMediator.checkingDepsInSandboxFailed.name,
        msg1: `Checking deps in sandbox for route "${controllerName} -> ${httpMethod} ${path}" failed`,
        level: 'fatal',
        constructorOpt: RestErrorMediator.checkingDepsInSandboxFailed,
      },
      cause,
    );
  }
  /**
   * Setting route '${fullPath}' failed: a handle is already registered for this path.
   */
  static handleAlreadyRegistered(fullPath: string) {
    return new CustomError({
      code: RestErrorMediator.handleAlreadyRegistered.name,
      msg1: `Setting route '${fullPath}' failed: a handle is already registered for this path.`,
      level: 'fatal',
    });
  }
  /**
   * Only one wildcard per path segment is allowed, has: '${path}' in path '${fullPath}'
   */
  static onlyOneWildcardPerPath(path: string, fullPath: string) {
    return new CustomError({
      code: RestErrorMediator.onlyOneWildcardPerPath.name,
      msg1: `Only one wildcard per path segment is allowed, has: '${path}' in path '${fullPath}'`,
      level: 'fatal',
    });
  }
  /**
   * wildcard route '${path}' conflicts with existing children in path '${fullPath}'
   */
  static wildcardRouteConflicts(path: string, fullPath: string) {
    return new CustomError({
      code: RestErrorMediator.wildcardRouteConflicts.name,
      msg1: `wildcard route '${path}' conflicts with existing children in path '${fullPath}'`,
      level: 'fatal',
    });
  }
  /**
   * wildcards must be named with a non-empty name in path '${fullPath}'
   */
  static wildcardsMustNonEmpty(fullPath: string) {
    return new CustomError({
      code: RestErrorMediator.wildcardsMustNonEmpty.name,
      msg1: `wildcards must be named with a non-empty name in path '${fullPath}'`,
      level: 'fatal',
    });
  }
  /**
   *
   */
  static catchAllRoutesOnlyAtEnd(fullPath: string) {
    return new CustomError({
      code: RestErrorMediator.catchAllRoutesOnlyAtEnd.name,
      msg1: `catch-all routes are only allowed at the end of the path in path '${fullPath}'`,
      level: 'fatal',
    });
  }
  /**
   * catch-all conflicts with existing handle for the path segment root in path '${fullPath}'
   */
  static catchAllConflictWithExistingHandle(fullPath: string) {
    return new CustomError({
      code: RestErrorMediator.catchAllConflictWithExistingHandle.name,
      msg1: `catch-all conflicts with existing handle for the path segment root in path '${fullPath}'`,
      level: 'fatal',
    });
  }
  /**
   * no / before catch-all in path '${fullPath}'
   */
  static noBeforeCatchAll(fullPath: string) {
    return new CustomError({
      code: RestErrorMediator.noBeforeCatchAll.name,
      msg1: `no / before catch-all in path '${fullPath}'`,
      level: 'fatal',
    });
  }
  /**
   * '${pathSeg}' in new path '${fullPath}' conflicts with existing wildcard '${treePath}' in existing prefix '${prefix}'
   */
  static conflictsWithExistingWildcard(pathSeg: string, fullPath: string, treePath: string, prefix: string) {
    return new CustomError({
      code: RestErrorMediator.conflictsWithExistingWildcard.name,
      msg1: `'${pathSeg}' in new path '${fullPath}' conflicts with existing wildcard '${treePath}' in existing prefix '${prefix}'`,
      level: 'fatal',
    });
  }
  /**
   * invalid node type
   */
  static invalidNodeType() {
    return new CustomError({
      code: RestErrorMediator.invalidNodeType.name,
      msg1: 'invalid node type',
      level: 'fatal',
    });
  }
}
