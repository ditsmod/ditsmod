# Ditsmod

> A modern, fast, and scalable Node.js framework built with TypeScript, native ESM, hierarchical Dependency Injection, and explicit modular architecture.

**Ditsmod** (DI + TS + Module) is designed for developers who appreciate strong architectural integrity, type safety, and clean separation of concerns without global-scope magic.

## Key Features

- **Pure ESM & TypeScript-First**: Built from the ground up to leverage modern ECMAScript modules and Node.js features.
- **Hierarchical Dependency Injection**: Fine-grained control over provider scopes (`perApp`, `perMod`, `perRou`, `perReq`), making testing and memory isolation straightforward.
- **Explicit Modularity**: Modules explicitly state what they import and export, preventing unwanted side effects and hidden dependencies.
- **Powerful Extensions API**: Dynamically register providers, attach custom metadata, and build framework-level features using multi-stage initialization hooks.
- **High Performance**: Light core with low overhead, significantly outperforming many traditional Node.js backend frameworks.
- **Pluggable Architecture**: Keep your core lean. Add REST (`@ditsmod/rest`), tRPC (`@ditsmod/trpc`), Scheduling (`@ditsmod/schedule`), or OpenAPI integration only when needed.

## Quick Start Example

Here is a minimal REST application using `@ditsmod/rest`:

```ts
import { rootModule, Controller, Res, Route } from '@ditsmod/rest';
import { Application } from '@ditsmod/core';

@Controller()
export class HelloWorldController {
  @Route('GET')
  tellHello(res: Res) {
    res.send('Hello, World!');
  }
}

@rootModule({
  controllers: [HelloWorldController],
})
export class AppModule {}

const app = await Application.createApp(AppModule);
app.getServer().listen(3000);
```

## Documentation

- 🇬🇧 [English Documentation](https://ditsmod.github.io/en/)
- 🇺🇦 [Українська версія документації](https://ditsmod.github.io/)

## Benchmarks

Ditsmod is built with performance in mind. Check out the [web framework benchmark comparison][4].

![Framework Benchmarks][10]

## Monorepo Development

This monorepository uses Yarn Workspaces.

### Initial Setup

```bash
corepack enable
corepack install
yarn install
yarn prepare
yarn build
```

All packages inside `packages/*` are automatically linked to `examples/*` using TypeScript project references and subpath mappings. Any changes in `packages/*` immediately update the build for example applications.

### Running Examples

To run an example application in development mode:

```bash
cd examples/01-hello-world
yarn start
```

### Documentation Site

To preview the documentation site locally:

```bash
yarn docs-en
```

Documentation files are located in `website/i18n/en/docusaurus-plugin-content-docs/current/`.

[4]: https://github.com/ditsmod/vs-webframework
[10]: https://github.com/ditsmod/vs-webframework/blob/main/req-per-sec-frameworks4.png
