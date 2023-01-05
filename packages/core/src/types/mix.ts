import {
  ClassProvider,
  TokenProvider,
  FactoryProvider,
  InjectionToken,
  Class,
  TypeProvider,
  ValueProvider,
} from '../di';

import { MetadataPerMod1 } from './metadata-per-mod';
import { ProvidersMetadata } from '../models/providers-metadata';

export type ModuleType<T extends AnyObj = AnyObj> = Class<T>;

export type ExtensionsGroupToken<T = any> = InjectionToken<Extension<T>[]> | `BEFORE ${string}`;
export type ExtensionType<T = any> = Class<Extension<T>>;

export interface Extension<T> {
  init(isLastExtensionCall: boolean): Promise<T>;
}

export type ExtensionProvider =
  | TypeProvider
  | ((ClassProvider | TokenProvider | FactoryProvider | ValueProvider) & { multi: true });

export interface ModuleWithParams<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj>
  extends Partial<ProvidersMetadata> {
  id?: string;
  module: ModuleType<M>;
  path?: string;
  /**
   * List of modules, `ModuleWithParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  guards?: GuardItem[];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta?: E;
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

export interface DecoratorMetadata<MV extends AnyObj = AnyObj> {
  otherDecorators: any[];
  /**
   * Decorator value.
   */
  value: MV;
  decorator: AnyFn;
}
export type AppMetadataMap = Map<ModuleType | ModuleWithParams, MetadataPerMod1>;
export type GuardItem = Class<CanActivate> | [Class<CanActivate>, any, ...any[]];

export interface NormalizedGuard {
  guard: Class<CanActivate>;
  params?: any[];
}

/**
 * See also https://en.wikipedia.org/wiki/URL_redirection#HTTP_status_codes_3xx
 */
export type RedirectStatusCodes = 300 | 301 | 302 | 303 | 307 | 308;

/**
 * Describes how the `Injector` should be configured.
 *
 * ### How To Use
 * See `TypeProvider`, `ValueProvider`, `ClassProvider`, `ExistingProvider`, `FactoryProvider`.
 *
 * For more details, see the [Dependency Injection Guide](https://v4.angular.io/guide/dependency-injection).
 */
export type ServiceProvider = TypeProvider | ValueProvider | ClassProvider | TokenProvider | FactoryProvider;

export type Scope = 'Mod' | 'Rou' | 'Req';

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
