import { Controller, Response, Route, Status } from '@ditsmod/core';
import { OasRoute } from '@ditsmod/openapi';

@Controller()
export class HelloWorldController {
  constructor(private res: Response) {}

  // Here works route decorator from `@ditsmod/core`.
  @Route('GET')
  hello() {
    this.res.send('ok');
  }

  // Here works new route decorator from `@ditsmod/openapi`.
  @OasRoute('posts/{postId}', [], {
    get: {
      parameters: [{ in: 'path', name: 'postId', required: true }],
      responses: {
        [Status.OK]: {
          description: 'Post to read',
          content: {
            'application/json': { schema: { $ref: '' } },
          },
        },
      },
    },
  })
  getPost() {
    this.res.send('returns single post');
  }

  @OasRoute('posts', [], {
    parameters: [{ in: 'query', name: 'catId' }],
    get: {
      parameters: [
        { in: 'query', name: 'rubricId' },
        { in: 'query', name: 'contextId' },
      ],
      responses: {
        [Status.OK]: {
          description: 'List of posts',
          content: { ['application/json']: { schema: { $ref: '' } } },
        },
      },
    },
  })
  getPosts() {
    this.res.send('returns posts list');
  }
}
