---
sidebar_position: 40
---

# Testing

## What is unit testing

In fact, unit testing is a testing method that allows you to verify that the smallest parts of an application, such as functions and class methods (which are also essentially functions), work correctly. To perform testing, you alternately focus on a separate function while isolating all other parts of the program that interact with that function. Properly written unit tests allow you to read them as documentation for your program.

One of the most popular frameworks for writing unit tests for JavaScript code is [vitest][100]. In this section, we will use this framework.

## Prerequisites for writing unit tests

A good knowledge of the [Ditsmod DI][1] architecture will help you easily write unit tests for Ditsmod applications, as one of the main advantages of DI is the ease of testing. First, you need to learn how to work with [injectors][2] and the [injector hierarchy][3].

Let's say you want to test `Service2` in this example:

```ts
// service1.ts
import { injectable } from '@ditsmod/core';

class Service1 {
  saySomething() {
    return 'Hello';
  }
}

// service2.ts
@injectable()
class Service2 {
  constructor(private service1: Service1) {}

  method1() {
    return this.service1.saySomething();
  }
}
```

Since `Service2` depends on `Service1`, we need to isolate this service from interacting with `Service1`. Before we write the tests, let's recall how we can create an injector that can resolve class dependencies from our example:

```ts
import { Injector } from '@ditsmod/core';

import { Service1 } from './service1.js';
import { Service2 } from './service2.js';

const injector = Injector.resolveAndCreate([Service1, Service2]);
const service2 = injector.get(Service2);
```

So, as an input to the `Injector.resolveAndCreate()` method, we pass an array of all the necessary providers that will participate in testing, and as an output, we get an injector that can create values for any passed provider.

In this case, to create `Service2`, the injector will first create an instance of the `Service1` class. But in order to write tests specifically for `Service2`, we don't care if `Service1` is working properly, so instead of the real `Service1` class, we can simulate its operation using [mock functions][101]. This is how it will look like (without tests yet):

```ts {8}
import { Injector } from '@ditsmod/core';
import { vi } from 'vitest';

import { Service1 } from './service1.js';
import { Service2 } from './service2.js';

const injector = Injector.resolveAndCreate([
  { token: Service1, useValue: { saySomething: vi.fn() } },
  Service2
]);
const service2 = injector.get(Service2);
```

As you can see, in the highlighted line, instead of `Service1`, a value provider with a mock function is passed that will simulate the operation of `Service1`.

Now you can write a test using this technique of substituting providers:

```ts {8-9,16}
import { Injector } from '@ditsmod/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Service1 } from './service1.js';
import { Service2 } from './service2.js';

describe('Service2', () => {
  const saySomething = vi.fn();
  const MockService1 = { saySomething } as Service1;
  let service2: Service2;

  beforeEach(() => {
    vi.restoreAllMocks();

    const injector = Injector.resolveAndCreate([
      { token: Service1, useValue: MockService1 },
      Service2
    ]);

    service2 = injector.get(Service2);
  });

  it('should say "Hello, World!"', () => {
    saySomething.mockImplementation(() => 'Hello, World!');

    expect(service2).toBeInstanceOf(Service2);
    expect(service2.method1()).toBe('Hello, World!');
    expect(saySomething).toHaveBeenCalledTimes(1);
  });
});
```

We recommend that you place your unit test files close to the files they test. That is, if the file is called `some.service.ts`, then the test file should be called `some.service.spec.ts` or `some.service.test.ts`. This makes working with tests much easier, and also allows you to immediately see which files have not yet been tested.

## End-to-end testing

End-to-end testing checks the operation of the entire application. For this purpose, you can use, for example, [supertest][102]. Most often, for such tests, it is necessary to create mocks only for those services that work with external services: with sending email, with databases, etc. The rest of the application works as it would in production mode.

Let's look at the situation when we make a mock for `EmailService`:

```ts {14,21}
import request from 'supertest';
import { HttpServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppModule } from '#app/app.module.js';
import { EmailService } from '#app/email.service.js';
import { InterfaceOfEmailService } from '#app/types.js';

describe('End-to-end testing', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;
  const query = vi.fn();
  const MockEmailService = { query } as InterfaceOfEmailService;

  beforeEach(async () => {
    vi.restoreAllMocks();

    server = await TestApplication.createTestApp(AppModule)
      .overrideModuleMeta([
        { token: EmailService, useValue: MockEmailService }
      ])
      .getServer();

    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('work with EmailService', async () => {
    const values = [{ one: 1, two: 2 }];
    query.mockImplementation(() => values);

    const { status, type, body } = await testAgent.get('/get-some-from-email');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toBe(values);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
```

