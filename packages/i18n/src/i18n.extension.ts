import {
  Extension,
  ExtensionsManager,
  MetadataPerMod2,
  PerAppService,
  Provider,
  injectable,
  Injector,
  fromSelf,
} from '@ditsmod/core';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';

import { I18nTransformer } from './i18n-transformer.js';
import { I18nLogMediator } from './i18n-log-mediator.js';
import { I18N_TRANSLATIONS, Translations } from './types/mix.js';
import { DictService } from './dict.service.js';

@injectable()
export class I18nExtension implements Extension<void> {
  #inited: boolean;
  protected injector: Injector;
  protected hasTranslation: boolean;

  constructor(
    private log: I18nLogMediator,
    private extensionsManager: ExtensionsManager,
    private i18nTransformer: I18nTransformer,
    private perAppService: PerAppService,
  ) {}

  async init(isLastExtensionCall?: boolean) {
    if (this.#inited) {
      return;
    }

    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    this.addI18nProviders(aMetadataPerMod2, isLastExtensionCall);

    this.#inited = true;
  }

  protected addI18nProviders(aMetadataPerMod2: MetadataPerMod2[], isLastExtensionCall?: boolean) {
    const injectorPerApp = this.perAppService.injector;

    const translationsPerApp = injectorPerApp.get(I18N_TRANSLATIONS, undefined, null);
    this.hasTranslation = Boolean(translationsPerApp);
    if (isLastExtensionCall && translationsPerApp) {
      const providers = this.i18nTransformer.getProviders(translationsPerApp);
      this.perAppService.providers.push(...providers);
    }

    for (const metadataPerMod2 of aMetadataPerMod2) {
      const { providersPerMod, providersPerRou, providersPerReq, aControllersMetadata2 } = metadataPerMod2;
      if (!aControllersMetadata2.length) {
        continue;
      }

      this.injector = injectorPerApp;
      this.addI18nProvidersToScope(providersPerMod);
      this.addI18nProvidersToScope(providersPerRou);
      this.addI18nProvidersToScope(providersPerReq);
    }

    if (!this.hasTranslation) {
      this.log.translationNotFound(this);
    }
  }

  protected addI18nProvidersToScope(providers: Provider[]) {
    this.injector = this.injector.resolveAndCreateChild(providers);
    const translations = this.injector.get(I18N_TRANSLATIONS, fromSelf, null) as Translations[];
    if (translations) {
      this.hasTranslation = true;
      providers.push(...this.i18nTransformer.getProviders(translations));
    }
    providers.unshift(DictService);
  }
}
