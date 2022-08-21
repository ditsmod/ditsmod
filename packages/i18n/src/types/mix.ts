import { Extension } from '@ditsmod/core';
import { InjectionToken, Type } from '@ts-stack/di';

export interface I18nTranslation {
  lng: string;
  [key: string]: any;
}

export class I18nOptions {}
export type TranslationTuple<T extends Type<I18nTranslation> = Type<I18nTranslation>> = [T, ...T[]];
export const I18N_EXTENSIONS = new InjectionToken<Extension<void>>('I18N_EXTENSIONS');
export const I18N_TRANSLATIONS = new InjectionToken<TranslationTuple[][]>('I18N_TRANSLATIONS');
