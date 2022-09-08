import { Module, PRE_ROUTER_EXTENSIONS, Providers } from '@ditsmod/core';

import { I18nLogMediator } from './i18n-log-mediator';
import { I18nExtension } from './i18n.extension';
import { DictService } from './dict.service';
import { I18N_EXTENSIONS } from './types/mix';
import { DictPerModService } from './dict-per-mod.service';

@Module({
  extensions: [
    { extension: I18nExtension, groupToken: I18N_EXTENSIONS, nextToken: PRE_ROUTER_EXTENSIONS, exported: true },
  ],
  providersPerMod: [DictPerModService, ...new Providers().useLogMediator(I18nLogMediator)],
  providersPerReq: [DictService],
  exports: [DictService],
})
export class I18nModule {}
