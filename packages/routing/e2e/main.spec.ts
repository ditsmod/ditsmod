import request from 'supertest';
import { Providers, Res } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';
import { jest } from '@jest/globals';

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
import { TestRoutingPlugin } from '#mod/testing/test-routing-application.js';

describe('@ditsmod/routing/e2e', () => {
  const message = 'any-string';
  const implementation = () => message;
  const methodPerApp = jest.fn(implementation);
  const methodPerMod = jest.fn(implementation);
  const methodPerRou = jest.fn(implementation);
  const methodPerReq = jest.fn(implementation);
  const methodPerRou2 = jest.fn(implementation);
  const methodPerReq2 = jest.fn(implementation);
  const methodPerRou3 = jest.fn(implementation);

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('override services at any level', async () => {
    const aProvidersToOverride = new Providers()
      .useValue<ServicePerRou2>(ServicePerRou2, { method: methodPerRou2 })
      .useValue<ServicePerReq2>(ServicePerReq2, { method: methodPerReq2 });

    const server = await TestApplication.createTestApp(AppModule)
      .$use(TestRoutingPlugin)
      .overrideGroupRoutingMeta(aProvidersToOverride)
      .overrideProviders(
        new Providers()
          .useValue<ServicePerApp>(ServicePerApp, { method: methodPerApp })
          .useValue<ServicePerMod>(ServicePerMod, { method: methodPerMod })
          .useValue<ServicePerRou>(ServicePerRou, { method: methodPerRou })
          .useValue<ServicePerReq>(ServicePerReq, { method: methodPerReq }),
      )
      .getServer();

    const testAgent = request(server);

    await testAgent.get('/per-app').expect(200).expect(message);
    await testAgent.get('/per-mod').expect(200).expect(message);
    await testAgent.get('/per-rou').expect(200).expect(message);
    await testAgent.get('/per-req').expect(200).expect(message);
    await testAgent.get('/per-rou2').expect(200).expect(message);
    await testAgent.get('/per-req2').expect(200).expect(message);
    expect(methodPerApp).toHaveBeenCalledTimes(1);
    expect(methodPerMod).toHaveBeenCalledTimes(1);
    expect(methodPerRou).toHaveBeenCalledTimes(1);
    expect(methodPerReq).toHaveBeenCalledTimes(1);
    expect(methodPerRou2).toHaveBeenCalledTimes(1);
    expect(methodPerReq2).toHaveBeenCalledTimes(1);

    server?.close();
  });

  it('should failed because we trying to override non-passed provider', async () => {
    const server = await TestApplication.createTestApp(AppModule)
      .overrideProviders([
        { token: ServicePerRou3, useValue: { method: methodPerRou3 } },
        { token: Res, useClass: Res, providers: [ServicePerRou3] },
      ])
      .getServer();

    methodPerRou3.mockImplementation(implementation);
    const msg = 'No provider for ServicePerRou3!; this error during calling Controller1.prototype.perRou3!';
    await request(server).get('/per-rou3').expect(500).expect({ error: msg });
    expect(methodPerRou3).toHaveBeenCalledTimes(0);

    server?.close();
  });
});
