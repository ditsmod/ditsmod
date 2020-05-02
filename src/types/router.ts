import { ReflectiveInjector, ResolvedReflectiveProvider, TypeProvider, Type } from '@ts-stack/di';
import { ObjectAny } from './types';
import { ModuleType, ModuleWithOptions } from '../decorators/module';

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

export interface ImportsWithPrefixDecorator {
  prefix: string;
  module: Type<any> | ModuleWithOptions<any> | any[];
}

export interface ImportsWithPrefix {
  prefix: string;
  module: ModuleType | ModuleWithOptions<any>;
}
