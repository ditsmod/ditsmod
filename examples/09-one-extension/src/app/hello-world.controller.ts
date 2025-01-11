import { Res, controller, route } from '@ditsmod/routing';

@controller()
export class HelloWorldController {
  @route('GET')
  tellHello(res: Res) {
    res.send('Hello, World!\n');
  }
}
