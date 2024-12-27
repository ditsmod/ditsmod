import request from 'supertest';
import { HttpServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { AppModule } from './app3/app.module.js';

describe('guard', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  /**
   * - controller1 has per request scope, controller2 has per route scope;
   * - route with `/ok` - this is a route without guard (but can have external guard);
   * - route with `/need-auth` - this is a route with guard;
   */

  describe('with injector-scoped controller', () => {
    it('passing guards to providers, or setting them to import a module, does not affect access to the root controller', async () => {
      const { type, status, text } = await testAgent.get('/root-controller');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok');
    });

    it('setting guards on individual routes does not affect other routes', async () => {
      const { type, status, text } = await testAgent.get('/module1/ok1');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok1');
    });

    it('the guard added to a specific route works', async () => {
      const { status } = await testAgent.get('/module1/need-auth1');
      expect(status).toBe(401);
    });

    it('guard is able to receive "allow=1" in queryParams and passing requests', async () => {
      const { type, status, text } = await testAgent.get('/module1/need-auth1?allow=1');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('some secret1');
    });

    it('guard set to import Module2 prohibits access to controllers without guards', async () => {
      const { status } = await testAgent.get('/module2-with-guard/ok1');
      expect(status).toBe(401);
    });

    it('guard set to import Module2 allows access to controllers if it receives allow=1 in queryParams', async () => {
      const { type, status, text } = await testAgent.get('/module2-with-guard/ok1?allow=1');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok1');
    });

    it('the first route (out of the two available) that is installed directly on the controller route does not pass the request', async () => {
      const { status } = await testAgent.get('/module2-with-guard/ok3?allow=1');
      expect(status).toBe(401);
    });

    it('the second route (out of the two available) that is installed directly on the controller route does not pass the request', async () => {
      const { status } = await testAgent.get('/module2-with-guard/ok3?allow=2');
      expect(status).toBe(401);
    });

    it('both guards (set on import and directly in the controller) pass the request if they get allow=3 in queryParams', async () => {
      const { type, status, text } = await testAgent.get('/module2-with-guard/ok3?allow=3');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok3');
    });

    it('guards set on some module imports do not affect the controllers of other modules', async () => {
      const { type, status, text } = await testAgent.get('/module3/ok1');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok1');
    });

    it('a child module that is imported into a root module without guards can set guards on its own module imports', async () => {
      const { status } = await testAgent.get('/module3/module2-with-guard/ok1');
      expect(status).toBe(401);
    });

    it('guards set to import in child modules work correctly', async () => {
      const { type, status, text } = await testAgent.get('/module3/module2-with-guard/ok1?allow=1');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok1');
    });
  });

  describe('with context-scoped controller', () => {
    it('setting guards on individual routes does not affect other routes', async () => {
      const { type, status, text } = await testAgent.get('/module1/ok2');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok2');
    });

    it('the guard added to a specific route works', async () => {
      const { status } = await testAgent.get('/module1/need-auth2');
      expect(status).toBe(401);
    });

    it('guard is able to receive "allow=1" in queryParams and passing requests', async () => {
      const { type, status, text } = await testAgent.get('/module1/need-auth2?allow=1');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('some secret2');
    });

    it('guard set to import Module2 prohibits access to controllers without guards', async () => {
      const { status } = await testAgent.get('/module2-with-guard/ok2');
      expect(status).toBe(401);
    });

    it('guard set to import Module2 allows access to controllers if it receives allow=1 in queryParams', async () => {
      const { type, status, text } = await testAgent.get('/module2-with-guard/ok2?allow=1');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok2');
    });

    it('the first route (out of the two available) that is installed directly on the controller route does not pass the request', async () => {
      const { status } = await testAgent.get('/module2-with-guard/ok4?allow=1');
      expect(status).toBe(401);
    });

    it('the second route (out of the two available) that is installed directly on the controller route does not pass the request', async () => {
      const { status } = await testAgent.get('/module2-with-guard/ok4?allow=2');
      expect(status).toBe(401);
    });

    it('both guards (set on import and directly in the controller) pass the request if they get allow=3 in queryParams', async () => {
      const { type, status, text } = await testAgent.get('/module2-with-guard/ok4?allow=3');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok4');
    });

    it('guards set on some module imports do not affect the controllers of other modules', async () => {
      const { type, status, text } = await testAgent.get('/module3/ok2');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok2');
    });

    it('a child module that is imported into a root module without guards can set guards on its own module imports', async () => {
      const { status } = await testAgent.get('/module3/module2-with-guard/ok2');
      expect(status).toBe(401);
    });

    it('guards set to import in child modules work correctly', async () => {
      const { type, status, text } = await testAgent.get('/module3/module2-with-guard/ok2?allow=1');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('ok2');
    });
  });
});
