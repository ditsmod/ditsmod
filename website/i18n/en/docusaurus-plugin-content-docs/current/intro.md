---
sidebar_position: 1
---

# Introduction

## About the project

Ditsmod is a Node.js web framework, named **DI** + **TS** + **Mod** to emphasize its important
components: it has **D**ependency **I**njection, written in **T**ype**S**cript, and designed for
good **Mod**ularity.

The main features of Ditsmod:

- Convenient mechanism for [specifying and resolve][8] between different application classes: you
in constructor specify instances of what classes you need, and DI undertakes a difficult task
"as their get".
- Ability to easily substitute by default classes in the Ditsmod core with their own classes.
For example, most likely, you will want to replace the logger class with your own class, because by
default the logger writes everything only to the console.
- Ability to easily substitute the classes of your application with test classes (mocks, stubs),
without changing the code of your application. This greatly simplifies testing.
- Ditsmod is designed to provide good modularity of the entire application, and therefore good
scalability. Its DI supports hierarchy, which means you can declare [singletons][12]: or at the
level of the entire application, or at the level of a specific module, or at the level of
a specific route, or at the level of an HTTP request.

Some of the architecture concepts of this framework are taken from [Angular][9] and [DI][11]
actually extracted from Angular v4.4.7. (with minimal modifications) and integrated into Ditsmod.

## Install the Ditsmod seed

The [ditsmod-seed][2] repository has the minimum basic set for application operation. Clone it and
set the dependencies:

```bash
git clone git@github.com:ditsmod/seed.git my-app
cd my-app
yarn
```

## Run the application

```bash
yarn start
```

You can use this to develop an application, because after each save of your code, you will be able
to see these changes immediately.

You can check the server with `curl`:

```bash
curl -isS localhost:8080
```

The application is compiled using the command:

```bash
yarn build
```

In addition, you can view more examples in the [examples][4] folder.

## Entry file for Node.js

After [installing Ditsmod seed][1], the first thing you need to know: all the application code is
in the `src` folder, it is compiled using the TypeScript utility `tsc`, after compilation it goes
to the `dist` folder, and then as JavaScript code it can be executed in Node.js.

Let's look at the `src/main.ts` file:

```ts
import 'reflect-metadata';
import { Application } from '@ditsmod/core';

import { AppModule } from './app/app.module';

new Application()
  .bootstrap(AppModule)
  .then(({ server, logger }) => {
    server.on('error', (err) => logger.error(err));
  })
  .catch(({ err, logger }) => {
    logger.fatal(err);
    throw err;
  });
```

Once compiled, it becomes `dist/main.js` and becomes the entry point for running the application,
which is why you will specify it as an argument for Node.js:

```bash
node dist/main.js
```

Note the `import 'reflect-metadata'` in the first line of the file. This module is required for
Ditsmod to work, but it is sufficient to specify it only once in the entry file for Node.js.

It is desirable to remember this rule for the future, and to apply it also for writing of tests as
in that case the entry file will be the test file, instead of `dist/main.js`. For example, if you
use [jest][10] as a test runner, and the `test-file.js` file contains a compiled test, to run it
like this:

```bash
jest test-file.js
```

this file must contain a `reflect-metadata` import.

Looking further at the file `src/main.ts`, you can see that an instance of the class `Application`
is created, and as an argument for the method `bootstrap()` is passed `AppModule`. Here
`AppModule` is the root module to which other application modules are then connected.


[1]: #install-the-ditsmod-seed
[2]: https://github.com/ditsmod/seed
[4]: https://github.com/ditsmod/ditsmod/tree/main/examples
[8]: https://en.wikipedia.org/wiki/Dependency_injection
[9]: https://github.com/angular/angular
[10]: https://jestjs.io/en/
[11]: https://github.com/ts-stack/di
[12]: https://en.wikipedia.org/wiki/Singleton_pattern
