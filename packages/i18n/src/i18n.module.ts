import { featureModule } from '@ditsmod/core';
import { PRE_ROUTER_EXTENSIONS } from '@ditsmod/routing';

import { DictService } from './dict.service.js';
import { I18nLogMediator } from './i18n-log-mediator.js';
import { I18nTransformer } from './i18n-transformer.js';
import { I18nExtension } from './i18n.extension.js';
import { I18N_EXTENSIONS } from './types/mix.js';

@featureModule({
  providersPerApp: [DictService, I18nTransformer, I18nLogMediator],
  extensions: [
    { extension: I18nExtension, groupToken: I18N_EXTENSIONS, nextToken: PRE_ROUTER_EXTENSIONS, exported: true },
  ]
})
export class I18nModule {}
