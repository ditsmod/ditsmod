import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { AppController } from './app.controller';
import { FirstModule } from './first/first.module';
import { SecondModule } from './second/second.module';
import { ThirdModule } from './third/third.module';

@rootModule({
  imports: [
    RouterModule,
    { path: '', module: FirstModule },
    { path: '', module: SecondModule },
    { path: '', module: ThirdModule },
  ],
  controllers: [AppController],
})
export class AppModule {}
