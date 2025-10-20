import { restModule } from '@ditsmod/rest';
import { I18nModule, I18nProviders, I18N_TRANSLATIONS } from '@ditsmod/i18n';

import { FirstModule } from './first.module.js';
import { SecondController } from './second/second.controller.js';
import { current } from './second/locales/current/index.js';
import { imported } from './second/locales/imported/index.js';

@restModule({
  imports: [I18nModule, FirstModule],
  providersPerMod: new I18nProviders().i18n({ current, imported }, { defaultLng: 'uk' }),
  controllers: [SecondController],
  exports: [I18N_TRANSLATIONS],
})
export class SecondModule {}
