---
sidebar_position: 0
---

# Ditsmod Extensions

## The purpose of the Ditsmod extension

The main difference between an extension and a regular service is that the extension can do its job
before the web server starts, and it can dynamically add providers at the module level, route level
or request level.

For example, the `@ditsmod/openapi` module allows you to create OpenAPI documentation using the new
`@OasRoute` decorator. Without extensions, the metadata passed to this decorator would be
incomprehensible to `@ditsmod/core`.

## What is a Ditsmod extension

Ditsmod has a special API to extend the functionality of `@ditsmod/core`. To use it, you need to
import the constant `edk` (short for "Extensions Development Kit"):

```ts
import { edk } from '@ditsmod/core';
```

This constant is used as a namespace to hold the types and data intended for extensions.

In Ditsmod **extension** is a class that implements the `Extension` interface:

```ts
interface Extension<T> {
  init(): Promise<T>;
}
```

Each extension needs to be registered, this will be mentioned later, and now let's assume that such
registration has taken place, the application is running, and then goes the following process:

1. metadata is collected from all decorators (`@RootModule`,` @Module`, `@Controller`,
`@Route`...);
2. the collected metadata is passed to DI with the token `APP_METADATA_MAP`, therefore - any
service, controller or extension can receive this metadata in the constructor;
3. one after another all registered extensions are started, more precisely - their methods `init()`
without arguments are called;
4. The web server starts, and the application starts working normally, processing HTTP requests.

It should be noted that the order of running extensions can be considered "random", so each
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
