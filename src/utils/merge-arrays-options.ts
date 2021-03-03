export function mergeArrays(arr1: any[], arr2: undefined | any[]) {
  return [...(arr1 || []), ...(arr2 || [])];
}
// @todo Rename file to `merge-arrays.ts`
