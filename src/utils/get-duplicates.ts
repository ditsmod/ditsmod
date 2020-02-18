export function getDuplicates(arr: any[]) {
  arr = arr || [];
  const duplicates = arr.filter((value, index, self) => self.indexOf(value) != index);
  return [...new Set(duplicates)];
}
