import { featureModule } from '@ditsmod/core';
import { I18nModule, I18nProviders, I18N_TRANSLATIONS } from '@ditsmod/i18n';
import { RestModule } from '@ditsmod/rest';

import { FirstModule } from '../first/first.module.js';
import { SecondController } from './second.controller.js';
import { current } from './locales/current/index.js';
import { imported } from './locales/imported/index.js';

@featureModule({
  imports: [RestModule, I18nModule, FirstModule],
  controllers: [SecondController],
  providersPerMod: new I18nProviders().i18n({ current, imported }, { defaultLng: 'uk' }),
  exports: [I18N_TRANSLATIONS],
})
export class SecondModule {}
