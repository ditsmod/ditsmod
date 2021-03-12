/**
 * Returns array of uniq elements that are duplicates in source array.
 */
export function getDuplicates<T>(arr: T[]) {
  arr = arr || [];
  const duplicates = arr.filter((value, index, self) => self.indexOf(value) != index);
  return [...new Set(duplicates)];
}
