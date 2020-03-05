/**
 * Returns the value of the last element in the array where predicate is true, and undefined
 * otherwise.
 * @param predicate find calls predicate once for each element of the array, in descending
 * order, until it finds one where predicate returns true. If such an element is found, find
 * immediately returns that element value. Otherwise, find returns undefined.
 */
export function findLast<T>(arr: T[], predicate: (value: T, index?: number, obj?: T[]) => unknown): T | undefined {
  arr = arr || [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const value = arr[i];
    if (predicate(value, i, arr)) {
      return value;
    }
  }
}
