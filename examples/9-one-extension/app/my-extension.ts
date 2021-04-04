import { Injectable, Inject } from '@ts-stack/di';
import { edk, Logger } from '@ditsmod/core';

@Injectable()
export class MyExtension implements edk.Extension {
  #inited: boolean;

  constructor(private log: Logger, @Inject(edk.EXTENSIONS_MAP) protected extensionsMap: edk.ExtensionsMap) {}

  async init() {
    if (this.#inited) {
      return;
    }

    this.log.info(this.extensionsMap);
    this.#inited = true;
  }
}
