import { restModule } from '@ditsmod/rest';
import { I18nProviders, I18nModule, I18N_TRANSLATIONS } from '@ditsmod/i18n';

import { current } from './first/locales/current/index.js';
import { FirstService } from './first/first.service.js';
import { FirstController } from './first/first.controller.js';

@restModule({
  imports: [I18nModule],
  providersPerMod: new I18nProviders().i18n({ current }, { defaultLng: 'en' }),
  providersPerReq: [FirstService],
  controllers: [FirstController],
  exports: [I18nModule, I18N_TRANSLATIONS, FirstService],
})
export class FirstModule {}
