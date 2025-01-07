import { featureModule } from '@ditsmod/core';
import { PRE_ROUTER_EXTENSIONS } from '@ditsmod/routing';

import { DictService } from './dict.service.js';
import { I18nLogMediator } from './i18n-log-mediator.js';
import { I18nErrorMediator } from './i18n-error-mediator.js';
import { I18nTransformer } from './i18n-transformer.js';
import { I18nExtension } from './i18n.extension.js';
import { I18N_EXTENSIONS } from './types/mix.js';

@featureModule({
  providersPerApp: [DictService, I18nTransformer, I18nLogMediator, I18nErrorMediator],
  providersPerMod: [DictService, I18nTransformer, I18nLogMediator, I18nErrorMediator],
  exports: [DictService, I18nTransformer, I18nLogMediator, I18nErrorMediator],
  extensions: [
    { extension: I18nExtension, group: I18N_EXTENSIONS, beforeGroups: [PRE_ROUTER_EXTENSIONS], exportedOnly: true },
  ]
})
export class I18nModule {}
