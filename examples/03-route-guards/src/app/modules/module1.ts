import { restModule } from '@ditsmod/rest';

import { AuthModule } from '#auth';
import { InjController, RouteScopedController } from './module1/controllers.js';

@restModule({ imports: [AuthModule], controllers: [InjController, RouteScopedController] })
export class Module1 {}
