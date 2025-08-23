import { AppModule } from './app/app.module.js';
import { TrpcApplication } from './adapters/ditsmod/trpc-application.js';

const app = await TrpcApplication.create(AppModule, { bufferLogs: false, logLevel: 'debug', showExternalLogs: true });
app.server.listen(2021, '0.0.0.0');
