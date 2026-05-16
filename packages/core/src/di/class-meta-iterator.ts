export class ClassMetaIterator {
  *[Symbol.iterator](): Generator<string | symbol, void, void> {
    for (const key of Reflect.ownKeys(this)) {
      yield key;
    }
  }
}
