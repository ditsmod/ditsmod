import { Extension, MetadataPerMod1 } from '@ditsmod/core';
import { Inject, Injectable } from '@ts-stack/di';
import { I18nLogMediator } from './i18n-log-mediator';

import { I18nTranslation, I18N_TRANSLATIONS } from './types/mix';

@Injectable()
export class I18nExtension implements Extension<void> {
  #inited: boolean;
  protected i18n: any;

  constructor(
    private log: I18nLogMediator,
    @Inject(I18N_TRANSLATIONS) private translations: I18nTranslation[] = [],
    private metadataPerMod1: MetadataPerMod1
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    // const moduleName = this.metadataPerMod1.meta.name;
    // console.log(`${moduleName}:`, this.translations);
    // if (moduleName != 'I18nModule') {
    //   this.log.notFoundTranslation(this);
    // }

    this.#inited = true;
  }
}
