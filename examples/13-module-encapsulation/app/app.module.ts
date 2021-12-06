import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { AppController } from './app.controller';
import { FirstModule } from './first/first.module';
import { SecondModule } from './second/second.module';
import { ThirdModule } from './third/third.module';

@RootModule({
  imports: [RouterModule, ThirdModule, FirstModule, SecondModule],
  controllers: [AppController],
})
export class AppModule {}
