import { Extension, Logger, MetadataPerMod1 } from '@ditsmod/core';
import { Injectable, Optional } from '@ts-stack/di';
import { I18nLogMediator } from './i18n-log-mediator';

import { I18nOptions } from './types/mix';

@Injectable()
export class I18nExtension implements Extension<void> {
  #inited: boolean;
  protected i18n: any;

  constructor(
    private log: I18nLogMediator,
    @Optional() private options: I18nOptions = {},
    private metadataPerMod1: MetadataPerMod1
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    const moduleName = this.metadataPerMod1.meta.name;
    
    if (this.metadataPerMod1.meta.modulePath) {
      console.log(this.metadataPerMod1.meta.modulePath);
    } else if(moduleName != 'I18nModule') {
      this.log.notDetectModulePath(this, moduleName);
    }

    this.#inited = true;
  }
}
