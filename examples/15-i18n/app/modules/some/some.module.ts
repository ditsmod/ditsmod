import { HelloWorldController } from './hello-world.controller';
import { Module } from '@ditsmod/core';
import { I18nModule } from '@ditsmod/i18n';

@Module({
  imports: [I18nModule],
  controllers: [HelloWorldController],
})
export class SomeModule {
  static get modulePath() {
    return __dirname;
  }
}
