import {
  Extension,
  ExtensionsManager,
  PerAppService,
  Provider,
  injectable,
  Injector,
  fromSelf,
  Stage1ExtensionMeta,
} from '@ditsmod/core';
import { MetadataPerMod3, RoutesExtension } from '@ditsmod/routing';

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

  async stage1(isLastModule?: boolean) {
    if (this.#inited) {
      return;
    }

    const stage1GroupMeta = await this.extensionsManager.stage1(RoutesExtension);
    this.addI18nProviders(stage1GroupMeta, isLastModule);

    this.#inited = true;
  }

  protected addI18nProviders(stage1GroupMeta: Stage1ExtensionMeta<MetadataPerMod3>, isLastModule?: boolean) {
    const injectorPerApp = this.perAppService.injector;

    const translationsPerApp = injectorPerApp.get(I18N_TRANSLATIONS, undefined, null);
    this.hasTranslation = Boolean(translationsPerApp);
    if (isLastModule && translationsPerApp) {
      const providers = this.i18nTransformer.getProviders(translationsPerApp);
      this.perAppService.providers.push(...providers);
    }

    for (const metadataPerMod3 of stage1GroupMeta.groupData) {
      const { aControllerMetadata } = metadataPerMod3;
      const { providersPerMod, providersPerRou, providersPerReq } = metadataPerMod3.meta;
      if (!aControllerMetadata.length) {
        continue;
      }

      this.injector = injectorPerApp;
      this.addI18nProvidersToLevel(providersPerMod);
      this.addI18nProvidersToLevel(providersPerRou);
      this.addI18nProvidersToLevel(providersPerReq);
    }

    if (!this.hasTranslation) {
      this.log.translationNotFound(this);
    }
  }

  protected addI18nProvidersToLevel(providers: Provider[]) {
    this.injector = this.injector.resolveAndCreateChild(providers);
    const translations = this.injector.get(I18N_TRANSLATIONS, fromSelf, null) as Translations[];
    if (translations) {
      this.hasTranslation = true;
      providers.push(...this.i18nTransformer.getProviders(translations));
    }
    providers.unshift(DictService);
  }
}
