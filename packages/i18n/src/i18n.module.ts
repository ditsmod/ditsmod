import { Module, PRE_ROUTER_EXTENSIONS } from '@ditsmod/core';

import { I18nLogMediator } from './i18n-log-mediator';
import { I18nExtension } from './i18n.extension';
import { DictService } from './dict.service';
import { I18nOptions, I18N_EXTENSIONS, I18N_TRANSLATIONS } from './types/mix';

@Module({
  extensions: [[I18N_EXTENSIONS, PRE_ROUTER_EXTENSIONS, I18nExtension, true]],
  providersPerMod: [
    I18nOptions,
    I18nLogMediator,
    { provide: I18N_TRANSLATIONS, useValue: [], multi: true } // @todo Remove this after fix import resolver (issue with @Optional())
  ],
  providersPerReq: [DictService],
  exports: [DictService],
})
export class I18nModule {}
