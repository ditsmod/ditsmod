import 'reflect-metadata';
import { Application } from '@ditsmod/core';

import { AppModule } from './app/app.module';

new Application().bootstrap(AppModule);
