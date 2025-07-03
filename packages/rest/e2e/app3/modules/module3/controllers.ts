import { controller, Res, route } from '@ditsmod/rest';

@controller()
export class Controller1 {
  @route('GET', 'ok1')
  ok(res: Res) {
    res.send('ok1');
  }
}

@controller({ scope: 'ctx' })
export class Controller2 {
  @route('GET', 'ok2')
  ok(res: Res) {
    res.send('ok2');
  }
}
