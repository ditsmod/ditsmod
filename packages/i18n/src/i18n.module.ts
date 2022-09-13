import { Module, PRE_ROUTER_EXTENSIONS } from '@ditsmod/core';

import { I18nLogMediator } from './i18n-log-mediator';
import { I18nExtension } from './i18n.extension';
import { DictService } from './dict.service';
import { I18N_EXTENSIONS } from './types/mix';
import { I18nTransformer } from './i18n-transformer';

@Module({
  extensions: [
    { extension: I18nExtension, groupToken: I18N_EXTENSIONS, nextToken: PRE_ROUTER_EXTENSIONS, exported: true },
  ],
  providersPerApp: [I18nTransformer, I18nLogMediator, DictService]
})
export class I18nModule {}
