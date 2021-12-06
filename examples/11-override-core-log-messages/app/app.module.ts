import { RootModule, LogMediator, FilterConfig } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';

class MyLogMediator extends LogMediator {
  /**
   * `serverName` is running at `host`:`port`.
   */
  override serverListen(self: object, serverName: string, host: string, port: number) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('info', filterConfig, `Here serverName: "${serverName}", here host: "${host}", and here port: "${port}"`);
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
