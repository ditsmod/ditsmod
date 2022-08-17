import { Extension, Logger } from '@ditsmod/core';
import { Inject, Injectable, Optional } from '@ts-stack/di';

import { I18N_OPTIONS } from './types/mix';

@Injectable()
export class I18nExtension implements Extension<void> {
  protected i18n: any;

  constructor(
    private logger: Logger,
    @Optional() @Inject(I18N_OPTIONS) private options: any = {}
  ) {}

  async init() {}
}
