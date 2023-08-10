import request = require('supertest');
import { Providers, Server } from '@ditsmod/core';

import { TestApplication } from '../src/test-application';
import { AppModule } from './app/app.module';
import { OtherService } from './app/other.service';

describe('@ditsmod/testing', () => {
  let server: Server;
  const helloAdmin = jest.fn();

  beforeEach(async () => {
    jest.restoreAllMocks();

    server = await new TestApplication(AppModule)
      .setLogLevelForInit('error')
      .overrideProviders([
        ...new Providers()
        .useLogConfig({ level: 'error' })
        .useValue(OtherService, { helloAdmin }),
      ])
      .getServer();
  });

  it('override OtherService', async () => {
    await request(server).get('/').expect(200).expect('Hello, World!\n');

    const message = 'any-string';
    helloAdmin.mockImplementation(() => message);
    await request(server).get('/admin').expect(200).expect(message);
    expect(helloAdmin).toBeCalledTimes(1);

    server.close();
  });
});
