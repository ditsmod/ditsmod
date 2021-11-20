export function mergeArrays<F, S>(arr1: F[] | undefined, arr2: S[] | undefined) {
  return [...(arr1 || []), ...(arr2 || [])];
}
