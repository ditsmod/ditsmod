export function mergeMaps<K, V>(...maps: Map<K, V>[] | Map<K, V>[][]) {
  const arr = Array.isArray(maps[0]) ? maps.flat() : maps;
  // @ts-ignore
  return arr.reduce<Map<K, V>>((prev, curr) => new Map([...prev, ...(curr || [])]), new Map());
}
