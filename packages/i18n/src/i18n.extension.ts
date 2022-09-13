import { Extension, ExtensionsManager, ModuleExtract, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { Inject, Injectable, Optional } from '@ts-stack/di';

import { I18nTransformer } from './i18n-transformer';
import { I18nLogMediator } from './i18n-log-mediator';
import { I18N_TRANSLATIONS, Translations } from './types/mix';
import { DictService } from './dict.service';

@Injectable()
export class I18nExtension implements Extension<void> {
  #inited: boolean;
  protected i18n: any;

  constructor(
    private log: I18nLogMediator,
    private extensionsManager: ExtensionsManager,
    private moduleExtract: ModuleExtract,
    private i18nImporter: I18nTransformer,
    @Optional() @Inject(I18N_TRANSLATIONS) private translations?: Translations[]
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    if (this.moduleExtract.moduleName == 'I18nModule') {
      return;
    }

    if (!this.translations?.length) {
      this.log.translationNotFound(this);
      this.#inited = true;
      return;
    }

    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    const providers = this.i18nImporter.getProviders(this.translations);

    for (const metadataPerMod2 of aMetadataPerMod2) {
      const { providersPerMod, providersPerReq } = metadataPerMod2;
      providersPerMod.push(...providers, DictService);
      providersPerReq.push(...providers, DictService);
    }
    this.#inited = true;
  }
}
