import { HttpMethod } from '@ditsmod/core';
import { newCustomError } from '@ditsmod/core/errors';

export const restErrors = {
  /**
   * Failed to apply HTTP interceptors to "${httpMethod} ${path}": expected the fourth parameter
   * of the route decorator to be an HttpInterceptor or an extension group token, but got: ${whatIsThis}.
   *
   */
  invalidInterceptor(httpMethods: string, path: string, whatIsThis: string) {
    return newCustomError(restErrors.invalidInterceptor, {
      msg1:
        `Failed to apply HTTP interceptors to "[${httpMethods}] ${path}": ` +
        'expected the fourth parameter of the route decorator to be an HttpInterceptor ' +
        `or an extension group token, but got: ${whatIsThis}.`,
      level: 'fatal',
    });
  },
  /**
   * `Checking deps in "sandbox" for failed`.
   */
  checkingDepsInSandboxFailed(
    cause: Error,
    controllerName: string,
    httpMethod: HttpMethod | HttpMethod[],
    path: string,
  ) {
    return newCustomError(
      restErrors.checkingDepsInSandboxFailed,
      {
        msg1: `Checking deps in sandbox for route "${controllerName} -> ${httpMethod} ${path}" failed`,
        level: 'fatal',
      },
      cause,
    );
  },
  /**
   * Setting route '${fullPath}' failed: a handle is already registered for this path.
   */
  handleAlreadyRegistered(fullPath: string) {
    return newCustomError(restErrors.handleAlreadyRegistered, {
      msg1: `Setting route '${fullPath}' failed: a handle is already registered for this path.`,
      level: 'fatal',
    });
  },
  /**
   * Only one wildcard per path segment is allowed, has: '${path}' in path '${fullPath}'
   */
  onlyOneWildcardPerPath(path: string, fullPath: string) {
    return newCustomError(restErrors.onlyOneWildcardPerPath, {
      msg1: `Only one wildcard per path segment is allowed, has: '${path}' in path '${fullPath}'`,
      level: 'fatal',
    });
  },
  /**
   * wildcard route '${path}' conflicts with existing children in path '${fullPath}'
   */
  wildcardRouteConflicts(path: string, fullPath: string) {
    return newCustomError(restErrors.wildcardRouteConflicts, {
      msg1: `wildcard route '${path}' conflicts with existing children in path '${fullPath}'`,
      level: 'fatal',
    });
  },
  /**
   * wildcards must be named with a non-empty name in path '${fullPath}'
   */
  wildcardsMustNonEmpty(fullPath: string) {
    return newCustomError(restErrors.wildcardsMustNonEmpty, {
      msg1: `wildcards must be named with a non-empty name in path '${fullPath}'`,
      level: 'fatal',
    });
  },
  /**
   *
   */
  catchAllRoutesOnlyAtEnd(fullPath: string) {
    return newCustomError(restErrors.catchAllRoutesOnlyAtEnd, {
      msg1: `catch-all routes are only allowed at the end of the path in path '${fullPath}'`,
      level: 'fatal',
    });
  },
  /**
   * catch-all conflicts with existing handle for the path segment root in path '${fullPath}'
   */
  catchAllConflictWithExistingHandle(fullPath: string) {
    return newCustomError(restErrors.catchAllConflictWithExistingHandle, {
      msg1: `catch-all conflicts with existing handle for the path segment root in path '${fullPath}'`,
      level: 'fatal',
    });
  },
  /**
   * no / before catch-all in path '${fullPath}'
   */
  noBeforeCatchAll(fullPath: string) {
    return newCustomError(restErrors.noBeforeCatchAll, {
      msg1: `no / before catch-all in path '${fullPath}'`,
      level: 'fatal',
    });
  },
  /**
   * '${pathSeg}' in new path '${fullPath}' conflicts with existing wildcard '${treePath}' in existing prefix '${prefix}'
   */
  conflictsWithExistingWildcard(pathSeg: string, fullPath: string, treePath: string, prefix: string) {
    return newCustomError(restErrors.conflictsWithExistingWildcard, {
      msg1: `'${pathSeg}' in new path '${fullPath}' conflicts with existing wildcard '${treePath}' in existing prefix '${prefix}'`,
      level: 'fatal',
    });
  },
  /**
   * invalid node type
   */
  invalidNodeType() {
    return newCustomError(restErrors.invalidNodeType, {
      msg1: 'invalid node type',
      level: 'fatal',
    });
  },
};
