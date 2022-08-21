import { LoggerConfig, Module } from '@ditsmod/core';
import { I18nModule } from '@ditsmod/i18n';

import { HelloWorldController } from './hello-world.controller';
import currentTranslations from './locales/current/providers';

const loggerConfig = new LoggerConfig('info');

@Module({
  imports: [I18nModule],
  controllers: [HelloWorldController],
  providersPerMod: [
    { provide: LoggerConfig, useValue: loggerConfig },
    ...currentTranslations
  ]
})
export class SomeModule {}
