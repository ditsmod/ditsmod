export class ClassMetaIterator {
  #properties: Set<string | symbol>;

  [Symbol.iterator]() {
    const arr1 = Object.keys(this);
    const arr2 = Object.getOwnPropertySymbols(this);
    this.#properties = new Set([...arr1, ...arr2]);
    return this.#properties[Symbol.iterator]();
  }
}
