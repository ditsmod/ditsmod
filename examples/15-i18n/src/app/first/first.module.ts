import { Module } from '@ditsmod/core';
import { I18nProviders, I18nModule, I18N_TRANSLATIONS } from '@ditsmod/i18n';

import { current } from './locales/current';
import { FirstService } from './first.service';
import { FirstController } from './first.controller';

@Module({
  imports: [I18nModule],
  controllers: [FirstController],
  providersPerReq: [FirstService],
  providersPerMod: [
    ...new I18nProviders().i18n({ current }, { defaultLng: 'en' })
  ],
  exports: [I18nModule, FirstService, I18N_TRANSLATIONS],
})
export class FirstModule {}
