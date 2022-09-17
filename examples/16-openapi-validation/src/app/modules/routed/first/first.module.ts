import { Module } from '@ditsmod/core';
import { I18nProviders } from '@ditsmod/i18n';
import { ValidationModule } from '@ditsmod/openapi-validation';

import { FirstController } from './first.controller';
import { current } from './locales/current';
import { imported } from './locales/imported';

@Module({
  imports: [ValidationModule],
  controllers: [FirstController],
  providersPerMod: [...new I18nProviders().i18n({ current, imported })]
})
export class FirstModule {}
