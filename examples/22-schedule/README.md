## Prerequisites

If you haven't prepared the examples repository yet, you can do so from the project root:

```bash
npm install
```

## Schedule Example

Start from the first terminal:

```bash
cd examples/22-schedule
npm run start
```

From the second terminal, you can interact with the scheduler:

```bash
# Get the lists of active intervals, timeouts, and cron jobs
curl -i localhost:3000/tasks

# Dynamically stop and delete the interval job named 'interval-job'
curl -X POST -i localhost:3000/tasks/stop-interval/interval-job

# Dynamically stop and delete the cron job named 'cron-job'
curl -X POST -i localhost:3000/tasks/stop-cron/cron-job
```

## TypeScript configs

This example has four tsconfig files:

- `tsconfig.json` - the basic configuration used by your IDE (in most cases it is probably VS Code).
- `tsconfig.build.json` - this configuration is used to compile the code from the `src` directory to the `dist` directory, it is intended for application code.
- `tsconfig.e2e.json` - this configuration is used to compile end-to-end tests.
- `tsconfig.unit.json` - this configuration is used to compile unit tests.
