import request from 'supertest';
import { TestApplication } from '@ditsmod/testing';
import { HttpServer } from '@ditsmod/routing';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { AppModule } from '#app/app.module.js';

describe('05-nested-routes', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule, { path: 'api' }).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('should works with /api/posts', async () => {
    const { status, body, type } = await testAgent.get('/api/posts');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual({ pathParams: {} });
  });

  it('should works with /api/posts/123', async () => {
    const { status, body, type } = await testAgent.get('/api/posts/123');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual({ pathParams: { postId: '123' } });
  });

  it('should works with /api/posts/123/comments', async () => {
    const { status, body, type } = await testAgent.get('/api/posts/123/comments');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual({ pathParams: { postId: '123' } });
  });

  it('should works with /api/posts/123/comments/456', async () => {
    const { status, body, type } = await testAgent.get('/api/posts/123/comments/456');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual({ pathParams: { postId: '123', commentId: '456' } });
  });
});
