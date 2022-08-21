import { LoggerConfig, Module } from '@ditsmod/core';
import { I18nModule, I18nOptions } from '@ditsmod/i18n';

import { HelloWorldController } from './hello-world.controller';
import { currentTranslations } from './locales/current/translations';

const loggerConfig = new LoggerConfig('info');
const i18nOptions: I18nOptions = { defaultLng: 'uk' };

@Module({
  imports: [I18nModule.withParams(currentTranslations)],
  controllers: [HelloWorldController],
  providersPerMod: [
    { provide: LoggerConfig, useValue: loggerConfig },
    { provide: I18nOptions, useValue: i18nOptions },
  ],
})
export class SomeModule {}
