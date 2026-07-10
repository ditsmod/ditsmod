import type { ProviderBuilder } from './providers.js';

export function mergeArrays<F, S>(arr1: ProviderBuilder | F[] | undefined, arr2: ProviderBuilder | S[] | undefined) {
  return [...(arr1 || []), ...(arr2 || [])];
}
