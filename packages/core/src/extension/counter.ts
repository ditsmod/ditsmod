import { injectable } from '#di';
import { Extension } from '#extension/extension-types.js';

/**
 * Used to collect various statistics.
 * 
 * @todo Rename this (maybe to ExtensionCounter?)
 */
@injectable()
export class Counter {
  #extensionsManagerId = 0;
  #initedExtensions = new Set<Extension>();

  increaseExtensionsInitId() {
    return ++this.#extensionsManagerId;
  }

  getExtensionsInitId() {
    return this.#extensionsManagerId;
  }

  resetInitedExtensionsSet() {
    this.#initedExtensions = new Set;
  }

  addInitedExtensions(extension: Extension) {
    this.#initedExtensions.add(extension);
  }

  getInitedExtensions() {
    return this.#initedExtensions;
  }
}
