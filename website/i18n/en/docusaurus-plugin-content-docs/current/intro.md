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

## Install the Ditsmod seed

The [ditsmod-seed][2] repository has the basic set for application operation. Clone it and install the dependencies:

```bash
git clone --depth 1 https://github.com/ditsmod/seed.git my-app
cd my-app
yarn
```

## Run the application

```bash
yarn start
```

This command cannot be used for production mode, but it is suitable for application development, because every time you save your code, the web server will automatically reboot to apply the latest changes.

You can check the server with `curl`:

```bash
curl -isS localhost:3000
```

Or just open the browser on [http://localhost:3000/](http://localhost:3000/).

The application is compiled and the server is started in product mode using the command:

```bash
yarn build
yarn start-prod
```

In addition, you can view more examples in the [examples][4] folder, as well as in the repository [RealWorld][13].

## Entry file for Node.js

After [installing Ditsmod seed][1], the first thing you need to know: all the application code is in the `src` folder, it is compiled using the TypeScript utility `tsc`, after compilation it goes to the `dist` folder, and then as JavaScript code it can be executed in Node.js.

Let's look at the `src/main.ts` file:

```ts
import { Application } from '@ditsmod/core';

import { AppModule } from './app/app.module';

new Application().bootstrap(AppModule).catch((err) => {
  console.log(err);
});
```

Once compiled, it becomes `dist/main.js` and becomes the entry point for running the application in production mode, which is why you will specify it as an argument for Node.js:

```bash
node dist/main.js
```

Looking further at the file `src/main.ts`, you can see that an instance of the class `Application` is created, and as an argument for the method `bootstrap()` is passed `AppModule`. Here `AppModule` is the root module to which other application modules then imports.


[1]: #install-the-ditsmod-seed
[2]: https://github.com/ditsmod/seed
[4]: https://github.com/ditsmod/ditsmod/tree/main/examples
[8]: https://en.wikipedia.org/wiki/Dependency_injection
[9]: https://github.com/angular/angular
[10]: https://jestjs.io/en/
[11]: https://github.com/ts-stack/di
[12]: https://en.wikipedia.org/wiki/Singleton_pattern
[13]: https://github.com/ditsmod/realworld
[14]: https://github.com/ditsmod/vs-webframework#readme
