import 'reflect-metadata';
import { parentPort, isMainThread, workerData } from 'worker_threads';
import * as fs from 'fs';
import * as http from 'http';

import { Application } from '../src/application';
import { appConfig } from './configs/app.config';

export function startApplication(callback?: (err?: Error, app?: Application) => void) {
  callback = typeof callback == 'function' ? callback : () => {};
  const app = new Application(appConfig);
  const routesDir: string = __dirname + '/app/routes/';

  fs.readdirSync(routesDir).forEach(filename => {
    if (filename.substr(-9) == '.route.js') {
      require(routesDir + filename).routes(app);
    }
  });

  const server = http.createServer(app.requestListener);
  const port = (workerData && workerData.port) || 8080;
  server.listen(port, () => {
    console.log(`INFO: ${appConfig.serverName || 'restify-ts'} is running at http://localhost:${port}`);
    callback(null, app);
    if (!isMainThread) {
      parentPort.postMessage('Runing worker!');
    }
  });

  process.on('SIGINT', () => {
    process.exit();
  });
}
