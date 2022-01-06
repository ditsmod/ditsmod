---
sidebar_position: 0
---

# Ditsmod Extensions

## The purpose of Ditsmod extension

The main difference between an extension and a regular service is that the extension can do its job
before the web server starts, and it can dynamically add providers at the module level, route level
or request level.

For example, `@ditsmod/body-parser` module has an extension that dynamically adds an HTTP
interceptor for parsing the request body to each route that has the appropriate method (POST,
PATCH, PUT). It does this once before the start of the web server, so there is no need to test
the need for such parsing for each request.

Another example. For example, the `@ditsmod/openapi` module allows you to create OpenAPI documentation using the new
`@OasRoute` decorator. Without extensions, the metadata passed to this decorator would be
incomprehensible to `@ditsmod/core`.

## What is Ditsmod extension

Ditsmod has a special API to extend the functionality of `@ditsmod/core`. To use it, you need to
import the constant `edk` (short for "Extensions Development Kit"):

```ts
import { edk } from '@ditsmod/core';
```

This constant is used as a namespace to hold the types and data intended for extensions.

In Ditsmod, **extension** is a class that implements the `Extension` interface:

```ts
interface Extension<T> {
  init(): Promise<T>;
}
```

Each extension needs to be registered, this will be mentioned later, and now let's assume that such
registration has taken place, the application is running, and then goes the following process:

1. collecting metadata from all decorators (`@RootModule`, `@Module`, `@Controller`, `@Route`
   ...and even from unknown decorators, but provided that they are created using the
   `@ts-stack/di` library);
2. this metadata then passing to DI with token `MetadataPerMod1`, therefore - any
   extension can receive this metadata in the constructor;
3. per module work of extensions begins, that is, for each Ditsmod module the extensions registered
   in this module or imported in this module are selected, and the metadata collected in this module is
   also transmitted to them; then the `init()` method of each extension is called;
4. the web server starts, and the application starts working normally, processing HTTP requests.

It should be noted that the order of running extensions can be considered as "random", so each
extension must declare dependence on another extension (if any) in its constructors, as well as in
the methods `init()`. In this case, regardless of the startup order, all extensions will work correctly:

```ts
async init() {
  await this.otherExtention.init();
  // The current extension works after the initialization of another extension is completed.
}
```

This means that the `init()` method of a particular extension can be called as many times as it is
written in the body of other extensions that depend on the job of that extension. This specificity
must be taken into account:

```ts
async init() {
  if (this.inited) {
    return;
  }
  // Do something good.
  this.inited = true;
}
```
