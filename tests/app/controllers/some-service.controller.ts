import { Injectable } from 'ts-di';

import { Request } from '../../../src/request';
import { Response } from '../../../src/response';
import { SomeService } from '../services/some.service';

@Injectable()
export class SomeServiceController {
  constructor(private req: Request, private res: Response, private someService: SomeService) {}

  callSomeService() {
    const message = this.someService.methodOfSomeService();
    this.res.send(message);
  }
}
