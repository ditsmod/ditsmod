# @ditsmod/cli

Command Line Interface (CLI) and development tools for the [Ditsmod](https://github.com/ditsmod/ditsmod) framework.

Provides commands to generate new applications from official starter templates and run applications in development mode with incremental TypeScript watch compilation, graceful process restarts, and asset synchronization.

## Installation

You can install `@ditsmod/cli` locally in your project:

```bash
npm i -D @ditsmod/cli
```

Or globally:

```bash
npm i -g @ditsmod/cli
```

_Note:_ Binary aliases `ditsmod` and `dm` are available when installed.

---

## Commands

### `ditsmod new <directory>` / `dm new <directory>`

Creates a new Ditsmod application in the specified directory using official starter templates.

```bash
ditsmod new my-app
```

#### Options:

- `-t, --template <name>`: Starter template to use (`rest`, `rest-monorepo`, `trpc-monorepo`). Default: `"rest"`.
- `-m, --package-manager <name>`: Package manager to use (`npm`, `yarn`, `pnpm`). Default: `"npm"`.
- `--skip-install`: Skip automatic package installation. Default: `false`.
- `--skip-git`: Skip initializing a clean Git repository. Default: `false`.

#### Examples:

```bash
# Create a REST application using Yarn
dm new my-rest-api -m yarn

# Create a tRPC monorepo without installing packages
dm new my-trpc-app -t trpc-monorepo --skip-install
```

---

### `ditsmod start [entryFile]` / `dm start [entryFile]`

Runs the Ditsmod application in development mode. Monitors TypeScript source files, incrementally compiles changes, and gracefully restarts the Node.js application process.

```bash
ditsmod start
```

#### Options:

- `-p, --project <path>`: Path to TypeScript config file or project directory. Default: `"tsconfig.build.json"`.
- `-e, --exec <binary>`: Binary to execute the entry file. Default: `"node"`.
- `-d, --debug [hostport]`: Run Node.js in debug mode with the `--inspect` flag.
- `--env-file <paths...>`: Environment file(s) to load into `process.env` (Node.js >= v20).
- `--entry-file <file>`: Relative path to the compiled JavaScript entry file. Default: `"dist/main.js"`.
- `--watch-assets <globs...>`: Non-TypeScript asset globs to watch and copy to `dist/` (e.g. `"src/**/*.json"`).
- `--preserve-watch-output`: Do not clear the terminal screen between compilation cycles. Default: `false`.

#### Examples:

```bash
# Start application with custom entry file and inspect debugger enabled
dm start tmp.ts -d 9229

# Start with environment file and asset watcher for JSON files
dm start --env-file .env.local --watch-assets "src/**/*.json"

# Forward extra arguments directly to the child process after `--`
dm start -- --port=8080 --host=0.0.0.0
```

---

## Programmatic API

`@ditsmod/cli` exports its core building blocks for programmatic usage:

```ts
import { WatchCompiler, ProcessManager, AssetWatcher, startCommand, newCommand } from '@ditsmod/cli';
```

## License

MIT
