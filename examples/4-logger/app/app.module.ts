import { RootModule } from '@ts-stack/ditsmod';
import { BunyanModule } from './modules/bunyan/bunyan.module';
import { PinoModule } from './modules/pino/pino.module';

@RootModule({
  imports: [BunyanModule, PinoModule],
})
export class AppModule {}
