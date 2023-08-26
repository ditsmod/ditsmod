import { featureModule } from '@ditsmod/core';
import { I18nProviders, I18nModule, I18N_TRANSLATIONS, DictService } from '@ditsmod/i18n';

import { current } from './locales/current/index.js';
import { FirstService } from './first.service.js';
import { FirstController } from './first.controller.js';

@featureModule({
  imports: [I18nModule],
  controllers: [FirstController],
  providersPerMod: [
    ...new I18nProviders().i18n({ current }, { defaultLng: 'en' }),
  ],
  providersPerReq: [FirstService],
  exports: [I18nModule, FirstService, I18N_TRANSLATIONS],
})
export class FirstModule {}
