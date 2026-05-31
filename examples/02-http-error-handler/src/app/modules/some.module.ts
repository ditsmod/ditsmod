import { restModule } from '@ditsmod/rest';
import { RequestScopedController, RouteScopedController } from './some/some.controller.js';

@restModule({ controllers: [RequestScopedController, RouteScopedController] })
export class SomeModule {}
