import { ChainError, Extension, ExtensionsManager, injectable, Injector, Stage1GroupMeta } from '@ditsmod/core';
import { MetadataPerMod3, ROUTES_EXTENSIONS } from '@ditsmod/routing';
import { LoggerInstance } from '@auth/core/types';

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
  }

  async stage2(injectorPerMod: Injector): Promise<void> {
    const authjsConfig = injectorPerMod.get(AuthjsConfig);
    let prevBasePath: string | undefined = undefined;
    for (const metadataPerMod3 of this.stage1GroupMeta.groupData) {
      const { aControllerMetadata } = metadataPerMod3;
      for (const { httpMethods, path, interceptors } of aControllerMetadata) {
        if (interceptors.includes(AuthjsInterceptor)) {
          let basePath: string;
          if (httpMethods.at(0) == 'GET') {
            basePath = (path || '').split('/').slice(0, -1).join('/');
          } else {
            basePath = (path || '').split('/').slice(0, -2).join('/');
          }

          if (prevBasePath !== undefined && prevBasePath != basePath) {
            this.throwDiffBasePathError(prevBasePath, basePath);
          }
          prevBasePath = basePath;
          (authjsConfig.basePath as unknown as string) = `/${basePath}`;
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

  protected throwDiffBasePathError(prevBasePath: string, basePath: string) {
    const msg = `Detected two different basePaths for Auth.js within the same module: "${prevBasePath}" and "${basePath}".`;
    throw new Error(msg);
  }
}
