import { StandaloneApplication } from '@ditsmod/core';
import { AppModule } from './app/app.module.js';

await StandaloneApplication.create(AppModule);
