import { controller, route } from '@ditsmod/routing';

import { OtherGuard } from '../../guards.js';

@controller()
export class Controller1 {
  @route('GET', 'ok1')
  ok() {
    return 'ok1';
  }
}

@controller({ scope: 'ctx' })
export class Controller2 {
  @route('GET', 'ok2')
  ok() {
    return 'ok2';
  }
}

@controller()
export class Controller3 {
  @route('GET', 'ok3', [OtherGuard])
  ok() {
    return 'ok3';
  }
}

@controller({ scope: 'ctx' })
export class Controller4 {
  @route('GET', 'ok4', [OtherGuard])
  ok() {
    return 'ok4';
  }
}
