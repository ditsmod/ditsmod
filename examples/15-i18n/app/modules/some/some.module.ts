import { LoggerConfig, LogMediatorConfig, Module, FilterConfig } from '@ditsmod/core';
import { I18nModule, I18nOptions } from '@ditsmod/i18n';

import { HelloWorldController } from './hello-world.controller';
import { currentTranslations } from './locales/current/translations';

const loggerConfig = new LoggerConfig('debug');
const filterConfig: FilterConfig = { classesNames: ['I18nExtension'] };
const i18nOptions: I18nOptions = { defaultLng: 'uk' };

@Module({
  imports: [I18nModule.withParams(currentTranslations, i18nOptions)],
  controllers: [HelloWorldController],
  providersPerMod: [
    { provide: LoggerConfig, useValue: loggerConfig },
    { provide: LogMediatorConfig, useValue: { filterConfig } },
  ],
})
export class SomeModule {}
