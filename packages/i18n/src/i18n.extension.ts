import {
  Extension,
  ExtensionManager,
  Provider,
  injectable,
  Injector,
  fromSelf,
  ExtensionGroupMeta,
  inject,
  PROVIDERS_PER_APP,
} from '@ditsmod/core';
import { RouteExtensionMeta, RestRouteExtension } from '@ditsmod/rest';

import { I18nTransformer } from './i18n-transformer.js';
import { I18nLogMediator } from './i18n-log-mediator.js';
import { I18N_TRANSLATIONS, Translations } from './types/mix.js';
import { DictService } from './dict.service.js';

@injectable()
export class I18nExtension implements Extension<void> {
  protected injector: Injector;
  protected hasTranslation: boolean;

  constructor(
    private log: I18nLogMediator,
    private extensionManager: ExtensionManager,
    private i18nTransformer: I18nTransformer,
   @inject(PROVIDERS_PER_APP) protected providersPerApp: Provider[],
  ) {}

  async stage1(isLastModule?: boolean) {
    const extensionGroupMeta = await this.extensionManager.stage1(RestRouteExtension);
    this.addI18nProviders(extensionGroupMeta, isLastModule);
  }

  protected addI18nProviders(extensionGroupMeta: ExtensionGroupMeta<RouteExtensionMeta>, isLastModule?: boolean) {
    const injectorPerApp = Injector.resolveAndCreate(this.providersPerApp);

    const translationsPerApp = injectorPerApp.get(I18N_TRANSLATIONS, null);
    this.hasTranslation = Boolean(translationsPerApp);
    if (isLastModule && translationsPerApp) {
      const providers = this.i18nTransformer.getProviders(translationsPerApp);
      this.providersPerApp.push(...providers);
    }

    for (const routeExtensionMeta of extensionGroupMeta.groupData) {
      const { aControllerMetadata } = routeExtensionMeta;
      const { providersPerMod, providersPerRou, providersPerReq } = routeExtensionMeta.meta;
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
    const translations = this.injector.get(I18N_TRANSLATIONS, null, undefined, fromSelf) as Translations[];
    if (translations) {
      this.hasTranslation = true;
      providers.push(...this.i18nTransformer.getProviders(translations));
    }
    providers.unshift(DictService);
  }
}
