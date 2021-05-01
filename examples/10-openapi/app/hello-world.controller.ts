import { Controller, Request, Response, Status } from '@ditsmod/core';
import { getParams, getContent, OasRoute } from '@ditsmod/openapi';

import { BasicGuard } from './basic.guard';
import { Post } from './models';

@Controller()
export class HelloWorldController {
  constructor(private req: Request, private res: Response) {}

  @OasRoute('GET', '', [], {})
  hello() {
    this.res.send('Hello, World!');
  }

  @OasRoute('GET', 'posts/:postId', [BasicGuard], {
    description: 'This route uses `getParams()` and `getContent()` helpers from @ditsmod/openapi',
    parameters: getParams('path', true, Post, 'postId'),
    responses: {
      [Status.OK]: {
        description: 'Single post',
        content: getContent({ mediaType: 'application/json', model: Post }),
      },
    },
  })
  getPost() {
    const { postId } = this.req.pathParams;
    this.res.sendJson({ postId, body: `some body for postId ${postId}` });
  }
}
