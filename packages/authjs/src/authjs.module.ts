import {
  featureModule,
  Injector,
  ModuleWithParams,
  OnModuleInit,
  RequireOnlyProps,
  CustomError,
  Status,
  Logger,
} from '@ditsmod/core';
import { type AuthConfig } from '@auth/core';
import { RoutingModule } from '@ditsmod/routing';
import { BodyParserModule } from '@ditsmod/body-parser';
import { LoggerInstance } from '@auth/core/types';

import { AUTHJS_CONFIG } from './constants.js';
import { AuthjsController } from '#mod/authjs.controller.js';

/**
 * Ditsmod module to support [Auth.js][1].
 *
 * [1]: https://authjs.dev/
 */
@featureModule({
  imports: [RoutingModule, BodyParserModule],
  controllers: [AuthjsController],
})
export class AuthjsModule implements OnModuleInit {
  constructor(protected injector: Injector) {}

  static withParams(config: RequireOnlyProps<AuthConfig, 'basePath'>): ModuleWithParams<AuthjsModule> {
    let absolutePath: string = config.basePath ?? '/api/auth';

    if (absolutePath.at(0) == '/') {
      absolutePath = absolutePath.slice(1);
    } else {
      config.basePath = `/${absolutePath}`;
    }

    return {
      absolutePath,
      module: this,
      providersPerMod: [{ token: AUTHJS_CONFIG, useValue: config }],
      exports: [AUTHJS_CONFIG],
    };
  }

  onModuleInit() {
    const config = this.injector.get(AUTHJS_CONFIG, undefined, false) as AuthConfig | false;
    if (config) {
      this.patchAuthjsConfig(config);
    } else {
      let msg1 = `AUTHJS_CONFIG is not provided. It looks like you imported ${this.constructor.name}`;
      msg1 += ` without using the ${this.constructor.name}.withParams() method.`;
      throw new CustomError({ msg1, level: 'error', status: Status.INTERNAL_SERVER_ERROR });
    }
  }

  protected patchAuthjsConfig(config: AuthConfig) {
    const logger = this.injector.get(Logger) as Logger;

    config.logger ??= {
      error: (message) => {
        logger.log('error', `Auth.js error: ${message}`);
      },
      debug: (message) => {
        logger.log('debug', `Auth.js message: ${message}`);
      },
      warn: (message) => {
        logger.log('warn', `Auth.js message: ${message}`);
      },
    } satisfies LoggerInstance;
  }
}
