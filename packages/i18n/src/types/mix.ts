import { Extension } from '@ditsmod/core';
import { InjectionToken, Type } from '@ts-stack/di';

import { ISO639 } from './iso-639';

export interface Dictionary {
  getLng(): ISO639;
  [key: string]: any;
}

export class Translations {
  constructor(public current?: DictGroup[], public imported?: DictGroup[], public moduleName?: string) {}
}

export class I18nOptions {
  defaultLng?: ISO639;
  lngQueryParam?: string = 'lng';
}
export type DictGroup<T extends Type<Dictionary> = Type<Dictionary>> = [T, ...T[]];
export const I18N_EXTENSIONS = new InjectionToken<Extension<void>>('I18N_EXTENSIONS');
export const I18N_TRANSLATIONS = new InjectionToken<DictGroup[][]>('I18N_TRANSLATIONS');
