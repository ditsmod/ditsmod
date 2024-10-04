import {
  Class,
  ClassProvider,
  FactoryProvider,
  ResolvedProvider,
  TokenProvider,
  TypeProvider,
  ValueProvider,
} from '#di';
import { RequestContext } from './http-interceptor.js';
import { MetadataPerMod1 } from './metadata-per-mod.js';
import { ModuleWithParams } from './module-metadata.js';

export type ModuleType<T extends AnyObj = AnyObj> = Class<T>;
/**
 * Require only specified properties from the `K` list for `T`.
 * 
 * ### Example
 * 
```ts
interface SomeInterface {
  prop1?: string;
  prop2?: number;
  prop3?: boolean;
}

type ModifiedInterface = RequireProps<SomeInterface, 'prop1' | 'prop3'>;

const obj: ModifiedInterface = {
  prop1: 'Hello',  // Required
  prop3: true,     // Required
  // prop2 Remains optional
};
```
 */
export type RequireProps<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type AnyFn<T = any> = (...args: any[]) => T;

/**
 * It is just `{ [key: string]: any }` an object interface.
 */
export interface AnyObj {
  [key: string]: any;
}

export interface CanActivate {
  canActivate(ctx: RequestContext, params?: any[]): boolean | number | Promise<boolean | number>;
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

export interface ResolvedGuard {
  guard: ResolvedProvider;
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
 * See `TypeProvider`, `ValueProvider`, `ClassProvider`, `TokenProvider`, `FactoryProvider`.
 *
 * For more details, see the [Dependency Injection Guide](https://v4.angular.io/guide/dependency-injection).
 */
export type Provider = TypeProvider | ValueProvider | ClassProvider | TokenProvider | FactoryProvider;

export type Scope = 'Mod' | 'Rou' | 'Req';

export type Override<T extends object, K extends { [P in keyof T]?: any }> = Omit<T, keyof K> & K;

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
