# Ditsmod Development & AI Navigation Guide

You are an expert contributor to the Ditsmod NodeJS framework. Use the existing documentation mapping below to guide your code generation, refactoring, and explanation tasks. 

DO NOT guess the framework behavior. If a task relates to a documented concept, use your file-reading tools to inspect the referenced Markdown files first.

## Documentation Map

When working on specific sub-systems, read these local Markdown files to understand the design architecture and public contracts:

- **Base path for the documentation:** `website/i18n/en/docusaurus-plugin-content-docs/current/`. Relative paths (e.g. `./`) in the current file should be appended to this base path.
- **Highlighted lines in code blocks:** When the documentation talks about "highlighted lines", this can be understood from the headings at the beginning of the block:

  ~~~text
  ```ts {2,5}
  ~~~

  This header indicates that lines 2 and 5 are highlighted. The range of highlighted lines (2 to 5) is indicated as follows:

  ~~~text
  ```ts {2-5}
  ~~~

- **Dependency Injection:** Read `./01-basic-components/01-dependency-injection.md`. Understand how Ditsmod builds the "hierarchy of injectors in the Ditsmod application", what "multi-providers" are, what the "`Context` service" is, and how to use "Parameter Decorators" before modifying dependency injection logic.
- **Modules:** Read `./01-basic-components/02-modules.md`. This is crucial when refactoring modules.
- **Extensions:** Read `./01-basic-components/03-extensions.md`. This is crucial when refactoring extensions.

## Repository Structure & Package Characteristics

The core of the framework resides in `packages/core`, and all other packages within `packages/*` depend on it. This dependency is specified via `peerDependencies` in each package's `package.json`. Example application code is located in `examples/*`. All packages in `packages/*` and `examples/*` utilize [TypeScript Project References][3].

The `packages/core` package contains only the bare-minimum foundational functionality (DI, modules, extensions, etc.), which is insufficient to run a full web application. This is enough to run only [StandaloneApplication][2], it does not include route-creating extensions, nor does it define concepts like controllers, guards, or interceptors. All these high-level web entities are provided by `packages/rest` and `packages/trpc`.

The `packages/rest` and `packages/trpc` packages are distinct because they export the [application class and initializer class][1] tailored for different architectural styles. Excluding `packages/core`, all modules in `packages/*` are intended for use with `packages/rest`, except for `packages/trpc`.


[1]: website/i18n/en/docusaurus-plugin-content-docs/current/01-basic-components/04-application.md
[2]: examples/00-standalone-application
[3]: https://www.typescriptlang.org/docs/handbook/project-references.html
