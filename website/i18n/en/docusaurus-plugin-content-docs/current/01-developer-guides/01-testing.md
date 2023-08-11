---
sidebar_position: 0
---

# Testing

## What is unit testing

In fact, unit testing is a testing method that allows you to verify that the smallest parts of an application, such as functions and class methods (which are also essentially functions), work correctly. To perform testing, you alternately focus on a separate function while isolating all other parts of the program that interact with that function.

Properly written unit tests allow you to read them as documentation for your program. It can be said that most projects document only the public part of the application's API, and the rest is documentation based on unit tests and comments in the code.

One of the most popular frameworks for writing unit tests for JavaScript code is [jest][100]. In this section, we will use this framework.

## Prerequisites for writing unit tests

A good knowledge of the [Ditsmod DI][1] architecture will help you easily write unit tests for Ditsmod applications, since one of the main advantages of DI is its ease of testing. First, you need to learn how to work with [injectors][2] and the [injector hierarchy][3].

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
import { Service1 } from './service1';
import { Service2 } from './service2';

const injector = Injector.resolveAndCreate([Service1, Service2]);
const service2 = injector.get(Service2);
```

So, as an input to the `Injector.resolveAndCreate()` method, we pass an array of all the necessary providers that will participate in testing, and as an output, we get an injector that can create values for any passed provider.

In this case, to create `Service2`, the injector will first create an instance of the `Service1` class. But in order to write tests specifically for `Service2`, we don't care if `Service1` is working properly, so instead of the real `Service1` class, we can simulate its operation using [mock functions][101]. This is how it will look like (without tests yet):

```ts {6}
import { Injector } from '@ditsmod/core';
import { Service1 } from './service1';
import { Service2 } from './service2';

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
import { Service1 } from './service1';
import { Service2 } from './service2';

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
    expect(saySomething).toBeCalledTimes(1);
  });
});
```

To make `jest` work in a similar way, don't forget to install the TypeScript types for it along with this framework:

```bash
yarn add -D jest @types/jest
```

We recommend that you place your unit test files close to the files they test. That is, if the file is called `some.service.ts`, then the test file should be called `some.service.spec.ts` or `some.service.test.ts`. This makes working with tests much easier, and also allows you to immediately see which files have not yet been tested.

## End-to-end testing

End-to-end testing checks the operation of the entire application. For this purpose, you can use, for example, [supertest][102]. Most often, for such tests, it is necessary to create mocks only for those services that work with external services: with databases, with sending email, etc.

Let's look at the situation when we make a mock for `DatabaseService`:

```ts {12,19}
import request = require('supertest');
import { Server } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';
import { DatabaseService } from '../src/app/database.service';
import { InterfaceOfDatabaseService } from '../src/app/types';

describe('End-to-end testing', () => {
  let server: Server;
  const query = jest.fn();
  const MockDatabaseService = { query } as InterfaceOfDatabaseService;

  beforeEach(async () => {
    jest.restoreAllMocks();

    server = await new TestApplication(AppModule)
      .overrideProviders([
        { token: DatabaseService, useValue: MockDatabaseService }
      ])
      .getServer();
  });

  it('work with DatabaseService', async () => {
    const values = [{ one: 1, two: 2 }];
    query.mockImplementation(() => values);

    await request(server)
      .get('/get-some-from-database')
      .expect(200)
      .expect(values);

    expect(query).toBeCalledTimes(1);

    server.close();
  });
});
```

:::info Default import supertest
First of all, notice the `supertest` library import in the first line. This feature occurs because `supertest` defaults to exporting a function rather than an object, which is against ES2015+ export standards. You can also import this library as follows: `import request from 'supertest'`, while also setting [`"esModuleInterop": true`][103] in the `tsconfig` file.
:::

As you can see in the test code, the test application is first created using an instance of the `TestApplication` class, then a mock substitution is made for `DatabaseService`. At the very end, the `getServer()` method is called and thus creates and returns a web server that has not yet called the `server.listen()` method, so supertest can automatically do this by substituting a random port number, which is an important point when asynchronously calling several tests at once. Here `AppModule` is the root module of the application.

Overriding mocks with the `testApplication.overrideProviders()` method works globally at any level of the injector hierarchy. Providers with mocks passed to this method are first added at the application level. Then, if there are providers with the same token at other levels (module, routing, or request), they will be added at those levels as well.

We recommend keeping such tests in a separate directory called `tests`, at the same level as the `src` root directory.






[1]: /components-of-ditsmod-app/dependency-injection
[2]: /components-of-ditsmod-app/dependency-injection#injector
[3]: /components-of-ditsmod-app/dependency-injection#hierarchy-of-injectors

[100]: https://jestjs.io/
[101]: https://jestjs.io/docs/mock-functions
