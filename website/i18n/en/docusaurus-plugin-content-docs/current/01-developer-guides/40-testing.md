---
sidebar_position: 40
---

# Testing

## What is unit testing

In fact, unit testing is a testing method that allows you to verify that the smallest parts of an application, such as functions and class methods (which are also essentially functions), work correctly. To perform testing, you alternately focus on a separate function while isolating all other parts of the program that interact with that function.

Properly written unit tests allow you to read them as documentation for your program. It can be said that in most projects only the public part of the application API is documented, and the rest is TypeScript types, documentation based on unit tests and comments in the code.

One of the most popular frameworks for writing unit tests for JavaScript code is [jest][100]. In this section, we will use this framework.

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

```ts {6}
import { Injector } from '@ditsmod/core';
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

```ts {6-7,14}
import { Injector } from '@ditsmod/core';
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

## End-to-end testing

End-to-end testing checks the operation of the entire application. For this purpose, you can use, for example, [supertest][102]. Most often, for such tests, it is necessary to create mocks only for those services that work with external services: with sending email, with databases, etc. The rest of the application works as it would in production mode.

Let's look at the situation when we make a mock for `EmailService`:

```ts {12,19}
import request from 'supertest';
import { HttpServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';
import { EmailService } from '#app/email.service.js';
import { InterfaceOfEmailService } from '#app/types.js';

describe('End-to-end testing', () => {
  let server: HttpServer;
  const query = jest.fn();
  const MockEmailService = { query } as InterfaceOfEmailService;

  beforeEach(async () => {
    jest.restoreAllMocks();

    server = await new TestApplication(AppModule)
      .overrideProviders([
        { token: EmailService, useValue: MockEmailService }
      ])
      .getServer();
  });

  it('work with EmailService', async () => {
    const values = [{ one: 1, two: 2 }];
    query.mockImplementation(() => values);

    await request(server)
      .get('/get-some-from-email')
      .expect(200)
      .expect(values);

    expect(query).toHaveBeenCalledTimes(1);

    server.close();
  });
});
```

As you can see in the test code, first, a test application is created based on the `TestApplication` class, then a mock is substituted for `EmailService`. At the very end, the `getServer()` method is called and thus creates and returns a web server that has not yet called the `server.listen()` method, so supertest can automatically do this by substituting a random port number, which is an important point when asynchronously calling several tests at once. Here `AppModule` is the root module of the application.

Note that these tests do not use the code from the `./src/main.ts` file, so any arguments you pass to this code must be duplicated for `TestApplication`. For example, if your application has an `api` prefix, then pass the same prefix to the test application:

```ts
server = await new TestApplication(AppModule, { path: 'api' }).getServer();
```

Overriding mocks with the `testApplication.overrideProviders()` method works globally at any level of the injector hierarchy. Providers with mocks are only passed to DI at a particular level of the hierarchy if there are corresponding providers with the same tokens in application at that level.

We recommend keeping such tests in a separate directory called `test`, at the same level as the `src` root directory.

### Nested providers for testing

Recall that in `testApplication.overrideProviders()` it makes sense to only pass the mocks of those providers that you have already passed to DI in application. It turns out that mocks cannot have dependencies on new providers that do not exist in application. That is, if application has providers `Service1` and `Service2`, then the mock that replaces one of those providers cannot have a dependency on, say, `SpyService`. Therefore, for end-to-end testing, the concept of "nested providers" is introduced, which resolve the dependency for new providers introduced in mocks:

```ts {6}
const server = await new TestApplication(AppModule)
  .overrideProviders([
    {
      token: Service1,
      useClass: MockService1,
      providers: [SpyService],
    },
  ])
  .getServer();
```

As you can see, here we are passing a provider, in the middle of which there is a `providers` property, which can be at the same level as a `useClass` or `useFactory` property. In this case, it is assumed that `MockService1` has a dependency on `SpyService`.

Of course, it is better to use `useValue` for mocks if there is a chance:

```ts {8}
const method1 = jest.fn();
const mockService1 = { method1 } as Service1;

const server = await new TestApplication(AppModule)
  .overrideProviders([
    {
      token: Service1,
      useValue: mockService1,
    },
  ])
  .getServer();
```

In this case, you don't need nested providers. But not always a certain service can have such a simple mock. For example, if in this case `Service1` has a dependency on the request object generated by the Node.js web server, and you don't want to replace this object with the corresponding mock, for `Service1` the mock could look like this:

```ts {8,14}
import { inject, injectable, REQ, HttpRequest } from '@ditsmod/core';
import { SpyService } from './spy.service.js';

@injectable()
export class MockService1 extends Service1 {
  constructor(
    @inject(REQ) private httpReq: HttpRequest,
    private spyService: SpyService,
  ) {
    super(httpReq);
  }

  method1() {
    this.spyService.setInsights(this.httpReq.headers);
  }
}
```

Here, `SpyService` is a new provider created for testing purposes only, so that it can be used to programmatically retrieve contextual information from a working application. In this case, `MockService1` should be passed to `useClass`, and `SpyService` should be passed in nested providers:

```ts {1-2,9}
const setInsights = jest.fn();
const spyService = { setInsights } as SpyService;

const server = await new TestApplication(AppModule)
  .overrideProviders([
    {
      token: Service1,
      useClass: MockService1,
      providers: [{ token: SpyService, useValue: spyService }],
    },
  ])
  .getServer();
```






[1]: /components-of-ditsmod-app/dependency-injection
[2]: /components-of-ditsmod-app/dependency-injection#injector
[3]: /components-of-ditsmod-app/dependency-injection#hierarchy-of-injectors

[100]: https://jestjs.io/
[101]: https://jestjs.io/docs/mock-functions
[102]: https://github.com/ladjs/supertest