As you can see in the test code, first, a test application is created based on the `TestApplication` class, then a mock is substituted for `EmailService`. At the very end, the `getServer()` method is called and thus creates and returns a web server that has not yet called the `server.listen()` method, so supertest can automatically do this by substituting a random port number, which is an important point when asynchronously calling several tests at once. Here `AppModule` is the root module of the application.

Note that these tests do not use the code from the `./src/main.ts` file, so any arguments you pass to this code must be duplicated for `TestApplication`. For example, if your application has an `api` prefix, then pass the same prefix to the test application:

```ts
server = await TestApplication.createTestApp(AppModule, { path: 'api' }).getServer();
```

### `testApplication.overrideModuleMeta()`

The `testApplication.overrideModuleMeta()` method replaces providers in module metadata. Providers with mocks are only passed to DI at a particular level of the hierarchy if there are corresponding providers with the same tokens in application at that level.

### `testApplication.overrideExtensionMeta()`

The `testApplication.overrideExtensionMeta()` method overrides providers in metadata added by extension groups. This method takes two arguments:

1. token of the group of extensions from which metadata is returned, where it will be necessary to replace providers for tests;
2. a callback that will work with the metadata returned by the extension group (specified in the first argument).

The callback in the second argument has the following type:

```ts
interface GroupMetaOverrider<T = any> {
 (stage1GroupMeta: Stage1GroupMeta<T> | Stage1GroupMeta2<T>): void;
}
```

That is, this callback accepts a single argument - an object with the `groupData` property, where you can find metadata from the specified group of extensions.

[TestRoutingPlugin][4] is described below, which shows how to use `testApplication.overrideExtensionMeta()`.

### `testApplication.$use()`

This method is intended for creating plugins that can dynamically add methods and properties to the `TestApplication` instance:

```ts
import { TestApplication } from '@ditsmod/testing';

class Plugin1 extends TestApplication {
  method1() {
    // ...
    return this;
  }
}

class Plugin2 extends TestApplication {
  method2() {
    // ...
    return this;
  }
}

class AppModule {}

TestApplication.createTestApp(AppModule)
  .$use(Plugin1, Plugin2)
  .method1()
  .method2()
  .overrideModuleMeta([]);
```

As you can see, after using `$use()`, the `TestApplication` instance can use plugin methods. [An example of using such a plugin in real life][103] can be viewed in the `@ditsmod/routing` module.


### `TestRoutingPlugin`

The `TestRoutingPlugin` class uses `testApplication.overrideExtensionMeta()` to override providers in the metadata added by the `ROUTES_EXTENSIONS` group:

```ts
import { Provider } from '@ditsmod/core';
import { MetadataPerMod3, ROUTES_EXTENSIONS } from '@ditsmod/routing';
import { TestApplication, GroupMetaOverrider } from '@ditsmod/testing';

export class TestRoutingPlugin extends TestApplication {
  overrideGroupRoutingMeta(providersToOverride: Provider[]) {
    const overrideRoutesMeta: GroupMetaOverrider<MetadataPerMod3> = (stage1GroupMeta) => {
      stage1GroupMeta.groupData?.forEach((metadataPerMod3) => {
        // ...
      });
    };

    this.overrideExtensionMeta(ROUTES_EXTENSIONS, overrideRoutesMeta);
    return this;
  }
}
```

You can use this example to create plugins that will replace providers for other groups of extensions. You can find a complete example with `TestRoutingPlugin` [in the Ditsmod repository][104]. Basically, you will need this plugin in tests if you need to replace the providers that you have added in the controller metadata in your application:

```ts {14-15}
import { Provider } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';
import { TestRoutingPlugin } from '@ditsmod/routing-testing';

import { AppModule } from './app.module.js';
import { Service1, Service2 } from './services.js';

const providers: Provider[] = [
  { token: Service1, useValue: 'value1' },
  { token: Service2, useValue: 'value2' },
];

const server = await TestApplication.createTestApp(AppModule)
  .$use(TestRoutingPlugin)
  .overrideGroupRoutingMeta(providers)
  .getServer();
```







[1]: /components-of-ditsmod-app/dependency-injection
[2]: /components-of-ditsmod-app/dependency-injection#injector
[3]: /components-of-ditsmod-app/dependency-injection#hierarchy-and-encapsulation-of-injectors
[4]: #testroutingplugin

[100]: https://vitest.dev/
[101]: https://vitest.dev/api/mock.html
[102]: https://github.com/ladjs/supertest
[103]: https://github.com/ditsmod/ditsmod/blob/c42c834cb93cb2/packages/routing/e2e/main.spec.ts#L39
[104]: https://github.com/ditsmod/ditsmod/blob/main/packages/routing-testing/src/test-routing.plugin.ts
