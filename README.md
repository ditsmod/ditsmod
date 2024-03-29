## About the project

Ditsmod is a Node.js web framework, named **DI** + **TS** + **Mod** to emphasize its important
components: it has **D**ependency **I**njection, written in **T**ype**S**cript, and designed for
good **Mod**ularity. Some of the architecture concepts of this framework are taken from
[Angular][1].

- [The English version of the documentation](https://ditsmod.github.io/en/).
- [Українська версія документації](https://ditsmod.github.io/).

## About the repo

This monorepository uses yarn workspaces (see `package.json`).

During you run the following command:

```bash
yarn install
```

yarn will create symlinks in `node_modules` for all packages listed in the `packages/*` and `examples/*` folders. Also, the applications in the `examples/*` folder are linked to the modules in the `packages/*` folder thanks to [compilerOptions.paths][2] as well as [Project References][3]. So, after any change in the source files in `packages/*`, these changes are automatically reflected in `examples/*`.

Development mode for any application in the `examples/*` directory can be started with two commands in two different terminals.

From first terminal:

```bash
cd examples/01*
yarn build -w
```

From second terminal:

```bash
cd examples/01*
yarn start
```

[1]: https://github.com/angular/angular
[2]: https://www.typescriptlang.org/tsconfig#paths
[3]: https://www.typescriptlang.org/docs/handbook/project-references.html
