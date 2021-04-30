import { Controller, Request, Response, Status } from '@ditsmod/core';
import { getParams, getContent, OasRoute } from '@ditsmod/openapi';

import { BasicGuard } from './basic.guard';
import { Post } from './models';

@Controller()
export class HelloWorldController {
  constructor(private req: Request, private res: Response) {}

  @OasRoute('GET', 'posts1/:postId', [BasicGuard], {
    description: 'This route without helpers',
    parameters: [
      { in: 'path', name: 'postId', required: true }
    ],
    responses: {
      [Status.OK]: {
        description: 'Single post',
        content: { ['application/json']: {} },
      },
    },
  })
  getPost1() {
    const { postId } = this.req.pathParams;
    this.res.sendJson({ postId, body: `some body for postId ${postId}` });
  }

  @OasRoute('GET', 'posts2/:postId', [BasicGuard], {
    description: 'This route same as the previous one, but uses `Parameters` and `Content` helpers from @ditsmod/openapi',
    parameters: getParams('path', true, Post, 'postId'),
    responses: {
      [Status.OK]: {
        description: 'Single post',
        content: getContent({ mediaType: 'application/json', model: Post }),
      },
    },
  })
  getPost2() {
    const { postId } = this.req.pathParams;
    this.res.sendJson({ postId, body: `some body for postId ${postId}` });
  }
}
