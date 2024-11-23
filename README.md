## About Ditsmod

Ditsmod is a Node.js web framework written in TypeScript. Yet another backend JavaScript framework? Well, what options do we have at the beginning of 2025? Probably 90% of all these frameworks suggest writing routes and middleware in the ExpressJS style. They look very concise when showcasing a "Hello, World!" example, but as soon as you move to even moderately sized projects (like [RealWorld][5]), it becomes a real challenge for the developer. You need to structure the code so that it is easy to read, test, and scale. This is one reason why microservices are so popular among these frameworks.

This trend continued until the rise of TypeScript, or more accurately, until its popularization through Angular v2+ (in 2016). The static typing offered by TypeScript allows for large-scale project development, and the Dependency Injection (DI) design pattern dramatically simplifies working with such projects. Thanks to these capabilities, Angular inspired the creator of NestJS to develop an "Angular for the backend" (as NestJS is sometimes called), with the first commit made in 2017.

So, what’s the problem? Why not just take the innovative NestJS and adapt it to your needs? The issue lies in the fact that [NestJS has significant architectural flaws][6]. However, its creator has already written a substantial amount of code for the framework's ecosystem, so making architectural changes could result in breaking changes—something undesirable, especially given the solid user base of NestJS. For context, NestJS hit its [first million weekly downloads in 2021][7], about 4.5 years after the initial commit. By the end of 2024, [NestJS was being downloaded 4 million times a week][9]. In my opinion, this statistic reflects an impressive growth rate for NestJS's user base. At the same time, this rapid growth now hinders architectural changes because the creator is reluctant to risk losing users, often rejecting anything that could introduce breaking changes. For example, the [transition to the ESM standard is not planned anytime soon][8] for this very reason.

Ditsmod began development in 2020, also inspired by Angular v2+. I literally extracted Angular’s Dependency Injection module v4.4.7, which became the backbone of the future **Ditsmod** framework. Thanks to DI hierarchy, Ditsmod achieves excellent modularity.

Up until version 3.0.0, Ditsmod had a small user base, allowing for many breaking changes that introduced a range of necessary architectural improvements. Currently, Ditsmod is a mature and stable framework. Starting from version 3.0.0, it adopted synchronized package versions (if any package changes, all packages are published with the same new version). The entire Ditsmod codebase is written in ESM format.

- [The English version of the documentation](https://ditsmod.github.io/en/).
- [Українська версія документації](https://ditsmod.github.io/).

## About the repo

This monorepository uses yarn workspaces (see `package.json`).

During you run the following command:

```bash
yarn install
```

yarn will create symlinks in `node_modules` for all packages listed in the `packages/*` and `examples/*` folders. Also, modules in the `packages/*` folder are linked to the applications in the `examples/*` folder thanks to [compilerOptions.paths][2] as well as [Project References][3]. So, after any change in the source files in `packages/*`, these changes are automatically reflected in `examples/*`.

Development mode for any application in the `examples/*` directory can be started with this command:

```bash
cd examples/01*
yarn start:dev
```

## Benchmarks

On the techempower website, you can view [benchmarks for backend frameworks on the JavaScript stack][4]. As you can see, according to the composite score, Ditsmod is the fastest framework that works on the basis of Node.js. Above it are only those frameworks that work on other JavaScript runtimes (Bun, Just-JS, uwebsockets).

![](tech-empower-benchmarks.png)

[1]: https://github.com/angular/angular
[2]: https://www.typescriptlang.org/tsconfig#paths
[3]: https://www.typescriptlang.org/docs/handbook/project-references.html
[4]: https://www.techempower.com/benchmarks/#section=test&runid=e81c1103-95d8-485e-949a-5ae323c76c87&hw=ph&test=composite&l=zieepr-67z
[5]: https://github.com/tanem/express-bookshelf-realworld-example-app
[6]: https://dev.to/kostyatretyak/nestjs-vs-ditsmod-injection-scopes-537o
[7]: https://x.com/kammysliwiec/status/1447892571376783360
[8]: https://github.com/nestjs/nest/issues/13817#issuecomment-2245130264
[9]: https://x.com/kammysliwiec/status/1859531066006032394
