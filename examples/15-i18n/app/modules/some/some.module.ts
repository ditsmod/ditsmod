import { LoggerConfig, Module } from '@ditsmod/core';
import { I18nModule } from '@ditsmod/i18n';

import { HelloWorldController } from './hello-world.controller';
import { TranslationUk } from './locales/current/uk/translation';
import { TranslationDefault } from './locales/current/en/translation';

const loggerConfig = new LoggerConfig('info');

@Module({
  imports: [I18nModule],
  controllers: [HelloWorldController],
  providersPerMod: [
    { provide: LoggerConfig, useValue: loggerConfig },
    { provide: TranslationDefault, useClass: TranslationDefault, multi: true },
    { provide: TranslationDefault, useClass: TranslationUk, multi: true },
  ]
})
export class SomeModule {}
