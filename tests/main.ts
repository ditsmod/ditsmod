import 'reflect-metadata';
import { AppModule } from './app.module';
import { BootstrapRootModule } from '../src/modules/bootstrap-root.module';

new BootstrapRootModule()
  .bootstrapRootModule(AppModule)
  .then(server => server.on('error', err => console.error(err)))
  .catch(err => console.log(err));
