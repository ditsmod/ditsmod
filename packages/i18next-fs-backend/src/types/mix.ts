import { Extension } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';
import { i18n, InitOptions } from 'i18next';

/**
 * _Note:_ If you use i18next-fs-backend as caching layer in combination with i18next-chained-backend, you can optionally set an expiration time
 * an example on how to use it as cache layer can be found here: https://github.com/i18next/i18next-fs-backend/blob/master/example/caching/app.js
 * expirationTime: 60 * 60 * 1000
 */
export interface I18nextFsBackendOptions {
  /**
   * Path where resources get loaded from, or a function.
   */
  loadPath?: string | ((lngs: string[], namespaces: string[]) => string);
  /**
   * Path to post missing resources.
   */
  addPath?: string;
}

export const I18NEXT_FS_BACKEND_EXTENSIONS = new InjectionToken<Extension<i18n>>('I18NEXT_FS_BACKEND_EXTENSIONS');
export const I18NEXT_FS_BACKEND_OPTIONS = new InjectionToken<InitOptions>('I18NEXT_FS_BACKEND_OPTIONS');
