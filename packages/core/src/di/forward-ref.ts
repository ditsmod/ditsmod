import { stringify } from '#di/stringify.js';

export const FORWARD_REF = Symbol();

/**
 * A type that a function passed into `forwardRef()` has to implement.
 *
 * ### Example
 *
```ts
const ref = forwardRef(() => Lock);
```
 */
export type ForwardRefFn<T = any> = () => T;

/**
 * Allows to refer to references which are not yet defined.
 *
 * For instance, `forwardRef` is used when the `token` which we need to refer to for the purposes of
 * DI is declared,
 * but not yet defined. It is also used when the `token` which we use when creating a query is not
 * yet defined.
 *
 * ### Example
```ts
class Door {
  lock: Lock;

  // Door attempts to inject Lock, despite it not being defined yet.
  // forwardRef makes this possible.
  constructor(@inject(forwardRef(() => Lock)) lock: Lock) { this.lock = lock; }
}

// Only at this point Lock is defined.
class Lock {}

const injector = Injector.resolveAndCreate([Door, Lock]);
const door = injector.get(Door);
expect(door instanceof Door).toBeTruthy();
expect(door.lock instanceof Lock).toBeTruthy();
```
 */
export function forwardRef(forwardRefFn: ForwardRefFn) {
  (forwardRefFn as any)[FORWARD_REF] = true;
  forwardRefFn.toString = function () {
    return stringify(this());
  };
  return forwardRefFn;
}

/**
 * Lazily retrieves the reference value from a forwardRef.
 *
 * Acts as the identity function when given a non-forward-ref value.
 *
 * ### Example:
 *
```ts
const ref = forwardRef(() => 'refValue');
expect(resolveForwardRef(ref)).toEqual('refValue');
expect(resolveForwardRef('regularValue')).toEqual('regularValue');
```
 * See: `forwardRef()`
 */
export function resolveForwardRef<T>(fn: T) {
  return (isForwardRef(fn) ? fn() : fn) as Exclude<T, ForwardRefFn>;
}

export function isForwardRef(arg?: any): arg is ForwardRefFn {
  return Boolean((arg as any)?.[FORWARD_REF]);
}

