import { restModule } from '@ditsmod/rest';

import { AuthModule } from '#auth';
import { InjController, CtxController } from './module1/controllers.js';

@restModule({ imports: [AuthModule], controllers: [InjController, CtxController] })
export class Module1 {}
