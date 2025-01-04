import { ChainError, Extension, ExtensionsManager, injectable, Injector, Stage1GroupMeta } from '@ditsmod/core';
import { MetadataPerMod3, ROUTES_EXTENSIONS } from '@ditsmod/routing';
import { LoggerInstance } from '@auth/core/types';
import { BODY_PARSER_EXTENSIONS } from '@ditsmod/body-parser';

import { AuthjsConfig } from '#mod/authjs.config.js';
import { AuthjsInterceptor } from '#mod/authjs.interceptor.js';
import { AuthjsLogMediator } from './authjs-log-mediator.js';

@injectable()
export class AuthjsExtension implements Extension {
  protected stage1GroupMeta: Stage1GroupMeta<MetadataPerMod3>;

  constructor(
    protected extensionManager: ExtensionsManager,
    protected logMediator: AuthjsLogMediator,
  ) {}

  async stage1() {
    this.stage1GroupMeta = await this.extensionManager.stage1(ROUTES_EXTENSIONS);
    await this.extensionManager.stage1(BODY_PARSER_EXTENSIONS);
  }

  async stage2(injectorPerMod: Injector): Promise<void> {
    const authjsConfig = injectorPerMod.get(AuthjsConfig);
    parent: for (const metadataPerMod3 of this.stage1GroupMeta.groupData) {
      const { aControllerMetadata } = metadataPerMod3;
      for (const obj of aControllerMetadata) {
        const { path, interceptors } = obj;
        if (interceptors.includes(AuthjsInterceptor)) {
          const basePath = path.split('/').slice(0, -2).join('/');
          (authjsConfig.basePath as unknown as string) = `/${basePath}`;
          const actionPath = basePath ? `${basePath}/:action` : ':action';
          aControllerMetadata.push({...obj, httpMethods: ['GET'], path: actionPath });
          break parent;
        }
      }
    }
    this.setAuthjsLogger(authjsConfig);
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
