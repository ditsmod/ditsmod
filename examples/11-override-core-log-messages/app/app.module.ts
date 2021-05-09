import { RootModule, Log, Logger } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

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
  imports: [RouterModule],
  controllers: [HelloWorldController],
  providersPerApp: [
    { provide: Log, useClass: MyLog }, // Here set your new MyLog
  ],
})
export class AppModule {}
