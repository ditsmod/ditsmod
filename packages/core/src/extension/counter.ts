import { injectable } from '#di/decorators.js';
import { Extension } from '#extension/extension-types.js';

/**
 * Used to collect various statistics.
 *
 * @todo Rename this (maybe to ExtensionCounter?)
 */
@injectable()
export class Counter {
  #extensionManagerId = 0;
  #initedExtensions = new Set<Extension>();

  increaseExtensionsInitId() {
    return ++this.#extensionManagerId;
  }

  getExtensionsInitId() {
    return this.#extensionManagerId;
  }

  resetInitedExtensionsSet() {
    this.#initedExtensions = new Set();
  }

  addInitedExtensions(extension: Extension) {
    this.#initedExtensions.add(extension);
  }

  getInitedExtensions() {
    return this.#initedExtensions;
  }
}
