import { AppModule } from './app/app.module.js';
import { TrpcApplication } from './adapters/ditsmod/trpc-application.js';

const app = await TrpcApplication.create(AppModule);
app.server.listen(3000, '0.0.0.0');
