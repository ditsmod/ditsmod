import { join } from 'path';
import { Extension } from '@ditsmod/core';
import { Inject, Injectable, Optional } from '@ts-stack/di';
import { InitOptions } from 'i18next';
import I18nextFsBackend from 'i18next-fs-backend';

import { I18nextFsBackendOptions, I18NEXT_FS_BACKEND_OPTIONS } from './types/mix';
import { I18nextExtension } from './i18next.extension';

@Injectable()
export class I18nextFsBackendExtension implements Extension<void> {
  constructor(
    private i18nextSingletonExtension: I18nextExtension,
    @Optional() @Inject(I18NEXT_FS_BACKEND_OPTIONS) private options: InitOptions = {}
  ) {}

  async init() {
    const i18next = await this.i18nextSingletonExtension.init();
    const backend = this.options.backend as I18nextFsBackendOptions | undefined;
    const mergedBackendOptions: I18nextFsBackendOptions = {
      loadPath: backend?.loadPath || join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
      addPath: backend?.addPath || join(__dirname, '../locales/{{lng}}/{{ns}}.missing.json'),
    };

    if (!this.options.backend) {
      this.options.backend = {};
    }
    Object.assign(this.options.backend, mergedBackendOptions);

    const i18nInstance = i18next.cloneInstance(this.options).use(I18nextFsBackend);
  }
}
