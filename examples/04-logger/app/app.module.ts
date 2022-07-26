import { RootModule, LoggerConfig, Logger, LogMediatorConfig } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { BunyanModule } from './modules/bunyan/bunyan.module';
import { PinoModule } from './modules/pino/pino.module';
import { SomeModule } from './modules/some/some.module';
import { WinstonModule } from './modules/winston/winston.module';
import { SettingsService } from './utils/settings.service';

const loggerConfig = new LoggerConfig();
const level: keyof Logger = 'debug';
loggerConfig.level = level;
const logMediatorConfig = new LogMediatorConfig();
// logMediatorConfig.filterConfig.classesNames = ['ExtensionsManager', 'PreRouterExtension']; // uncomment this

@RootModule({
  imports: [
    RouterModule,
    { path: '', module: SomeModule },
    { path: '', module: WinstonModule },
    { path: '', module: PinoModule },
    { path: '', module: BunyanModule },
  ],
  providersPerApp: [
    { provide: LoggerConfig, useValue: loggerConfig },
    { provide: LogMediatorConfig, useValue: logMediatorConfig }
  ],
  providersPerMod: [SettingsService],
  exports: [SettingsService]
})
export class AppModule {}
