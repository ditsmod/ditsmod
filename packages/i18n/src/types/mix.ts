import { Extension } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';

export interface I18nTranslation {
  lng: string;
  [key: string]: any;
}

export class I18nOptions {}

export const I18N_EXTENSIONS = new InjectionToken<Extension<void>>('I18N_EXTENSIONS');
export const I18N_TRANSLATIONS = new InjectionToken<I18nTranslation[]>('I18N_TRANSLATIONS');
