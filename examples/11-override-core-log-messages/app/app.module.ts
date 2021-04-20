import { RootModule, Router, Log, Logger } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';

class MyLog extends Log {
  /**
   * `serverName` is running at `host`:`port`.
   */
  serverListen(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `Here serverName: "${args[0]}", here host: "${args[1]}", and here port: "${args[2]}"`);
  }
}

@RootModule({
  controllers: [HelloWorldController],
  providersPerApp: [
    { provide: Router, useClass: DefaultRouter },
    { provide: Log, useClass: MyLog }, // Here set your new MyLog
  ],
})
export class AppModule {}
