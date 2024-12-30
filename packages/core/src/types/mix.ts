import {
  Class,
  ClassProvider,
  FactoryProvider,
  Injector,
  ResolvedProvider,
  TokenProvider,
  TypeProvider,
  ValueProvider,
} from '#di';
import { RequestContext } from '#services/request-context.js';
import { MetadataPerMod1 } from '#types/metadata-per-mod.js';
import { AppendsWithParams, ModuleWithParams } from '#types/module-metadata.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';

/**
 * Help type for combining interfaces.
 * 
 * ### Usage
 * 
 * The following example shows a base class whose instance can be dynamically extended
 * by plugins using the `$use()` method.
 * 
```ts
import { Class, UnionToIntersection } from '@ditsmod/core';

class Base {
  $use<T extends Class<Base>[]>(...Plugins: T) {
    Plugins.forEach((Plugin) => {
      Object.getOwnPropertyNames(Plugin.prototype)
        .filter((p) => p != 'constructor')
        .forEach((p) => {
          (this as any)[p] = Plugin.prototype[p];
        });
    });

    return this as UnionToIntersection<InstanceType<T[number]>> & this;
  }
}
```
 */
export type UnionToIntersection<U> = (U extends any ? (x: U) => any : never) extends (x: infer I) => any ? I : never;

export type ModuleType<T extends AnyObj = AnyObj> = Class<T>;
/**
 * Module reference ID.
 */
export type ModRefId = ModuleType | ModuleWithParams | AppendsWithParams;
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
export type RequireOnlyProps<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>;

export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type AnyFn<T = any> = (...args: any[]) => T;

/**
 * It is just `{ [key: string | symbol]: any }` an object interface.
 */
export interface AnyObj {
  [key: string | symbol]: any;
}

export interface CanActivate {
  canActivate(ctx: RequestContext, params?: any[]): boolean | Response | Promise<boolean | Response>;
}

export type AppMetadataMap = Map<ModuleType | ModuleWithParams, MetadataPerMod1>;
export type GuardItem = Class<CanActivate> | [Class<CanActivate>, any, ...any[]];

export interface NormalizedGuard {
  guard: Class<CanActivate>;
  params?: any[];
}

export class ProvidersForMod {
  providersPerMod: Provider[] = [];
  providersPerRou: Provider[] = [];
  providersPerReq: Provider[] = [];
}

export interface GuardPerMod1 extends NormalizedGuard {
  meta: NormalizedModuleMetadata;
}

export interface ResolvedGuardPerMod {
  guard: ResolvedProvider;
  injectorPerRou: Injector;
  resolvedPerReq?: ResolvedProvider[];
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

/**
 * Scope imports/exports.
 */
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
