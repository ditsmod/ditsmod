export const init = Symbol();

export class ClassMetaIterator {
  #properties: (string | symbol)[];

  [Symbol.iterator]() {
    let counter = 0;
    return {
      next: () => {
        return {
          done: !(counter in this.#properties), 
          value: this.#properties[counter++], 
        };
      },
    };
  }

  [init]() {
    const arr1 = Object.getOwnPropertyNames(this) as (string | symbol)[];
    const arr2 = Object.getOwnPropertySymbols(this);
    this.#properties = arr1.concat(arr2);
  }
}
