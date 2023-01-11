import { controller, Req, RequestContext, Res, route } from '@ditsmod/core';

@controller()
export class PostsController {
  /**
   * As you seen, you can apply multi `@route` statement to a single method.
   */
  @route('GET')
  @route('GET', ':postId')
  sendPosts(req: Req, res: Res) {
    const { pathParams } = req;
    res.sendJson({ pathParams });
  }
}
