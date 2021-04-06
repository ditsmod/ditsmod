import { Type } from '@ts-stack/di';

import { ProvidersMetadata } from '../models/providers-metadata';

export type ModuleType<T extends AnyObj = AnyObj> = Type<T>;

export interface ModuleWithParams<T extends AnyObj = AnyObj> extends Partial<ProvidersMetadata> {
  id?: string;
  module: ModuleType<T>;
  prefix?: string;
  guards?: GuardItem[];
  [key: string]: any;
}

export type AnyFn = (...args: any[]) => any;

/**
 * It is just `{ [key: string]: any }` an object interface.
 */
 export interface AnyObj {
  [key: string]: any;
}

export interface CanActivate {
  canActivate(params?: any[]): boolean | number | Promise<boolean | number>;
}

export type ControllerType = Type<any>;

export interface DecoratorMetadata<MV extends AnyObj = AnyObj> {
  otherDecorators: any[];
  /**
   * Decorator value.
   */
  value: MV;
}

export type GuardItem = Type<CanActivate> | [Type<CanActivate>, any, ...any[]];

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
 | 'UNSUBSCRIBE'
 | 'ALL';
