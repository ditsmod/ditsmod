import { Extension } from '@ditsmod/core';
import { InjectionToken, Optional, Type } from '@ts-stack/di';

import { ISO639 } from './iso-639';

export interface I18nTranslation {
  lng: ISO639;
  [key: string]: any;
}

export class I18nOptions {
  defaultLng?: ISO639;
}
export type TranslationGroup<T extends Type<I18nTranslation> = Type<I18nTranslation>> = [T, ...T[]];
export const I18N_EXTENSIONS = new InjectionToken<Extension<void>>('I18N_EXTENSIONS');
export const I18N_TRANSLATIONS = new InjectionToken<TranslationGroup[][]>('I18N_TRANSLATIONS');
