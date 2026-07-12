## Prerequisites

If you haven't prepared the examples repository yet, you can do so from the project root:

```bash
npm install
```

## Running the Example

Start the application from the example directory:

```bash
cd examples/21-sentry
yarn start
```

## Testing the Endpoints

Once the application is running, you can test the following endpoints to see Sentry integration in action:

- **Sentry-Traced Endpoint**:

  ```bash
  curl http://localhost:3000/hello
  ```

  Returns `Hello from Sentry-traced endpoint!`. This endpoint is decorated with `@sentryTraced('hello-operation')` and automatically creates a custom Sentry transaction/span.

- **Unexpected Server Error**:

  ```bash
  curl http://localhost:3000/error
  ```

  Returns a 500 error. The `SentryHttpErrorHandler` automatically catches this unhandled server exception and reports it to Sentry.

- **Expected Client Error**:

  ```bash
  curl http://localhost:3000/expected-error
  ```

  Returns a 400 error. Because it throws a Ditsmod `CustomError` with status `400` and level `'warn'`, Sentry ignores this expected client error (unless `capture4xx` is explicitly set to `true` in `SentryOptions`).

- **Sentry Cron Monitor**:

  ```bash
  curl http://localhost:3000/cron
  ```

  Returns `Cron job check-in sent to Sentry!`. This triggers a background function decorated with `@sentryCron` which registers check-in heartbeats inside Sentry.

- **Sentry Exception Captured Decorator**:
  ```bash
  curl http://localhost:3000/capture-exception
  ```
  Returns `Exception captured manually!`. This triggers a method decorated with `@sentryExceptionCaptured()` which wraps the execution in try-catch and reports any thrown exceptions before propagating.

## More Information

For more details on `@ditsmod/sentry` configuration and options, see:

- [Sentry Module Documentation](https://ditsmod.github.io/en/native-modules/sentry/) (or the local [08-sentry.md](file:///srv/git/ditsmod/ditsmod/website/docs/02-rest-application/100-native-modules/08-sentry.md))
