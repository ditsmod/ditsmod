import { StandaloneApplication } from '@holu/core';
import { AppModule } from './app/app.module.js';

await StandaloneApplication.create(AppModule);
