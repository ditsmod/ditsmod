/**
 * Merge array of default options with array of input options.
 */
export function mergeOpts(defaults: any[], options: undefined | any[]) {
  return [...defaults, ...(options || [])];
}
