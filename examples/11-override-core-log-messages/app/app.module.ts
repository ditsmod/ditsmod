import { RootModule, LogMediator, Logger, FilterConfig } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';

class MyLogMediator extends LogMediator {
  /**
   * `serverName` is running at `host`:`port`.
   */
  override serverListen(level: keyof Logger, filterConfig: FilterConfig = {}, ...args: any[]) {
    this.setLog(level, filterConfig, `Here serverName: "${args[0]}", here host: "${args[1]}", and here port: "${args[2]}"`);
  }
}

@RootModule({
  imports: [RouterModule],
  controllers: [HelloWorldController],
  providersPerApp: [
    { provide: LogMediator, useClass: MyLogMediator }, // Here set your new MyLogMediator
  ],
})
export class AppModule {}
