import { Injector, Res } from '@ditsmod/core';

import { PostsController } from './posts.controller';

describe('PostsController', () => {
  const sendJson = jest.fn();
  const res = { sendJson } as unknown as Res;
  let postsController: PostsController;

  beforeEach(() => {
    jest.restoreAllMocks();
    const injector = Injector.resolveAndCreate([PostsController]);
    postsController = injector.get(PostsController);
  });

  it('should say "Hello World!"', () => {
    expect(() => postsController.sendPosts(res)).not.toThrow();
    expect(sendJson).toBeCalledTimes(1);
  });
});