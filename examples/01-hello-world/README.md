## Prerequisites

If you haven't prepared the examples repository yet, you can do so from the project root:

```bash
npm install
```

## Hello world

Start from first terminal:

```bash
cd examples/01*
npm run start:dev
```

From second terminal:

```bash
curl -i localhost:3000/injector-scoped
curl -i localhost:3000/context-scoped
```

## TypeScript configs

This example has four tsconfig files:

- `tsconfig.json` - the basic configuration used by your IDE (in most cases it is probably VS Code).
- `tsconfig.build.json` - this configuration is used to compile the code from the `src` directory to the `dist` directory, it is intended for application code.
- `tsconfig.e2e.json` - this configuration is used to compile end-to-end tests.
- `tsconfig.unit.json` - this configuration is used to compile unit tests.

## Testing

As you can see, even the minimal application code for "Hello, World!" requires splitting into two files for testing purposes:

- The file `src/01.ts` contains the code for starting the web server, so it must be separated from the code to be tested.  
- The file `src/app/app.module.ts` contains the application code that needs to be tested.

The test files themselves are located at `src/app/example.controller.spec.ts` and `e2e/01.spec.ts`.
