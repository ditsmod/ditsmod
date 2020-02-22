export function getDuplicates<T>(arr: T[]) {
  arr = arr || [];
  const duplicates = arr.filter((value, index, self) => self.indexOf(value) != index);
  return [...new Set(duplicates)];
}
