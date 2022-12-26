import { featureModule } from '@ditsmod/core';
import { I18nProviders, I18nModule, I18N_TRANSLATIONS, DictService } from '@ditsmod/i18n';

import { current } from './locales/current';
import { FirstService } from './first.service';
import { FirstController } from './first.controller';

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
