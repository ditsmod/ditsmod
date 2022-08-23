import { Module } from '@ditsmod/core';
import { I18nModule, I18nOptions, I18N_TRANSLATIONS, Translation } from '@ditsmod/i18n';

import { currentTranslations } from './locales/current/translations';
import { FirstService } from './first.service';
import { FirstController } from './first.controller';

const i18nOptions: I18nOptions = { defaultLng: 'en' };
const translations: Translation = { current: currentTranslations };

@Module({
  imports: [I18nModule],
  controllers: [FirstController],
  providersPerReq: [FirstService],
  providersPerMod: [
    { provide: I18nOptions, useValue: i18nOptions },
    { provide: I18N_TRANSLATIONS, useValue: translations, multi: true }
  ],
  exports: [FirstService],
})
export class FirstModule {}
