import { Controller, Logger, Request, Response, Route, Status } from '@ditsmod/core';
import { getParams, getContent, OasRoute } from '@ditsmod/openapi';

import { BasicGuard } from './basic.guard';
import { Model3 } from './models';

@Controller()
export class HelloWorldController {
  constructor(private req: Request, private res: Response, private logger: Logger) {}

  @Route('GET', '', [])
  hello() {
    this.res.send('Hello, World!');
  }

  @OasRoute('GET', 'guard', [BasicGuard], {})
  helloWithGuard() {
    this.res.send('Hello, user!');
  }

  @OasRoute('GET', 'resource/:resourceId', [], {
    tags: ['withParameter'],
    description: 'This route uses `getParams()` and `getContent()` helpers from @ditsmod/openapi',
    parameters: getParams('path', true, Model3, 'resourceId'),
    responses: {
      [Status.OK]: {
        description: 'Single item',
        content: getContent({ mediaType: 'application/json', model: Model3 }),
      },
    },
  })
  getResourceId() {
    const { resourceId } = this.req.pathParams;
    this.res.sendJson({ resourceId, body: `some body for resourceId ${resourceId}` });
  }
}
