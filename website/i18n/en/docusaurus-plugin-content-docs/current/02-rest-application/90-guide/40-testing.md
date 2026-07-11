---
sidebar_position: 40
---

# Testing

## What is unit testing {#what-is-unit-testing}

In fact, unit testing is a testing method that allows you to verify that the smallest parts of an application, such as functions and class methods (which are also essentially functions), work correctly. To perform testing, you alternately focus on a separate function while isolating all other parts of the program that interact with that function. Properly written unit tests allow you to read them as documentation for your program.

One of the most popular frameworks for writing unit tests for JavaScript code is [jest][100]. In this section, we will use this framework.

## Unit testing {#unit-testing}

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
import { jest } from '@jest/globals';

import { Service1 } from './service1.js';
import { Service2 } from './service2.js';

const injector = Injector.resolveAndCreate([
  { token: Service1, useValue: { saySomething: jest.fn() } },
  Service2
]);
const service2 = injector.get(Service2);
```

As you can see, in the highlighted line, instead of `Service1`, a value provider with a mock function is passed that will simulate the operation of `Service1`.

Now you can write a test using this technique of substituting providers:

```ts {8-9,16}
import { Injector } from '@ditsmod/core';
import { jest } from '@jest/globals';

import { Service1 } from './service1.js';
import { Service2 } from './service2.js';

describe('Service2', () => {
  const saySomething = jest.fn();
  const MockService1 = { saySomething } as Service1;
  let service2: Service2;

  beforeEach(() => {
    jest.restoreAllMocks();

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

## End-to-end testing {#end-to-end-testing}

End-to-end testing checks the operation of the entire application. For this purpose, you can use, for example, [supertest][102]. Most often, for such tests, it is necessary to create mocks only for those services that work with external services: with sending email, with databases, etc. The rest of the application works as it would in production mode.

Let's look at the situation when we make a mock for `EmailService`:

```ts {14,21}
import request from 'supertest';
import { HttpServer } from '@ditsmod/core';
import { TestRestApplication } from '@ditsmod/rest-testing';
import { jest } from '@jest/globals';

import { AppModule } from '#app/app.module.js';
import { EmailService } from '#app/email.service.js';
import { InterfaceOfEmailService } from '#app/types.js';

describe('End-to-end testing', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;
  const query = jest.fn();
  const MockEmailService = { query } as InterfaceOfEmailService;

  beforeEach(async () => {
    jest.restoreAllMocks();

    server = await TestRestApplication.createTestApp(AppModule)
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

As you can see in the test code, first, a test application is created based on the `TestRestApplication` class, then a mock is substituted for `EmailService`. At the very end, the `getServer()` method is called and thus creates and returns a web server that has not yet called the `server.listen()` method, so supertest can automatically do this by substituting a random port number, which is an important point when asynchronously calling several tests at once. Here `AppModule` is the root module of the application.

Note that these tests do not use the code from the `./src/main.ts` file, so any arguments you pass to this code must be duplicated for `TestRestApplication`. For example, if your application has an `api` prefix, then pass the same prefix to the test application:

```ts
server = await TestRestApplication.createTestApp(AppModule, { path: 'api' }).getServer();
```

### `testRestApplication.overrideModuleMeta()` {#testrestapplicationoverridemodulemeta}

The `testRestApplication.overrideModuleMeta()` method replaces providers in module metadata. ProviderBuilder with mocks are only passed to DI at a particular level of the hierarchy if there are corresponding providers with the same tokens in application at that level.

### `testRestApplication.overrideExtensionMeta()` {#testrestapplicationoverrideextensionmeta}

The `testRestApplication.overrideExtensionMeta()` method overrides providers in the metadata added by an extension. This method takes two arguments:

1. the extension class that returns the metadata where providers need to be overridden for tests;
2. a callback that will work with the metadata returned by the extension (specified in the first argument).

The callback in the second argument has the following type:

```ts
interface ExtensionMetaOverrider<T = any> {
 (extensionGroupMeta: ExtensionGroupMeta<T> | PartialExtensionGroupMeta<T>): void;
}
```

That is, this callback accepts a single argument - an object with the `groupData` property, where you can find metadata from the specified group of extensions.

[TestRestPlugin][4] is described below, which shows how to use `testRestApplication.overrideExtensionMeta()`.

### `testRestApplication.$use()` {#testrestapplicationuse}

This method is intended for creating plugins that can dynamically add methods and properties to the `TestRestApplication` instance:

```ts
import { TestRestApplication } from '@ditsmod/rest-testing';

class Plugin1 extends TestRestApplication {
  method1() {
    // ...
    return this;
  }
}

class Plugin2 extends TestRestApplication {
  method2() {
    // ...
    return this;
  }
}

class AppModule {}

TestRestApplication.createTestApp(AppModule)
  .$use(Plugin1, Plugin2)
  .method1()
  .method2()
  .overrideModuleMeta([]);
```

As you can see, after using `$use()`, the `TestRestApplication` instance can use plugin methods. [An example of using such a plugin in real life][103] can be viewed in the `@ditsmod/rest` module.


### `TestRestPlugin` {#testrestplugin}

The `TestRestPlugin` class uses `testRestApplication.overrideExtensionMeta()` to override providers in the metadata added by the `RestRouteExtension` group:

```ts
import { Provider } from '@ditsmod/core';
import { RouteExtensionMeta, RestRouteExtension } from '@ditsmod/rest';
import { TestRestApplication, ExtensionMetaOverrider } from '@ditsmod/rest-testing';

export class TestRestPlugin extends TestRestApplication {
  overrideExtensionRestMeta(providersToOverride: Provider[]) {
    const overrideRoutesMeta: ExtensionMetaOverrider<RouteExtensionMeta> = (extensionGroupMeta) => {
      extensionGroupMeta.groupData?.forEach((routeExtensionMeta) => {
        // ...
      });
    };

    this.overrideExtensionMeta(RestRouteExtension, overrideRoutesMeta);
    return this;
  }
}
```

You can use this example to create plugins that will replace providers for other groups of extensions. You can find a complete example with `TestRestPlugin` [in the Ditsmod repository][104]. Basically, you will need this plugin in tests if you need to replace the providers that you have added in the controller metadata in your application:

```ts {14-15}
import { Provider } from '@ditsmod/core';
import { TestRestApplication } from '@ditsmod/rest-testing';
import { TestRestPlugin } from '@ditsmod/rest-testing';

import { AppModule } from './app.module.js';
import { Service1, Service2 } from './services.js';

const providers: Provider[] = [
  { token: Service1, useValue: 'value1' },
  { token: Service2, useValue: 'value2' },
];

const server = await TestRestApplication.createTestApp(AppModule)
  .$use(TestRestPlugin)
  .overrideExtensionRestMeta(providers)
  .getServer();
```







[1]: /basic-components/dependency-injection
[2]: /basic-components/dependency-injection#injector-and-providers
[3]: /basic-components/dependency-injection#hierarchy-and-encapsulation-of-injectors
[4]: #testrestplugin

[100]: https://jestjs.io/
[101]: https://jestjs.io/docs/mock-functions
[102]: https://github.com/ladjs/supertest
[103]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.8/packages/rest/e2e/app1/app1-with-overriden-providers.spec.ts#L37
[104]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.8/packages/rest-testing/src/test-rest.plugin.ts
