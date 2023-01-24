import { AnyObj, controller, inject, PATH_PARAMS, Res, route } from '@ditsmod/core';

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
