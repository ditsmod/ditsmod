import { Extension } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';

export const I18N_EXTENSIONS = new InjectionToken<Extension<void>>('I18N_EXTENSIONS');

export class I18nOptions {}
