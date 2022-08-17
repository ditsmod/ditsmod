import { join } from 'path';
import { Extension, Logger } from '@ditsmod/core';
import { Inject, Injectable, Optional } from '@ts-stack/di';
import i18next, { i18n, InitOptions, ModuleType } from 'i18next';
import I18nextFsBackend from 'i18next-fs-backend';

import { I18nextFsBackendOptions, I18NEXT_FS_BACKEND_OPTIONS } from './types/mix';

@Injectable()
export class I18nextFsBackendExtension implements Extension<i18n> {
  protected i18nextFsBackend: i18n;

  constructor(
    private logger: Logger,
    @Optional() @Inject(I18NEXT_FS_BACKEND_OPTIONS) private fsBackendOptions: InitOptions = {}
  ) {}

  async init() {
    if (this.i18nextFsBackend) {
      return this.i18nextFsBackend;
    }

    const backend = this.fsBackendOptions.backend as I18nextFsBackendOptions | undefined;
    const mergedBackendOptions: I18nextFsBackendOptions = {
      loadPath: backend?.loadPath || join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
      addPath: backend?.addPath || join(__dirname, '../locales/{{lng}}/{{ns}}.missing.json'),
    };

    if (!this.fsBackendOptions.backend) {
      this.fsBackendOptions.backend = {};
    }

    Object.assign(this.fsBackendOptions.backend, mergedBackendOptions);

    const loggerPlugin = {
      type: 'logger' as ModuleType,
      log: (...args: any[]) => {
        this.logger.debug(...args);
      },
      warn: (...args: any[]) => {
        this.logger.warn(...args);
      },
      error: (...args: any[]) => {
        this.logger.error(...args);
      },
    };

    this.fsBackendOptions.debug = this.fsBackendOptions.debug === undefined ? true : this.fsBackendOptions.debug;

    this.i18nextFsBackend = i18next.createInstance().use(loggerPlugin).use(I18nextFsBackend);

    await this.i18nextFsBackend.init(this.fsBackendOptions || undefined);
    return this.i18nextFsBackend;
  }
}
