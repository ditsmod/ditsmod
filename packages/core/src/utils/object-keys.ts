/**
 * This function is type-safe if the returned keys are used as an index in the object
 * from which they were taken. However, if you use the keys separately from the `obj`,
 * keep in mind that there may actually be more keys than `keyof T`.
 *
 * For more info, see https://github.com/microsoft/TypeScript/wiki/FAQ#indirect-excess-properties-are-ok
 */
export function objectKeys<T extends object>(obj?: T) {
  if (!obj) {
    return [];
  }
  return Object.keys(obj) as (keyof T)[];
}
