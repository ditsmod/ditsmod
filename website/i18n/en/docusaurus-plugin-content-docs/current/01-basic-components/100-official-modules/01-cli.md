---
sidebar_position: 1
---

# @holu/cli

This package provides a Command Line Interface (CLI) and development tools for Holu applications.

## Installation {#installation}

```bash
npm i -g @holu/cli
```

Or run it directly without installation using `npx`:

```bash
npx @holu/cli <command>
```

_Note:_ Binary aliases `holu` and `dm` are available when installed.

## Commands {#commands}

### `holu new` {#holu-new}

Creates a new Holu application in the target directory using official starter templates.

```bash
holu new my-app [options]
```

#### Options:

- `-t, --template <name>`: Starter template to use (`rest`, `rest-monorepo`, `trpc-monorepo`). Default: `"rest"`.
- `-m, --package-manager <name>`: Package manager to use (`npm`, `yarn`, `pnpm`). Default: `"npm"`.
- `--skip-install`: Skip automatic package installation.
- `--skip-git`: Skip initializing a clean Git repository.

#### Examples:

```bash
# Create a REST application using Yarn
holu new my-rest-api -m yarn

# Create a tRPC monorepo without installing packages
holu new my-trpc-app -t trpc-monorepo --skip-install
```

### `holu start` {#holu-start}

Runs the Holu application in development mode with incremental TypeScript watch compilation and graceful process restarts.

```bash
holu start [entryFile] [options]
```

#### Options:

- `-p, --project <path>`: Path to TypeScript config file or project directory. Default: `"tsconfig.build.json"`.
- `-e, --exec <binary>`: Binary to execute the entry file. Default: `"node"`.
- `-d, --debug [hostport]`: Run Node.js in debug mode with the `--inspect` flag.
- `--env-file <paths...>`: Environment file(s) to load into `process.env`.
- `--entry-file <file>`: Relative path to the compiled JavaScript entry file. Default: `"dist/main.js"`.
- `--watch-assets <globs...>`: Non-TypeScript asset globs to watch and copy to `dist/`.
- `--preserve-watch-output`: Do not clear the terminal screen between compilation cycles.

#### Examples:

```bash
# Start application with custom entry file and debug mode enabled
holu start tmp.ts -d 9229

# Start with environment file and watch JSON files
holu start --env-file .env.local --watch-assets "src/**/*.json"
```

## Programmatic API {#programmatic-api}

`@holu/cli` exports its core classes and command helpers for programmatic usage:

```ts
import { WatchCompiler, ProcessManager, AssetWatcher, startCommand, newCommand } from '@holu/cli';
```
