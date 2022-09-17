import { Module } from '@ditsmod/core';
import { I18nProviders } from '@ditsmod/i18n';
import { ValidationModule } from '@ditsmod/openapi-validation';
import { BodyParserModule } from '@ditsmod/body-parser';

import { FirstController } from './first.controller';
import { current } from './locales/current';
import { imported } from './locales/imported';

@Module({
  imports: [ValidationModule, BodyParserModule],
  controllers: [FirstController],
  providersPerMod: [...new I18nProviders().i18n({ current, imported })]
})
export class FirstModule {}
