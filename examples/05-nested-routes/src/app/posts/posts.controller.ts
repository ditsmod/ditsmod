import { AnyObj, inject, PATH_PARAMS, Res } from '@ditsmod/core';
import { controller, route } from '@ditsmod/routing';

@controller()
export class PostsController {
  /**
   * As you seen, you can apply multi `@route` statement to a single method.
   */
  @route('GET')
  @route('GET', ':postId')
  sendPosts(res: Res, @inject(PATH_PARAMS) pathParams: AnyObj = {}) {
    res.sendJson({ pathParams });
  }
}
