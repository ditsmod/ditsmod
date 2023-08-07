import request from 'supertest';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';

describe('05-nested-routes', () => {
  console.log = jest.fn(); // Hide logs

  it('should works with /api/posts', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/api/posts')
      .expect(200)
      .expect({ pathParams: {} });

    server.close();
  });

  it('should works with /api/posts/123', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/api/posts/123')
      .expect(200)
      .expect({ pathParams: { postId: '123' } });

    server.close();
  });

  it('should works with /api/posts/123/comments', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/api/posts/123/comments')
      .expect(200)
      .expect({ pathParams: { postId: '123' } });

    server.close();
  });

  it('should works with /api/posts/123/comments/456', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/api/posts/123/comments/456')
      .expect(200)
      .expect({ pathParams: { postId: '123', commentId: '456' } });

    server.close();
  });
});
