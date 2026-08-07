import { RestApplication } from '@holu/rest';
import { AppModule } from './app/app.module.js';

const app = await RestApplication.create(AppModule);
app.enableShutdownHooks();
app.server.listen(3000, '0.0.0.0');
