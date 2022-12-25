import { mod, PRE_ROUTER_EXTENSIONS } from '@ditsmod/core';

import { DictService } from './dict.service';
import { I18nLogMediator } from './i18n-log-mediator';
import { I18nTransformer } from './i18n-transformer';
import { I18nExtension } from './i18n.extension';
import { I18N_EXTENSIONS } from './types/mix';

@mod({
  providersPerApp: [DictService, I18nTransformer, I18nLogMediator],
  extensions: [
    { extension: I18nExtension, groupToken: I18N_EXTENSIONS, nextToken: PRE_ROUTER_EXTENSIONS, exported: true },
  ]
})
export class I18nModule {}
