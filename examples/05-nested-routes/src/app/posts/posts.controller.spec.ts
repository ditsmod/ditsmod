import { Injector } from '@ditsmod/core';
import { Res } from '@ditsmod/rest';
import { jest } from '@jest/globals';

import { PostsController } from './posts.controller.js';

describe('PostsController', () => {
  const sendJson = jest.fn();
  const res = { sendJson } as unknown as Res;
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