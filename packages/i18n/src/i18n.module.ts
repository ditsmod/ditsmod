import { Module, PRE_ROUTER_EXTENSIONS, Providers } from '@ditsmod/core';

import { I18nLogMediator } from './i18n-log-mediator';
import { I18nExtension } from './i18n.extension';
import { DictService } from './dict.service';
import { I18nOptions, I18N_EXTENSIONS } from './types/mix';
import { DictPerModService } from './dict-per-mod.service';

@Module({
  extensions: [[I18N_EXTENSIONS, PRE_ROUTER_EXTENSIONS, I18nExtension, true]],
  providersPerMod: [I18nOptions, DictPerModService, ...new Providers().useLogMediator(I18nLogMediator)],
  providersPerReq: [DictService],
  exports: [DictService],
})
export class I18nModule {}
