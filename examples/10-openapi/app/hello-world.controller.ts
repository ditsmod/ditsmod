import { Controller, Request, Response, Route, Status } from '@ditsmod/core';
import { OasRoute, Parameters } from '@ditsmod/openapi';

import { BasicGuard } from './basic.guard';
import { Post } from './models';

@Controller()
export class HelloWorldController {
  constructor(private req: Request, private res: Response) {}

  // Here works route decorator from `@ditsmod/core`.
  @Route('GET')
  hello() {
    this.res.send('Hello!');
  }

  // Here works new route decorator from `@ditsmod/openapi`.
  @OasRoute('GET', 'posts/:postId', [BasicGuard], {
    description: 'Here some description',
    parameters: new Parameters()
      .required('path', Post, 'postId')
      .optional('query', 'someOptionalParam')
      .getParams(),
    responses: {
      [Status.OK]: {
        description: 'Single post',
        content: { ['application/json']: {} },
      },
    },
  })
  getPost() {
    const { postId } = this.req.pathParams;
    this.res.sendJson({ postId, body: `some body for postId ${postId}` });
  }
}
