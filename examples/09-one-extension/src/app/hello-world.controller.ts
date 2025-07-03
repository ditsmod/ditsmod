import { Res, controller, route } from '@ditsmod/rest';

@controller()
export class HelloWorldController {
  @route('GET')
  tellHello(res: Res) {
    res.send('Hello, World!\n');
  }
}
