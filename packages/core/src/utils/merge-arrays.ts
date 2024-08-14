import { Providers } from './providers.js';

export function mergeArrays<F, S>(arr1: Providers | F[] | undefined, arr2: Providers | S[] | undefined) {
  return [...(arr1 || []), ...(arr2 || [])];
}
