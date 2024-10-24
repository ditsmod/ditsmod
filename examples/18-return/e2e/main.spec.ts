import request from 'supertest';
import { TestApplication } from '@ditsmod/testing';
import { NodeServer } from '@ditsmod/core';

import { AppModule } from '#app/app.module.js';

describe('18-return', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  describe('regular controller', () => {
    it('case 1', async () => {
      const { type, status, text } = await testAgent.get('/first');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('first module.\n');
    });

    it('case 2', async () => {
      const { type, status, text } = await testAgent.get('/second');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('default send');
    });

    it('case 3', async () => {
      const { status, body, type } = await testAgent.get('/second-json');
      expect(status).toBe(200);
      expect(type).toBe('application/json');
      expect(body).toEqual({ msg: 'JSON object' });
    });

    it('case 4', async () => {
      const { type, status, text } = await testAgent.get('/second-string');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('Some string');
    });
  });

  describe('singleton controller', () => {
    it('case 2', async () => {
      const { type, status, text } = await testAgent.get('/second2');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('default2 send');
    });

    it('case 3', async () => {
      const { status, body, type } = await testAgent.get('/second2-json');
      expect(status).toBe(200);
      expect(type).toBe('application/json');
      expect(body).toEqual({ msg: 'JSON2 object' });
    });

    it('case 4', async () => {
      const { type, status, text } = await testAgent.get('/second2-string');
      expect(status).toBe(200);
      expect(type).toBe('text/plain');
      expect(text).toBe('Some2 string');
    });
  });
});
