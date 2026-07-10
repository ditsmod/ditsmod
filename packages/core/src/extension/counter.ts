import { injectable } from '#di/decorators.js';
import { Extension } from '#extension/extension-types.js';

@injectable()
export class ExtensionStatistics {
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
