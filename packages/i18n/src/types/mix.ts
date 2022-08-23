import { Extension } from '@ditsmod/core';
import { InjectionToken, Type } from '@ts-stack/di';

import { ISO639 } from './iso-639';

export interface I18nDictionary {
  lng: ISO639;
  [key: string]: any;
}

export class Translation {
  constructor(public current?: DictGroup[], public imported?: DictGroup[]) {}
}

export class I18nOptions {
  defaultLng?: ISO639;
  lngQueryParam?: string = 'lng';
}
export type DictGroup<T extends Type<I18nDictionary> = Type<I18nDictionary>> = [T, ...T[]];
export const I18N_EXTENSIONS = new InjectionToken<Extension<void>>('I18N_EXTENSIONS');
export const I18N_TRANSLATIONS = new InjectionToken<DictGroup[][]>('I18N_TRANSLATIONS');
