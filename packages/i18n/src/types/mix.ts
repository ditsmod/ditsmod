import { Extension } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';

export const I18N_EXTENSIONS = new InjectionToken<Extension<void>>('I18N_EXTENSIONS');
export const I18N_OPTIONS = new InjectionToken<any>('I18N_OPTIONS');
