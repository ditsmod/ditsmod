import { LoggerConfig, Module } from '@ditsmod/core';
import { I18nModule } from '@ditsmod/i18n';

import { HelloWorldController } from './hello-world.controller';
import { currentTranslations } from './locales/current/translations';

const loggerConfig = new LoggerConfig('info');

@Module({
  imports: [
    I18nModule.withParams(currentTranslations)
  ],
  controllers: [HelloWorldController],
  providersPerMod: [
    { provide: LoggerConfig, useValue: loggerConfig }
  ]
})
export class SomeModule {}
