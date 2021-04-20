import { Controller, Request, Response, Route } from '@ditsmod/core';

@Controller()
export class PostsController {
  constructor(private req: Request, private res: Response) {}

  /**
   * As you seen, you can apply multi `@Route` statement to a single method.
   */
  @Route('GET')
  @Route('GET', ':postId')
  sendPosts() {
    const { pathParams } = this.req;
    this.res.sendJson({ pathParams });
  }
}
