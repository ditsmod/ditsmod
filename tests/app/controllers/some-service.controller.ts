import { Request } from '../../../src/request';
import { Response } from '../../../src/response';
import { SomeService } from '../services/some.service';
import { Controller, Action } from '../../../src/decorators';

@Controller({ path: '/some-resource' })
export class SomeServiceController {
  constructor(private req: Request, private res: Response, private someService: SomeService) {}

  @Action('GET')
  callSomeService() {
    const message = this.someService.methodOfSomeService();
    this.res.send(message);
  }
}
