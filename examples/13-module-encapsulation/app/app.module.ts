import { LogConfig, Logger, LoggerConfig, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { ImportsResolver } from '../../../packages/core/src/imports-resolver';
import { AppController } from './app.controller';
import { ThreeModule } from './three/three.module';

const loggerConfig = new LoggerConfig();
const level: keyof Logger = 'trace';
loggerConfig.level = level;
const logConfig = new LogConfig();
logConfig.filterConfig = { className: ImportsResolver.name };

@RootModule({
  imports: [RouterModule, ThreeModule],
  controllers: [AppController],
  providersPerApp: [
    { provide: LoggerConfig, useValue: loggerConfig },
    { provide: LogConfig, useValue: logConfig },
  ],
})
export class AppModule {}
