import { route, controller } from '@ditsmod/rest';

import { Guard } from '../../guards.js';

@controller()
export class Controller1 {
  @route('GET', 'ok1')
  ok() {
    return 'ok1';
  }

  @route('GET', 'need-auth1', [Guard])
  auth() {
    return 'some secret1';
  }
}

@controller({ scope: 'ctx' })
export class Controller2 {
  @route('GET', 'ok2')
  ok() {
    return 'ok2';
  }

  @route('GET', 'need-auth2', [Guard])
  auth() {
    return 'some secret2';
  }
}
