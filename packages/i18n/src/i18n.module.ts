import { Module, PRE_ROUTER_EXTENSIONS, Providers } from '@ditsmod/core';

import { I18nLogMediator } from './i18n-log-mediator';
import { I18nExtension } from './i18n.extension';
import { DictService } from './dict.service';
import { I18N_EXTENSIONS } from './types/mix';

@Module({
  extensions: [
    { extension: I18nExtension, groupToken: I18N_EXTENSIONS, nextToken: PRE_ROUTER_EXTENSIONS, exported: true },
  ],
  providersPerApp: [DictService],
  providersPerMod: [...new Providers().useLogMediator(I18nLogMediator)],
})
export class I18nModule {}
