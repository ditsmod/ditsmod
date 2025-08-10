import { Class, Injector, ResolvedProvider } from '#di';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { Providers } from '#utils/providers.js';

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
export type ModRefId<T extends AnyObj = AnyObj> = ModuleType<T> | ModuleWithParams<T>;
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
export type AnyFn<Args extends any[] = any[], Return = any> = (...args: Args) => Return;

/**
 * It is just `{ [key: string | symbol]: any }` an object interface.
 */
export interface AnyObj {
  [key: string | symbol]: any;
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
 * Level imports/exports.
 */
export type Level = 'Mod';

export type Override<T extends object, K extends { [P in keyof T]?: unknown }> = Omit<T, keyof K> & K;

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
