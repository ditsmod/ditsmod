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
    this.res.sendJson({ pathParams: this.req.pathParams || null });
  }

  @Route('GET', 'one/:param1')
  test1() {
    this.res.sendJson({ pathParams: this.req.pathParams });
  }

  @Route('GET', 'one/:param1/two/:param2')
  test2() {
    this.res.sendJson({ pathParams: this.req.pathParams });
  }

  // Here works new route decorator from `@ditsmod/openapi`.
  @OasRoute('posts/{postId}', [BasicGuard], {
    parameters: new Parameters()
      .required('path', Post, 'postId')
      .optional('cookie', Post, 'postTitle')
      .getParams(),
    get: {
      parameters: new Parameters()
        .required('query', 'rubricId')
        .optional('query', 'contextId')
        .getParams(),
      responses: {
        [Status.OK]: {
          description: 'Single post',
          content: { ['application/json']: {} },
        },
      },
    },
  })
  getPost() {
    const { postId } = this.req.pathParams;
    this.res.sendJson({ postId, body: `some body for postId ${postId}` });
  }

  @OasRoute('posts/{postId}/comments/{commentId}', [BasicGuard], {
    get: {
      parameters: [
        { in: 'path', name: 'postId', required: true },
        { in: 'path', name: 'commentId', required: true },
      ],
      responses: {
        [Status.OK]: {
          description: 'Single comment',
          content: {
            'application/json': {},
          },
        },
      },
    },
  })
  getComment() {
    const { postId, commentId } = this.req.pathParams;
    this.res.sendJson({ postId, body: `some body for postId ${postId} and commentId ${commentId}` });
  }
}
