import { controller, Req, Res, route } from '@ditsmod/core';

@controller()
export class PostsController {
  constructor(private req: Req, private res: Res) {}

  /**
   * As you seen, you can apply multi `@route` statement to a single method.
   */
  @route('GET')
  @route('GET', ':postId')
  sendPosts() {
    const { pathParams } = this.req;
    this.res.sendJson({ pathParams });
  }
}
