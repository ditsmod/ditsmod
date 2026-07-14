---
sidebar_position: 1
---

# @ditsmod/cli

This package provides a Command Line Interface (CLI) and development tools for Ditsmod applications.

## Installation {#installation}

```bash
npm i -D @ditsmod/cli
```

Or run it directly without installation using `npx`:

```bash
npx @ditsmod/cli <command>
```

_Note:_ Binary aliases `ditsmod` and `dm` are available when installed.

## Commands {#commands}

### `ditsmod new` {#ditsmod-new}

Creates a new Ditsmod application in the target directory using official starter templates.

```bash
ditsmod new my-app [options]
```

#### Options:

- `-t, --template <name>`: Starter template to use (`rest`, `rest-monorepo`, `trpc-monorepo`). Default: `"rest"`.
- `-m, --package-manager <name>`: Package manager to use (`npm`, `yarn`, `pnpm`). Default: `"npm"`.
- `--skip-install`: Skip automatic package installation.
- `--skip-git`: Skip initializing a clean Git repository.

#### Examples:

```bash
# Create a REST application using Yarn
dm new my-rest-api -m yarn

# Create a tRPC monorepo without installing packages
dm new my-trpc-app -t trpc-monorepo --skip-install
```

### `ditsmod start` {#ditsmod-start}

Runs the Ditsmod application in development mode with incremental TypeScript watch compilation and graceful process restarts.

```bash
ditsmod start [entryFile] [options]
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
dm start tmp.ts -d 9229

# Start with environment file and watch JSON files
dm start --env-file .env.local --watch-assets "src/**/*.json"
```

## Programmatic API {#programmatic-api}

`@ditsmod/cli` exports its core classes and command helpers for programmatic usage:

```ts
import { WatchCompiler, ProcessManager, AssetWatcher, startCommand, newCommand } from '@ditsmod/cli';
```
