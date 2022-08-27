import { Module } from '@ditsmod/core';
import { I18nModule, I18nProviders, I18N_TRANSLATIONS } from '@ditsmod/i18n';

import { FirstModule } from '../first/first.module';
import { SecondController } from './second.controller';
import { current } from './locales/current';
import { imported } from './locales/imported';

@Module({
  imports: [I18nModule, FirstModule],
  controllers: [SecondController],
  providersPerMod: [
    ...new I18nProviders()
      .i18n(this, { current, imported, moduleName: 'SecondModule' }, { defaultLng: 'uk' }),
  ],
  exports: [I18N_TRANSLATIONS],
})
export class SecondModule {}
