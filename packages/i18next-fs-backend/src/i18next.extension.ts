import { Extension } from '@ditsmod/core';
import { Inject, Injectable, Optional } from '@ts-stack/di';
import i18next, { InitOptions, i18n } from 'i18next';

import { I18NEXT_OPTIONS } from './types/mix';

@Injectable()
export class I18nextExtension implements Extension<i18n> {
  constructor(@Optional() @Inject(I18NEXT_OPTIONS) private options: InitOptions = {}) {}

  async init() {
    if (i18next.isInitialized) {
      return i18next;
    }
    await i18next.init(this.options);
    return i18next;
  }
}
