/**
 * Support for methods of this class appeared in Node.js v26.
 */
export class WeakMap26<K extends WeakKey, V> extends WeakMap<K, V> {
  override getOrInsert(key: K, defaultValue: V): V {
    if (!this.has(key)) {
      this.set(key, defaultValue);
    }
    return this.get(key)!;
  }
}
