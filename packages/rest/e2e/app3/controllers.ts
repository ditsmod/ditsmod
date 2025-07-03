import { controller, route } from '@ditsmod/rest';

@controller()
export class Controller1 {
  @route('GET', 'root-controller')
  ok() {
    return 'ok';
  }
}
