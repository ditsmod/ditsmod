import { AppModule } from './app/app.module.js';
import { TrpcApplication } from './adapter/trpc-application.js';

const app = await TrpcApplication.create(AppModule, { bufferLogs: false, showExternalLogs: true });
app.server.listen(2021, '0.0.0.0');
