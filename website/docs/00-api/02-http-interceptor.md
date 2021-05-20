# HttpInterceptor

```ts
interface HttpInterceptor {
  intercept(next?: HttpHandler): Promise<any>;
}
```

## HttpFrontend

```ts
/**
 * A first `HttpHandler` which will dispatch the request to next interceptor in the chain.
 *
 * Interceptors sit between the `HttpFrontend` and the `HttpBackend`.
 */
abstract class HttpFrontend implements HttpInterceptor {
  abstract intercept(next?: HttpHandler): Promise<any>;
}
```


## HttpBackend

```ts
/**
 * A final `HttpHandler` which will dispatch the request to controller's route method.
 *
 * Interceptors sit between the `HttpFrontend` and the `HttpBackend`.
 *
 * When injected in an interceptor, `HttpBackend` can dispatches requests directly to
 * controller's route method, without going through the next interceptors in the chain.
 */
abstract class HttpBackend implements HttpHandler {
  abstract handle(): Promise<any>;
}
```

## HttpHandler

```ts
/**
 * `HttpHandler` is injectable. When injected, the handler instance dispatches requests to the
 * first interceptor in the chain, which dispatches to the second, etc, eventually reaching the
 * `HttpBackend`.
 *
 * In an `HttpInterceptor`, the `HttpHandler` parameter is the next interceptor in the chain.
 */
abstract class HttpHandler {
  abstract handle(): Promise<any>;
}
```
