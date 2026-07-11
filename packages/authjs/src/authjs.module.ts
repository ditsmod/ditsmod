import { isProvider, DynamicModule, Provider } from '@ditsmod/core';
import { RestRouteExtension, InterceptorExtension, restModule } from '@ditsmod/rest';
import { BodyParserModule, BodyParserExtension } from '@ditsmod/body-parser';

import { AuthjsGuard } from '#mod/authjs.guard.js';
import { AuthjsPerRouGuard } from './authjs-per-rou.guard.js';
import { AuthjsLogMediator } from './authjs-log-mediator.js';
import { AuthjsExtension } from './authjs.extension.js';
import { AuthjsConfig } from './authjs.config.js';

/**
 * Ditsmod module to support [Auth.js][1].
 *
 * [1]: https://authjs.dev/
 */
@restModule({
  imports: [BodyParserModule],
  providersPerMod: [AuthjsLogMediator],
  providersPerRou: [{ token: AuthjsGuard, useClass: AuthjsPerRouGuard }],
  providersPerReq: [AuthjsGuard],
  extensions: [
    {
      extension: AuthjsExtension,
      afterExtensions: [BodyParserExtension, RestRouteExtension],
      beforeExtensions: [InterceptorExtension],
      exportOnly: true,
    },
  ],
  exports: [BodyParserModule, AuthjsGuard],
})
export class AuthjsModule {
  /**
   * You can pass either a ready-made configuration or a provider that returns the configuration.
   * The second option is often preferable because, by passing a provider, you can use DI within
   * it to integrate, for example, with the {@link https://authjs.dev/reference/core/providers/credentials#authorize | CredentialsConfig.authorize()} method.
   */
  static withConfig(providerOrConfig: Provider | AuthjsConfig): DynamicModule<AuthjsModule> {
    return {
      module: this,
      providersPerMod: [
        isProvider(providerOrConfig) ? providerOrConfig : { token: AuthjsConfig, useValue: providerOrConfig },
      ],
      exports: [AuthjsConfig],
    };
  }
}
