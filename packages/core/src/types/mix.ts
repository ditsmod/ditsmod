import type { DynamicModule } from '#decorators/module-decorator-options.js';
import type { Injector } from '#di/injector.js';
import type { ResolvedProvider } from '#di/top/resolved-provider.js';
import type { Class } from '#di/top/types-and-models.js';

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
export type ModRefId<T extends AnyObj = AnyObj> = ModuleType<T> | DynamicModule<T>;
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
export type OmitProps<T extends AnyObj, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/**
 * Allows shortening the list of an object's properties.
 */
export type PickProps<T extends AnyObj, K extends keyof T> = { [P in K]: T[P] };
export type RequireOnlyProps<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>;
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
/**
 * It is just `{ [key: string | symbol]: any }` an object interface.
 */
export interface AnyObj<T = any> {
  [key: string | symbol]: T;
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
 * Level of imports/exports.
 */
export type Level = 'Mod' | 'Rou' | 'Req';

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
  | 'QUERY'
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
