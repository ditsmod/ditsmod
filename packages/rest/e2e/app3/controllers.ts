import { controller, route } from '@holu/rest';

@controller()
export class Controller1 {
  @route('GET', 'root-controller')
  ok() {
    return 'ok';
  }
}
