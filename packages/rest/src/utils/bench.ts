import { Injector, ModuleExtract } from '@ditsmod/core';

import { Fn } from '../types/types.js';
import { Tree } from '../services/tree.js';
import { DefaultRouter } from '../services/router.js';
import { RestErrorMediator } from '../services/router-error-mediator.js';

await runBench();

async function runBench() {
  let isInited = false;

  interface Lib {
    name: string;
    routerClass?: string;
    onRouteMethod?: string;
    findRouteMethod?: string;
  }

  const benchmarks: Lib[] = [
    { name: 'koa-tree-router', onRouteMethod: 'on', findRouteMethod: 'find' },
    { name: '@ditsmod/rest', routerClass: 'Router', onRouteMethod: 'on', findRouteMethod: 'find' },
    { name: 'find-my-way', onRouteMethod: 'on', findRouteMethod: 'find' },
    { name: 'trek-router', onRouteMethod: 'add', findRouteMethod: 'find' },
  ];

  const widthTable = 60;

  console.log('~'.repeat(widthTable));
  console.log('Running in random order');
  console.log('='.repeat(widthTable));

  const hMarginFromName = ' '.repeat(17);
  console.log(`Lib ${hMarginFromName} | Bench, ops/sec | Memory usage, KB`);

  console.log('='.repeat(widthTable));

  for (const lib of shuffle(benchmarks)) {
    const loadFrom: string = lib.name;

    try {
      const imp = await import(loadFrom);
      const fullLib = imp.default ? imp.default : imp;
      const Router = lib.routerClass ? fullLib[lib.routerClass] : fullLib;
      let router: any;

      if (lib.name == '@ditsmod/rest') {
        const injector = Injector.resolveAndCreate([Tree, DefaultRouter, RestErrorMediator, ModuleExtract], 'bench');
        router = injector.get(DefaultRouter);
      } else {
        router = new Router();
      }
      const onMethod = router[lib.onRouteMethod].bind(router);
      const findRoute = router[lib.findRouteMethod].bind(router);
      await new Promise<void>((resolve) => {
        setTimeout(callback, isInited ? 1000 : 0);
        function callback() {
          bench(lib.name, onMethod, findRoute);
          isInited = true;
          resolve();
        }
      });
    } catch (e: any) {
      console.log(`Could not bench '${lib.name}'.`);
      console.log(e.stack);
    }
  }
}

/**
 * @param name Name of engine.
 */
export function bench(name: string, onMethod: Fn, findRoute: Fn): void {
  const widthTable = 60;
  const times = 100000;
  const startBench = now();

  const routes: any[] = [
    { method: 'GET', url: '/user' },
    { method: 'GET', url: '/user/comments' },
    { method: 'GET', url: '/user/avatar' },
    { method: 'GET', url: '/user/lookup/username/:username' },
    { method: 'GET', url: '/user/lookup/email/:address' },
    { method: 'GET', url: '/event/:id' },
    { method: 'GET', url: '/event/:id/comments' },
    { method: 'POST', url: '/event/:id/comment' },
    { method: 'GET', url: '/map/:location/events' },
    { method: 'GET', url: '/status' },
    { method: 'GET', url: '/very/deeply/nested/route/hello/there' },
    // { method: 'GET', url: '/static/*file' }, // find-my-way it's not supported anymore

    { method: 'GET', url: '/cmd/:tool/:sub' },
    { method: 'GET', url: '/cmd/:tool/' },
    // { method: 'GET', url: '/src/*filepath' }, // find-my-way it's not supported anymore
    { method: 'GET', url: '/search/' },
    { method: 'GET', url: '/search/:query' },
    { method: 'GET', url: '/user_:name' },
    { method: 'GET', url: '/user_:name/about' },
    // { method: 'GET', url: '/files/:dir/*filepath' }, // find-my-way it's not supported anymore
    { method: 'GET', url: '/doc/' },
    { method: 'GET', url: '/doc/node_faq.html' },
    { method: 'GET', url: '/doc/node1.html' },
    { method: 'GET', url: '/info/:user/public' },
    { method: 'GET', url: '/info/:user/project/:project' },
  ];

  routes.forEach(({ method, url }) => {
    onMethod(method, url, () => {});
  });

  for (let i = 0; i < times; i++) {
    findRoute('GET', '/user');
    findRoute('GET', '/user/comments');
    findRoute('GET', '/user/lookup/username/john');
    findRoute('GET', '/event/abcd1234/comments');
    findRoute('GET', '/very/deeply/nested/route/hello/there');
    findRoute('GET', '/static/index.html');

    findRoute('GET', '/cmd/tool123456/sub123456');
    findRoute('GET', '/cmd/tool123456/');
    findRoute('GET', '/src/filepath123456');
    findRoute('GET', '/search/');
    findRoute('GET', '/search/query123456');
    findRoute('GET', '/user_name123456');
    findRoute('GET', '/user_name/about123456');
    findRoute('GET', '/files/dir123456/filepath123456');
    findRoute('GET', '/doc/');
    findRoute('GET', '/doc/some');
    findRoute('GET', '/doc/node_faq.html');
    findRoute('GET', '/doc/node1.html');
    findRoute('GET', '/info/user123456/public');
    findRoute('GET', '/info/user123456/project/project123456');
  }

  const heapUsed = Math.round(process.memoryUsage().heapUsed / 1024).toLocaleString();
  const benchTime = Math.round((times * 20 * 1000000000) / Number(now() - startBench)).toLocaleString();
  const marginFromName = ' '.repeat(21 - name.length);
  const marginFromBench = ' '.repeat(14 - benchTime.toString().length);

  const output = `${name}${marginFromName} | ${benchTime}${marginFromBench} | ${heapUsed}`;

  console.log(output);
  console.log('-'.repeat(widthTable));
}

function now() {
  return process.hrtime.bigint();
}

function shuffle(arr: any[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    [arr[i], arr[j]] = [arr[j], arr[i]]; // swap elements
  }
  return arr;
}
