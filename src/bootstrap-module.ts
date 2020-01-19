import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { reflector } from 'ts-di';
import { parentPort, isMainThread, workerData } from 'worker_threads';

import { RootModuleDecorator, ControllersDecorator } from './decorators';
import { Server, ApplicationOptions, Logger, ServerOptions } from './types';
import { Application } from './application';
import { pickProperties } from './utils/pick-properties';
import { ListenOptions } from 'net';

export function bootstrapRootModule(appModule: new (...args: any[]) => any) {
  return new Promise<Server>((resolve, reject) => {
    try {
      const repeat = 80;
      /**
       * Default seting to `http` module.
       */
      let serverModule: RootModuleDecorator['serverModule'] = http;
      let listenOptions: ListenOptions = { port: 8080 };
      let server: Server;
      const createSecureServer = false;
      const annotations = reflector.annotations(appModule) as RootModuleDecorator[];
      const moduleMetadata = annotations[0];
      if (!moduleMetadata) {
        throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
      }
      const appOptions = pickProperties(new ApplicationOptions(), moduleMetadata);
      const app = new Application(appOptions);
      const log = app.injector.get(Logger) as Logger;

      log.trace('annotations for a module:', annotations);
      log.trace('-'.repeat(repeat));

      if (Object.keys(moduleMetadata).length) {
        if (moduleMetadata.serverModule) {
          serverModule = moduleMetadata.serverModule;
          if (
            moduleMetadata.serverOptions &&
            moduleMetadata.serverOptions.http2CreateSecureServer &&
            !(serverModule as typeof http2).createSecureServer
          ) {
            throw new TypeError(`serverModule.createSecureServer() not found (see ${appModule.name} settings)`);
          }
        }

        if (moduleMetadata.listenOptions) {
          listenOptions = moduleMetadata.listenOptions;
        }

        if (moduleMetadata.controllers) {
          moduleMetadata.controllers.forEach(Controller => {
            const controllerMetadata: ControllersDecorator = reflector.annotations(Controller)[0];
            const rootPath = controllerMetadata.path;
            const controllers = reflector.propMetadata(Controller);
            for (const method in controllers) {
              for (const route of controllers[method]) {
                if (!route.hasOwnProperty('method')) {
                  continue;
                }
                let path: string;
                if (rootPath == '/') {
                  path = route.path ? `/${route.path}` : '/';
                } else if (!route.path) {
                  path = rootPath;
                } else {
                  path = `${rootPath}/${route.path}`;
                }
                app.setRoute(route.method, path, Controller, method);
                const msg = {
                  httpMethod: route.method,
                  path,
                  handler: `${Controller.name} -> ${method}()`
                };
                log.trace(msg);
                break;
              }
            }
          });
        }
      }

      const serverOptions = moduleMetadata.serverOptions || {};
      if (createSecureServer) {
        server = (serverModule as typeof http2).createSecureServer(serverOptions, app.requestListener);
      } else {
        server = (serverModule as typeof http | typeof https).createServer(serverOptions, app.requestListener);
      }

      resolve(server);

      if (!isMainThread) {
        const port = (workerData && workerData.port) || 9000;
        listenOptions.port = port;
      }

      server.listen(listenOptions, () => {
        log.info(`${appOptions.serverName} is running at http://localhost:${listenOptions.port}`);
        if (!isMainThread) {
          parentPort.postMessage('Runing worker!');
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
