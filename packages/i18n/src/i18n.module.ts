import { featureModule } from '@ditsmod/core';
import { PreRouterExtension, RoutesExtension } from '@ditsmod/rest';

import { DictService } from './dict.service.js';
import { I18nLogMediator } from './i18n-log-mediator.js';
import { I18nTransformer } from './i18n-transformer.js';
import { I18nExtension } from './i18n.extension.js';

@featureModule({
  providersPerApp: [DictService, I18nTransformer, I18nLogMediator],
  providersPerMod: [DictService, I18nTransformer, I18nLogMediator],
  exports: [DictService, I18nTransformer, I18nLogMediator],
  extensions: [
    {
      extension: I18nExtension,
      afterExtensions: [RoutesExtension],
      beforeExtensions: [PreRouterExtension],
      exportOnly: true,
    },
  ],
})
export class I18nModule {}
