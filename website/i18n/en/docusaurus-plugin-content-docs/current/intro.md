---
slug: /
sidebar_position: 1
---

# Introduction

## About the project

Ditsmod is a Node.js web framework, named **DI** + **TS** + **Mod** to emphasize its important components: it has **D**ependency **I**njection, written in **T**ype**S**cript, and designed for good **Mod**ularity.

The main features of Ditsmod:

- Modular architecture on decorators, which allows you to declaratively describe the structure of the application.
- A convenient mechanism for [specifying and resolving dependencies][8] between different classes: you specify the instances of which classes you need in the constructor, and DI does the hard work of "how to get them".
- Ability to write your own extensions (sometimes called plugins) that can be asynchronously initialized and that can depend on each other.
- Ability to dynamically add and remove modules after starting the web server, without the need to restart.
- Has OpenAPI support, and has the ability to validate queries based on OpenAPI metadata.
- To date, [Ditsmod is one of the fastest][14] among Node.js web frameworks.

Some concepts of Ditsmod architecture are taken from Angular concepts, and DI is built based on the native Angular DI module.

### ExpressJS vs. Ditsmod

For comparison, the following two examples show the minimal code required to run ExpressJS and Ditsmod applications.

```js
import express from 'express';
const app = express();

app.get('/hello', function (req, res) {
  res.send('Hello, World!');
});

app.listen(3000, '0.0.0.0');
```

```ts
import { controller, route, Res, rootModule, Application } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

@controller()
class ExampleController {
  @route('GET', 'hello')
  tellHello(res: Res) {
    res.send('Hello, World!');
  }
}

@rootModule({
  imports: [RoutingModule],
  controllers: [ExampleController],
})
class AppModule {}

const app = await new Application().bootstrap(AppModule);
app.server.listen(3000, '0.0.0.0');
```

Looking at the amount of code, you might think that Ditsmod is slower than ExpressJS because of its verbosity. But in fact, only Ditsmod's cold start is slightly slower (it starts in 18ms on my laptop, while ExpressJS starts in 4ms). In terms of request processing speed, [Ditsmod is more than twice as fast as ExpressJS][14].

More application examples are available in the [Ditsmod][4] repository, as well as in the [RealWorld][13] repository.

## Prerequisites

Please make sure that Node.js >= v18.14.0 is installed on your operating system.

## Installation

The basic set for running the application has a repository [ditsmod/seed][2]. Clone it and install the dependencies:

```bash
git clone --depth 1 https://github.com/ditsmod/seed.git my-app
cd my-app
npm i
```

Alternatively, you can use the starter monorepo:

```bash
git clone --depth 1 https://github.com/ditsmod/monorepo.git my-app
cd my-app
npm i
```

## Start in Development Mode

For development mode, you'll need two terminals. In one, TypeScript code will be compiled into JavaScript code, and in the other, a web server will be running. After each code change, the web server will pick up these changes and reload.

Command for the first terminal:

```bash
npm run watch
```

Command for the second terminal:

```bash
npm start
```

You can check the server operation using `curl`:

```bash
curl -i localhost:3000
```

Or simply by going to [http://localhost:3000/](http://localhost:3000/) in your browser.

Of course, instead of two terminals, you can use, for example, [ts-node][17] in one terminal, but this is a slower option, because after each change `ts-node` will recompile all the code on the fly, while in `tsc -w` only recompiles the changed file. In addition, thanks to [ditsmod/seed][2]'s use of the so-called [Project References][16] and `tsc -b` build mode, even very large projects compile very quickly.

Note that there are four config files for TypeScript in the `ditsmod/seed` repository:

- `tsconfig.json` - the basic configuration used by your IDE (in most cases it is probably VS Code).
- `tsconfig.build.json` - this configuration is used to compile the code from the `src` directory to the `dist` directory, it is intended for application code.
- `tsconfig.test.json` - this configuration is used to compile end-to-end tests.
- `tsconfig.unit.json` - this configuration is used to compile unit tests.

Also, note that since `ditsmod/seed` is declared as an EcmaScript Module (ESM), you can use [native Node.js aliases][18] to shorten file paths. This is analogous to `compilerOptions.paths` in `tsconfig`. Such aliases are declared in `package.json` in the `imports` field:

```json {2}
"imports": {
  "#app/*": "./dist/app/*"
},
```

Now you can use it, for example in the `test` folder, like this:

```ts
import { AppModule } from '#app/app.module.js';
```

At the moment (2023-10-13) TypeScript does not yet fully support these aliases, so it is advisable to duplicate them in the `tsconfig.json` file:

```json
// ...
  "paths": {
    "#app/*": ["./src/app/*"]
  }
// ...
```

Note that in `package.json` the aliases point to `dist`, while in `tsconfig.json` they point to `src`.

## Start in product mode

The application is compiled and the server is started in product mode using the command:

```bash
npm run build
npm run start-prod
```

## Entry file for Node.js

After [installing Ditsmod seed][1], the first thing you need to know: all the application code is in the `src` folder, it is compiled using the TypeScript utility `tsc`, after compilation it goes to the `dist` folder, and then as JavaScript code it can be executed in Node.js.

Let's look at the `src/main.ts` file:

```ts
import { ServerOptions } from 'node:http';
import { Application } from '@ditsmod/core';

import { AppModule } from './app/app.module.js';
import { checkCliAndSetPort } from './app/utils/check-cli-and-set-port.js';

const serverOptions: ServerOptions = { keepAlive: true, keepAliveTimeout: 5000 };
const app = await new Application().bootstrap(AppModule, { serverOptions, path: 'api' });
const port = checkCliAndSetPort(3000);
app.server.listen(port, '0.0.0.0');
```

After compilation, it becomes `dist/main.js` and becomes the entry point for running the application in production mode, and so why you will specify it as an argument to Node.js:

```bash
node dist/main.js
```

Looking at the file `src/main.ts`, you can see that an instance of the class `Application` is created, and as an argument for the method `bootstrap()` is passed `AppModule`. Here `AppModule` is the root module to which other application modules then imports.


[1]: #installation
[2]: https://github.com/ditsmod/seed
[4]: https://github.com/ditsmod/ditsmod/tree/main/examples
[8]: https://en.wikipedia.org/wiki/Dependency_injection
[9]: https://github.com/angular/angular
[10]: https://jestjs.io/en/
[12]: https://en.wikipedia.org/wiki/Singleton_pattern
[13]: https://github.com/ditsmod/realworld
[14]: https://github.com/ditsmod/vs-webframework#readme
[15]: https://github.com/remy/nodemon
[16]: https://www.typescriptlang.org/docs/handbook/project-references.html
[17]: https://github.com/TypeStrong/ts-node
[18]: https://nodejs.org/api/packages.html#imports
