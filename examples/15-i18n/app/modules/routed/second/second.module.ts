import { LoggerConfig, LogMediatorConfig, Module, FilterConfig } from '@ditsmod/core';
import { I18nModule, I18nOptions, Translation } from '@ditsmod/i18n';

import { FirstModule } from '../../service/first/first.module';
import { SecondController } from './second.controller';
import { currentTranslations } from './locales/current/translations';
import { importedTranslations } from './locales/imported/first/translations';

const loggerConfig = new LoggerConfig('info');
const filterConfig: FilterConfig = { classesNames: ['I18nExtension'] };
const i18nOptions: I18nOptions = { defaultLng: 'uk' };
const translations: Translation = {
  current: currentTranslations,
  imported: importedTranslations
};

@Module({
  imports: [
    I18nModule.withParams(translations),
    FirstModule
  ],
  controllers: [SecondController],
  providersPerMod: [
    { provide: LoggerConfig, useValue: loggerConfig },
    { provide: LogMediatorConfig, useValue: { filterConfig } },
    { provide: I18nOptions, useValue: i18nOptions },
  ],
})
export class SecondModule {}
