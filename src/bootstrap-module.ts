import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { reflector } from 'ts-di';
import { parentPort, isMainThread, workerData } from 'worker_threads';

import { RootModuleDecorator, ControllersDecorator } from './decorators';
import { Server, ApplicationOptions } from './types';
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
      const appOptions = pickProperties(new ApplicationOptions(), moduleMetadata);
      const app = new Application(appOptions);
      console.log('annotations for a module:', annotations);
      console.log('-'.repeat(repeat));

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
            const props = reflector.propMetadata(Controller);
            for (const prop in props) {
              for (const route of props[prop]) {
                if (route.hasOwnProperty('method')) {
                  let path: string;
                  if (controllerMetadata.path == '/') {
                    path = route.path ? `/${route.path}` : '/';
                  } else if (!route.path) {
                    path = controllerMetadata.path;
                  } else {
                    path = `${controllerMetadata.path}/${route.path}`;
                  }
                  app.setRoute(route.method, path, Controller, prop);
                  console.log('set HTTP method:', route.method);
                  console.log('set path:', path);
                  console.log('set Controller:', Controller.name);
                  console.log('set method:', prop);
                  console.log('-'.repeat(repeat));
                  break;
                }
              }
            }
          });
        }
      }

      if (createSecureServer) {
        server = (serverModule as typeof http2).createSecureServer(app.requestListener);
      } else {
        server = (serverModule as typeof http | typeof https).createServer(app.requestListener);
      }
      resolve(server);
      if (!isMainThread) {
        const port = (workerData && workerData.port) || 9000;
        listenOptions.port = port;
      }
      server.listen(listenOptions, () => {
        console.log(`INFO: ${appOptions.serverName} is running at http://localhost:${listenOptions.port}`);
        if (!isMainThread) {
          parentPort.postMessage('Runing worker!');
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
