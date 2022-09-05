import { LogMediator } from '@ditsmod/core';

export class RouterLogMediator extends LogMediator {
  /**
   * Setting route '${fullPath}' in ${moduleName} failed: a handle is already registered for this path.
   */
  throwHandleAlreadyRegistered(fullPath: string) {
    this.raiseLog({ tags: ['route'] }, 'debug')
    const msg = `Setting route '${fullPath}' in ${this.moduleExtract.moduleName} failed: a handle is already registered for this path.`;
    throw new Error(msg);
  }
  /**
   * 
   */
  throwOnlyOneWildcardPerPath(path: string, fullPath: string) {
    const msg = `only one wildcard per path segment is allowed, has: '${path}' in path '${fullPath}'`;
    throw new Error(msg);
  }
  /**
   * 
   */
  throwWildcardRouteConflicts(path: string, fullPath: string) {
    const msg = `wildcard route '${path}' conflicts with existing children in path '${fullPath}'`;
    throw new Error(msg);
  }
  /**
   * 
   */
  throwWildcardsMustNonEmpty(fullPath: string) {
    const msg = `wildcards must be named with a non-empty name in path '${fullPath}'`;
    throw new Error(msg);
  }
  /**
   * 
   */
  throwCatchAllRoutesOnlyAtEnd(fullPath: string) {
    const msg = `catch-all routes are only allowed at the end of the path in path '${fullPath}'`;
    throw new Error(msg);
  }
  /**
   * 
   */
  throwCatchAllConflictWithExistingHandle(fullPath: string) {
    const msg = `catch-all conflicts with existing handle for the path segment root in path '${fullPath}'`;
    throw new Error(msg);
  }
  /**
   * 
   */
  throwNoBeforeCatchAll(fullPath: string) {
    const msg = `no / before catch-all in path '${fullPath}'`;
    throw new Error(msg);
  }
  /**
   * 
   */
  throwConflictsWithExistingWildcard(pathSeg: string, fullPath: string, treePath: string, prefix: string) {
    const msg = `'${pathSeg}' in new path '${fullPath}' conflicts with existing wildcard '${treePath}' in existing prefix '${prefix}'`;
    throw new Error(msg);
  }
  /**
   * 
   */
  throwInvalidNodeType() {
    throw new Error('invalid node type');
  }
}
