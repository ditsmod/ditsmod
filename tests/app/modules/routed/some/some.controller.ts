import { Request } from '../../../../../src/request';
import { Response } from '../../../../../src/response';
import { Controller, Route } from '../../../../../src/types/decorators';
import { SomeService } from '../../../services/some.service';

@Controller({ path: 'some-resource' })
export class SomeController {
  constructor(private req: Request, private res: Response, private someService: SomeService) {}

  @Route('GET')
  callSomeService() {
    const message = this.someService.methodOfSomeService();
    this.res.send(message);
  }
}
