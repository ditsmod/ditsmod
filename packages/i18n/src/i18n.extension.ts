import {
  Extension,
  ExtensionsManager,
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
  protected translations: Translations[];

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
    const injectorPerApp = this.perAppService.createInjector();

    const translationsPerApp: Translations[] = injectorPerApp.get(I18N_TRANSLATIONS, []);
    if (isLastExtensionCall) {
      const providers = this.i18nTransformer.getProviders(translationsPerApp);
      this.perAppService.providers.push(...providers);
    }
    this.translations = translationsPerApp;

    for (const metadataPerMod2 of aMetadataPerMod2) {
      const { providersPerMod, providersPerRou, providersPerReq } = metadataPerMod2;

      this.injector = injectorPerApp;
      this.addI18nProviders(providersPerMod);
      this.addI18nProviders(providersPerRou);
      this.addI18nProviders(providersPerReq);

      if (this.translations === translationsPerApp) {
        this.log.translationNotFound(this);
      }
    }
    this.#inited = true;
  }

  protected addI18nProviders(providers: ServiceProvider[]) {
    this.injector = this.injector.resolveAndCreateChild(providers);
    const translations: Translations[] = this.injector.get(I18N_TRANSLATIONS, []);
    if (translations !== this.translations) {
      providers.push(...this.i18nTransformer.getProviders(translations));
    }
    this.translations = translations;
  }
}
