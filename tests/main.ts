import 'reflect-metadata';
import { AppModule } from './app.module';
import { BootstrapModule } from '../src/bootstrap-module';

new BootstrapModule()
  .bootstrapRootModule(AppModule)
  .then(server => server.on('error', err => console.error(err)))
  .catch(err => console.log(err));
