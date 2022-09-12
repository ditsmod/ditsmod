import { Extension, ExtensionsManager, MetadataPerMod2, ModuleExtract, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { Inject, Injectable, Optional, Type } from '@ts-stack/di';

import { I18nLogMediator } from './i18n-log-mediator';
import { Dictionary, I18N_TRANSLATIONS, Translations } from './types/mix';

@Injectable()
export class I18nExtension implements Extension<void> {
  #inited: boolean;
  protected i18n: any;

  constructor(
    private log: I18nLogMediator,
    private extensionsManager: ExtensionsManager,
    private moduleExtract: ModuleExtract,
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
    for (const translation of this.translations) {
      for (const dictionariesGroup of translation.imported || []) {
        const token = dictionariesGroup[0]; // First class uses as group's token
        const group = dictionariesGroup.slice(1);
        this.addDictToDi(token, group, aMetadataPerMod2);
        const allLngs = group.map((d) => d.prototype.getLng());
        this.log.overridedLngs(this, token.name, allLngs);
      }
      for (const dictionariesGroup of translation.current || []) {
        const token = dictionariesGroup[0]; // First class uses as group's token
        this.addDictToDi(token, dictionariesGroup, aMetadataPerMod2);
        const allLngs = dictionariesGroup.map((d) => d.prototype.getLng());
        this.log.foundLngs(this, token.name, allLngs);
      }
    }

    this.#inited = true;
  }

  protected addDictToDi(token: Type<Dictionary>, group: Type<Dictionary>[], aMetadataPerMod2: MetadataPerMod2[]) {
    for (const dict of group) {
      if (token !== dict) {
        this.logMissingMethodsIfExists(token, dict);
      }
      for (const metadataPerMod2 of aMetadataPerMod2) {
        const { providersPerMod } = metadataPerMod2;
        providersPerMod.push({ provide: token, useClass: dict, multi: true });
      }
    }
  }

  protected logMissingMethodsIfExists(base: Type<Dictionary>, extended: Type<Dictionary>) {
    const baseMethods = Object.getOwnPropertyNames(base.prototype);
    const overridedMethods = Object.getOwnPropertyNames(extended.prototype);
    const missingMethods: string[] = [];
    baseMethods.forEach((b) => {
      if (!overridedMethods.includes(b)) {
        missingMethods.push(b);
      }
    });
    if (missingMethods.length) {
      this.log.missingMethods(this, extended.name, missingMethods);
    }
  }
}
