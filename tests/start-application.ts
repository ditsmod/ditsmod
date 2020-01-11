import 'reflect-metadata';
import { parentPort, isMainThread, workerData } from 'worker_threads';
import * as http from 'http';
import * as fs from 'fs';

import { Logger } from '../src/types';
import { Application } from '../src/application';
import { appConfig } from './configs/app.config';
import { AppLogger } from './app/loggers/app.logger';

export function startApplication(callback?: (err?: Error, app?: Application) => void) {
  callback = typeof callback == 'function' ? callback : () => {};
  const app = new Application(appConfig);
  const log = app.injector.get(Logger) as AppLogger;
  const routesDir: string = __dirname + '/app/routes/';

  fs.readdirSync(routesDir).forEach(filename => {
    if (filename.substr(-9) == '.route.js') {
      require(routesDir + filename).routes(app);
    }
  });

  const server = http.createServer(app.requestListener);
  const port = (workerData && workerData.port) || 8080;
  server.listen(port, () => {
    log.info(`INFO: ${appConfig.serverName} is running at http://localhost:${port}`);
    callback(null, app);
    if (!isMainThread) {
      parentPort.postMessage('Runing worker!');
    }
  });

  server.on('error', err => {
    callback(err);
    log.fatal(err);
  });

  process.on('SIGINT', () => {
    log.info('SIGINT');
    process.exit();
  });
}
