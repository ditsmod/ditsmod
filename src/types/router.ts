import { ReflectiveInjector, ResolvedReflectiveProvider, TypeProvider } from '@ts-stack/di';
import { ObjectAny } from './types';

/**
 * `http.METHODS`
 */
export type HttpMethod =
  | 'ACL'
  | 'BIND'
  | 'CHECKOUT'
  | 'CONNECT'
  | 'COPY'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'LINK'
  | 'LOCK'
  | 'M-SEARCH'
  | 'MERGE'
  | 'MKACTIVITY'
  | 'MKCALENDAR'
  | 'MKCOL'
  | 'MOVE'
  | 'NOTIFY'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'PURGE'
  | 'PUT'
  | 'REBIND'
  | 'REPORT'
  | 'SEARCH'
  | 'SOURCE'
  | 'SUBSCRIBE'
  | 'TRACE'
  | 'UNBIND'
  | 'UNLINK'
  | 'UNLOCK'
  | 'UNSUBSCRIBE';

export type RouteHandler = () => {
  /**
   * Injector per module.
   */
  injector: ReflectiveInjector;
  /**
   * Resolved providers per request.
   */
  providers: ResolvedReflectiveProvider[];
  controller: TypeProvider;
  /**
   * Method of the class controller.
   */
  method: string;
  /**
   * Need or not to parse body.
   */
  parseBody: boolean;
  routeData: any;
};

export class Router {
  on(method: HttpMethod, path: string, handle: RouteHandler): this {
    return this;
  }

  all(path: string, handle: RouteHandler): this {
    return this;
  }

  find(method: HttpMethod, path: string): RouterReturns {
    return { handle: null, params: null };
  }
}

export class RouterReturns {
  handle: RouteHandler;
  params: RouteParam[];
}

export interface RouteParam {
  key: string;
  value: string;
}

export abstract class RouteConfig {
  /**
   * The path to match against. A URL string that uses router matching notation.
   * Default is "/" (the root path).
   */
  path: string;
  controller?: TypeProvider;
  /**
   * A URL to which to redirect when a the path matches.
   * Absolute if the URL begins with a slash (/), otherwise relative to the path URL.
   * When not present, router does not redirect.
   */
  redirectTo?: string;
  /**
   * An array of DI tokens used to look up `CanActivate()` handlers,
   * in order to determine if the current user is allowed to activate the controller.
   * By default, any user can activate.
   */
  canActivate?: any[];
  /**
   * An array of DI tokens used to look up `CanActivateChild()` handlers,
   * in order to determine if the current user is allowed to activate a child of the controller.
   * By default, any user can activate a child.
   */
  canActivateChild?: any[];
  /**
   * Additional developer-defined data provided to the controller via `req: Request`.
   * By default, no additional data is passed.
   */
  routeData?: any;
  /**
   * A map of DI tokens used to look up data resolvers. See `Resolve`.
   */
  resolve?: ObjectAny;
  /**
   * An array of child Route objects that specifies a nested route configuration.
   */
  children?: this[];
}

export interface RootModules {
  prefix: string;
  rootModule: TypeProvider;
}
