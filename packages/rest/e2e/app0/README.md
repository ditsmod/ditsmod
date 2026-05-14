Controllers operate in two modes - injector-scoped and context-scoped. The following is verified:

1. Handling of query and path parameters.
2. Support for routes with controller method names of type `Symbol`, as well as routes that work for both `GET` and `POST` methods simultaneously.
3. Support for `HEAD` methods.
4. Support for the ability to store interceptor execution either in the injector or in the context (depending on the controller mode).
