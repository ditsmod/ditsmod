## Why You Should Try Ditsmod

As of late 2025, there are roughly three dozen well-known backend web frameworks for Node.js. The majority are written in JavaScript, while the rest use TypeScript. Newer frameworks are almost always written in TypeScript, since it brings a number of significant advantages. Around ten of these frameworks provide built-in Dependency Injection (DI) and use decorators for metaprogramming. Only a handful – maybe five – offer first-class modularity. And just about three of them have their codebase written in pure ESM.

It’s understandable that mature frameworks with large ecosystems and user bases can’t easily switch to the newest ECMAScript features. Smaller or less popular frameworks, on the other hand, can experiment more freely, introduce breaking changes, and fix deep architectural issues along the way.

**Ditsmod** has been in development since early 2020, and its third major release is planned for early 2026. Version 3 will focus on framework stabilization, full test coverage, and API refinements.

So why should you give **Ditsmod** a try?  
Earlier versions went through a lot of breaking changes, but as a result, Ditsmod now has a solid, modular, and flexible architecture designed for building modern, scalable applications. Its codebase is written in TypeScript and uses ESM natively. It comes with hierarchical Dependency Injection – a perfect match for modular applications. With built-in helpers for decorators and TypeScript-powered reflection, Ditsmod makes metaprogramming practical and productive, simplifying dependency management, module integration, and testing.

- [The English version of the documentation](https://ditsmod.github.io/en/).
- [Українська версія документації](https://ditsmod.github.io/).

## Benchmarks

On the techempower website, you can view [benchmarks for backend frameworks on the JavaScript stack][4] (results load up to 10 seconds). As you can see, according to the composite score, Ditsmod is the fastest framework that works on the basis of Node.js. Above it are only those frameworks that work on other JavaScript runtimes (Bun, Just-JS, uwebsockets).

![](website/static/img/tech-empower-benchmarks.png)

## About the repo

This monorepository uses yarn workspaces (see `package.json`).

During you run the following command:

```bash
corepack enable
corepack install
yarn install
cd packages/openapi
yarn build-ui
```

yarn will create symlinks in `node_modules` for all packages listed in the `packages/*` and `examples/*` folders. Also, modules in the `packages/*` folder are linked to the applications in the `examples/*` folder thanks to [compilerOptions.paths][2] as well as [Project References][3]. So, after any change in the source files in `packages/*`, these changes are automatically reflected in `examples/*`.

Development mode for any application in the `examples/*` directory can be started with this command:

```bash
cd examples/01*
yarn start:dev
```

[1]: https://github.com/angular/angular
[2]: https://www.typescriptlang.org/tsconfig#paths
[3]: https://www.typescriptlang.org/docs/handbook/project-references.html
[4]: https://www.techempower.com/benchmarks/#section=test&runid=e8b36ecc-d623-48bb-936d-d043e9db2c13&l=zieepr-cjj
[5]: https://github.com/tanem/express-bookshelf-realworld-example-app
[6]: https://dev.to/kostyatretyak/nestjs-vs-ditsmod-injection-scopes-537o
[7]: https://x.com/kammysliwiec/status/1447892571376783360
[8]: https://github.com/nestjs/nest/issues/13817#issuecomment-2245130264
[9]: https://x.com/kammysliwiec/status/1859531066006032394
