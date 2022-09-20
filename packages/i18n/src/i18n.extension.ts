import {
  Extension,
  ExtensionsManager,
  MetadataPerMod2,
  ModuleExtract,
  PerAppService,
  ROUTES_EXTENSIONS,
  ServiceProvider,
} from '@ditsmod/core';
import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { I18nTransformer } from './i18n-transformer';
import { I18nLogMediator } from './i18n-log-mediator';
import { I18N_TRANSLATIONS, Translations } from './types/mix';

@Injectable()
export class I18nExtension implements Extension<void> {
  #inited: boolean;
  protected injector: ReflectiveInjector;
  protected translations: Translations[] | null;

  constructor(
    private log: I18nLogMediator,
    private extensionsManager: ExtensionsManager,
    private moduleExtract: ModuleExtract,
    private i18nTransformer: I18nTransformer,
    private perAppService: PerAppService
  ) {}

  async init(isLastExtensionCall?: boolean) {
    if (this.#inited) {
      return;
    }

    if (this.moduleExtract.moduleName == 'I18nModule') {
      this.#inited = true;
      return;
    }

    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    this.addI18nProviders(aMetadataPerMod2, isLastExtensionCall);

    this.#inited = true;
  }

  protected addI18nProviders(aMetadataPerMod2: MetadataPerMod2[], isLastExtensionCall?: boolean) {
    const injectorPerApp = this.perAppService.injector;

    const translationsPerApp: Translations[] | null = injectorPerApp.get(I18N_TRANSLATIONS, null);
    if (isLastExtensionCall && translationsPerApp) {
      const providers = this.i18nTransformer.getProviders(translationsPerApp);
      this.perAppService.providers = providers;
    }
    this.translations = translationsPerApp;

    for (const metadataPerMod2 of aMetadataPerMod2) {
      const { providersPerMod, providersPerRou, providersPerReq } = metadataPerMod2;

      this.injector = injectorPerApp;
      this.addI18nProvidersToScope(providersPerMod);
      this.addI18nProvidersToScope(providersPerRou);
      this.addI18nProvidersToScope(providersPerReq);

      if (this.translations === translationsPerApp) {
        this.log.translationNotFound(this);
      }
    }
  }

  protected addI18nProvidersToScope(providers: ServiceProvider[]) {
    this.injector = this.injector.resolveAndCreateChild(providers);
    const translations: Translations[] = this.injector.get(I18N_TRANSLATIONS, null);
    if (translations !== this.translations) {
      providers.push(...this.i18nTransformer.getProviders(translations));
    }
    this.translations = translations;
  }
}
