import {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  InjectionToken,
  Type,
  TypeProvider,
  ValueProvider,
} from '@ts-stack/di';

import { MetadataPerMod1 } from './metadata-per-mod';
import { ProvidersMetadata } from '../models/providers-metadata';

export type ModuleType<T extends AnyObj = AnyObj> = Type<T>;

export type ExtensionsGroupToken<T = any> = InjectionToken<Extension<T>[]> | `BEFORE ${string}`;

export interface Extension<T> {
  init(isLastExtensionCall: boolean): Promise<T>;
}

export type ExtensionsProvider =
  | TypeProvider
  | ((ClassProvider | ExistingProvider | FactoryProvider | ValueProvider) & { multi: true });

export interface ModuleWithParams<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj>
  extends Partial<ProvidersMetadata> {
  id?: string;
  module: ModuleType<M>;
  prefix?: string;
  guards?: GuardItem[];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `additionalMeta` object.
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

export type ControllerType = Type<any>;

export interface DecoratorMetadata<MV extends AnyObj = AnyObj> {
  otherDecorators: any[];
  /**
   * Decorator value.
   */
  value: MV;
}
export type AppMetadataMap = Map<ModuleType | ModuleWithParams, MetadataPerMod1>;
export type GuardItem = Type<CanActivate> | [Type<CanActivate>, any, ...any[]];

export interface MultipartBodyParserOptions {
  overrideParams?: boolean;
  multiples?: boolean;
  keepExtensions?: boolean;
  uploadDir?: string;
  maxFieldsSize?: number;
  hash?: string;
  multipartFileHandler?: AnyFn;
  multipartHandler?: AnyFn;
  mapParams?: boolean;
  mapFiles?: boolean;
}

export interface NormalizedGuard {
  guard: Type<CanActivate>;
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
export type ServiceProvider = TypeProvider | ValueProvider | ClassProvider | ExistingProvider | FactoryProvider;

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
