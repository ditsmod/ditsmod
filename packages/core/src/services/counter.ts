import { Injectable } from '@ts-stack/di';

/**
 * Used to collect various statistics.
 */
@Injectable()
export class Counter {
  #extensionsManagerId = 0;

  increaseExtensionsInitId() {
    return ++this.#extensionsManagerId;
  }

  getExtensionsInitId() {
    return this.#extensionsManagerId;
  }
}
