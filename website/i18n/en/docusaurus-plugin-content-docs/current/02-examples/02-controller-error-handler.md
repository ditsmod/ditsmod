# 02-controller-error-handler

To try this example, you should first [prepare the prerequisite][1].

In Ditsmod core declares the `ControllerErrorHandler` class at the HTTP request level and uses DI
to get an instance of this class to handle errors that occur during the operation of controllers.
Initially, this class is replaced by the `DefaultControllerErrorHandler` class, which makes minimal
error handling:

```ts
@Injectable()
export class DefaultControllerErrorHandler implements ControllerErrorHandler {
  constructor(private res: Res, private log: Log) {}

  handleError(err: Error) {
    const { message } = err;
    this.log.controllerHasError('error', [err]);
    if (!this.res.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
```

The example `02-controller-error-handler` shows a variant of substituting this class using the
`MyControllerErrorHandler` class. Note that `ControllerErrorHandler` is first declared in the root
module in the `providersPerReq` array, and then exported with its replacement by
`MyControllerErrorHandler`.

When you export a specific provider from the root module, you increase its scope for DI for the
entire application.

Launch the application from the first terminal:

```bash
yarn start2
```

From the second terminal check the work:

```bash
curl -isS localhost:3000
curl -isS localhost:3000/throw-error
```

[1]: ./prerequisite
