import { Module } from '@ditsmod/core';
import { getI18nProviders, I18nModule } from '@ditsmod/i18n';

import { current } from './locales/current/translations';
import { FirstService } from './first.service';
import { FirstController } from './first.controller';

@Module({
  imports: [I18nModule],
  controllers: [FirstController],
  providersPerReq: [FirstService],
  providersPerMod: [
    ...getI18nProviders({ current }, { defaultLng: 'en' })
  ],
  exports: [FirstService],
})
export class FirstModule {}
