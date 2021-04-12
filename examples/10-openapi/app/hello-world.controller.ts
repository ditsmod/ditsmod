import { Controller, Response, Route, Status } from '@ditsmod/core';
import { OasRoute } from '@ditsmod/openapi';

@Controller()
export class HelloWorldController {
  constructor(private res: Response) {}

  @Route('GET')
  hello() {
    // Here work route decorator from `@ditsmod/core`.
    this.res.send('ok');
  }

  @OasRoute('posts', [], {
    get: {
      parameters: [
        { in: 'query', name: 'catId' },
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
    const posts = [
      { postId: 1, postTitle: 'Some title', postBody: 'Here body' },
      { postId: 2, postTitle: 'Some other title', postBody: 'Here other body' },
    ];
    this.res.sendJson(posts);
  }

  @OasRoute('post', [], {
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
    const post = { postId: 1, postTitle: 'Some title', postBody: 'Here body' };
    this.res.sendJson(post);
  }
}
