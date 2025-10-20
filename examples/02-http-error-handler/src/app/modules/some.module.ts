import { restModule } from '@ditsmod/rest';
import { SomeController, SomeCtxController } from './some/some.controller.js';

@restModule({ controllers: [SomeController, SomeCtxController] })
export class SomeModule {}
