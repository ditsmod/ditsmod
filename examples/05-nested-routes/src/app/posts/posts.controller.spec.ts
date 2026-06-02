import { Injector } from '@ditsmod/core';
import type { RequestContext } from '@ditsmod/rest';
import { jest } from '@jest/globals';

import { PostsController } from './posts.controller.js';

describe('PostsController', () => {
  const sendJson = jest.fn();
  const res = { sendJson } as unknown as RequestContext;
  let postsController: PostsController;

  beforeEach(() => {
    jest.restoreAllMocks();
    const injector = Injector.resolveAndCreate([PostsController]);
    postsController = injector.get(PostsController);
  });

  it('should say "Hello, World!"', () => {
    expect(() => postsController.sendPosts(res)).not.toThrow();
    expect(sendJson).toHaveBeenCalledTimes(1);
  });
});