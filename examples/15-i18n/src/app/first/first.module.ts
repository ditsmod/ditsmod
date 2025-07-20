import { featureModule } from '@ditsmod/core';
import { I18nProviders, I18nModule, I18N_TRANSLATIONS } from '@ditsmod/i18n';
import { initRest } from '@ditsmod/rest';

import { current } from './locales/current/index.js';
import { FirstService } from './first.service.js';
import { FirstController } from './first.controller.js';

@initRest({ controllers: [FirstController], providersPerReq: [FirstService], exports: [FirstService] })
@featureModule({
  imports: [I18nModule],
  providersPerMod: new I18nProviders().i18n({ current }, { defaultLng: 'en' }),
  exports: [I18nModule, I18N_TRANSLATIONS],
})
export class FirstModule {}
