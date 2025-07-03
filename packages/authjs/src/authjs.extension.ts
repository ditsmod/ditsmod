import {
  ChainError,
  Extension,
  ExtensionsManager,
  HttpMethod,
  injectable,
  Injector,
  Stage1ExtensionMeta,
} from '@ditsmod/core';
import { MetadataPerMod3, RoutesExtension } from '@ditsmod/rest';
import { LoggerInstance } from '@auth/core/types';

import { AuthjsConfig } from '#mod/authjs.config.js';
import { AuthjsInterceptor } from '#mod/authjs.interceptor.js';
import { AuthjsLogMediator } from './authjs-log-mediator.js';

@injectable()
export class AuthjsExtension implements Extension {
  protected stage1ExtensionMeta: Stage1ExtensionMeta<MetadataPerMod3>;

  constructor(
    protected extensionManager: ExtensionsManager,
    protected logMediator: AuthjsLogMediator,
  ) {}

  async stage1() {
    this.stage1ExtensionMeta = await this.extensionManager.stage1(RoutesExtension);
  }

  async stage2(injectorPerMod: Injector): Promise<void> {
    const authjsConfig = injectorPerMod.get(AuthjsConfig);
    parent: for (const metadataPerMod3 of this.stage1ExtensionMeta.groupData) {
      const { aControllerMetadata } = metadataPerMod3;
      for (const obj of aControllerMetadata) {
        const { fullPath, interceptors, httpMethods } = obj;
        const splitedPath = fullPath.split('/');
        if (interceptors.includes(AuthjsInterceptor)) {
          if (splitedPath.length < 3 || splitedPath.at(-2) != ':action') {
            this.throwInvalidUrl(httpMethods, fullPath);
          }
          const basePath = splitedPath.slice(0, -2).join('/');
          (authjsConfig.basePath as unknown as string) = `/${basePath}`;
          aControllerMetadata.push({ ...obj, httpMethods: ['GET'], fullPath: `${basePath}/:action` });
          break parent;
        }
      }
    }
    this.setAuthjsLogger(authjsConfig);
  }

  protected throwInvalidUrl(httpMethods: HttpMethod[], path: string) {
    const msg =
      `Unexpected URL for Auth.js: "${httpMethods.join(', ')} ${path}". Please provide a ` +
      'URL that matches the following pattern: "arbitrary-path/:action/:arbitrary-param-name"';
    throw new Error(msg);
  }

  protected setAuthjsLogger(authjsConfig: AuthjsConfig) {
    authjsConfig.logger ??= {
      error: (err) => {
        this.logMediator.message('error', ChainError.getFullStack(err)!);
      },
      debug: (message) => {
        this.logMediator.message('debug', message);
      },
      warn: (message) => {
        this.logMediator.message('warn', message);
      },
    } satisfies LoggerInstance;
  }
}
