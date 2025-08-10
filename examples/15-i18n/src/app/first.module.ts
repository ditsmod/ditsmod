import { featureModule } from '@ditsmod/core';
import { I18nProviders, I18nModule, I18N_TRANSLATIONS } from '@ditsmod/i18n';
import { initRest } from '@ditsmod/rest';

import { current } from './first/locales/current/index.js';
import { FirstService } from './first/first.service.js';
import { FirstController } from './first/first.controller.js';

@initRest({
  imports: [I18nModule],
  providersPerMod: new I18nProviders().i18n({ current }, { defaultLng: 'en' }),
  providersPerReq: [FirstService],
  controllers: [FirstController],
  exports: [I18nModule, I18N_TRANSLATIONS, FirstService],
})
@featureModule()
export class FirstModule {}
