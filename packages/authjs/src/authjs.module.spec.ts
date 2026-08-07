import type { ClassProvider } from '@holu/core';
import { AuthjsModule } from './authjs.module.js';
import { AuthjsConfig } from './authjs.config.js';

describe('AuthjsModule', () => {
  it('withConfig with object config', () => {
    const config = new AuthjsConfig();
    const dynamicModule = AuthjsModule.withConfig(config);

    expect(dynamicModule).toEqual({
      module: AuthjsModule,
      providersPerMod: [{ token: AuthjsConfig, useValue: config }],
      exports: [AuthjsConfig],
    });
  });

  it('withConfig with ClassProvider', () => {
    const provider: ClassProvider = { token: AuthjsConfig, useClass: AuthjsConfig };
    const dynamicModule = AuthjsModule.withConfig(provider);

    expect(dynamicModule).toEqual({
      module: AuthjsModule,
      providersPerMod: [provider],
      exports: [AuthjsConfig],
    });
  });
});
