import { LoggerConfig, Providers, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { FirstModule } from './modules/routed/first/first.module';
import { SecondModule } from './modules/routed/second/second.module';


@RootModule({
  // Here works the application and serves OpenAPI documentation.
  listenOptions: { host: 'localhost', port: 3000 },
  imports: [
    RouterModule,
    { path: '', module: FirstModule },
    { path: '', module: SecondModule },
  ],
  providersPerApp: [
    ...new Providers().useLogConfig({level: 'trace'})
  ]
})
export class AppModule {}
