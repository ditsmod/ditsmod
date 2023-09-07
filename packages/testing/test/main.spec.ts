import request = require('supertest');
import { Providers, Res } from '@ditsmod/core';
import { jest } from '@jest/globals';

import { TestApplication } from '#src/test-application.js';
import { AppModule } from './app/app.module.js';
import {
  ServicePerApp,
  ServicePerMod,
  ServicePerRou,
  ServicePerReq,
  ServicePerRou2,
  ServicePerReq2,
  ServicePerRou3,
} from './app/services.js';

describe('@ditsmod/testing', () => {
  const methodPerApp = jest.fn();
  const methodPerMod = jest.fn();
  const methodPerRou = jest.fn();
  const methodPerReq = jest.fn();
  const methodPerRou2 = jest.fn();
  const methodPerReq2 = jest.fn();
  const methodPerRou3 = jest.fn();

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('override services at any level', async () => {
    const server = await new TestApplication(AppModule)
      .overrideProviders([
        ...new Providers()
          .useValue(ServicePerApp, { method: methodPerApp })
          .useValue(ServicePerMod, { method: methodPerMod })
          .useValue(ServicePerRou, { method: methodPerRou })
          .useValue(ServicePerReq, { method: methodPerReq })
          .useValue(ServicePerRou2, { method: methodPerRou2 })
          .useValue(ServicePerReq2, { method: methodPerReq2 }),
      ])
      .getServer();

    const message = 'any-string';

    methodPerApp.mockImplementation(() => message);
    methodPerMod.mockImplementation(() => message);
    methodPerRou.mockImplementation(() => message);
    methodPerReq.mockImplementation(() => message);
    methodPerRou2.mockImplementation(() => message);
    methodPerReq2.mockImplementation(() => message);

    await request(server).get('/per-app').expect(200).expect(message);
    await request(server).get('/per-mod').expect(200).expect(message);
    await request(server).get('/per-rou').expect(200).expect(message);
    await request(server).get('/per-req').expect(200).expect(message);
    await request(server).get('/per-rou2').expect(200).expect(message);
    await request(server).get('/per-req2').expect(200).expect(message);
    expect(methodPerApp).toBeCalledTimes(1);
    expect(methodPerMod).toBeCalledTimes(1);
    expect(methodPerRou).toBeCalledTimes(1);
    expect(methodPerReq).toBeCalledTimes(1);
    expect(methodPerRou2).toBeCalledTimes(1);
    expect(methodPerReq2).toBeCalledTimes(1);

    server.close();
  });

  it('should failed because we trying to override non-passed provider', async () => {
    const server = await new TestApplication(AppModule)
      .overrideProviders([
        { token: ServicePerRou3, useValue: { method: methodPerRou3 } },
        { token: Res, useClass: Res, providers: [ServicePerRou3] },
      ])
      .getServer();

    const message = 'any-string';
    methodPerRou3.mockImplementation(() => message);
    await request(server).get('/per-rou3').expect(500).expect({ error: 'Internal server error' });
    expect(methodPerRou3).toBeCalledTimes(0);

    server.close();
  });
});
