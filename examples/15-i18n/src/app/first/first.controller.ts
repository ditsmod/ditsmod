import { RequestContext, controller, route } from '@ditsmod/rest';
import { FirstService } from './first.service.js';

@controller()
export class FirstController {
  constructor(private firstService: FirstService) {}

  @route('GET', 'first')
  tellHefllo(reqCtx: RequestContext) {
    reqCtx.send(this.firstService.countToThree());
  }
}
