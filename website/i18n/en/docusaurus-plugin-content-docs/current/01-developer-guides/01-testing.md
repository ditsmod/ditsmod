---
sidebar_position: 0
---

# Testing

## Unit testing

Currently, perhaps the most popular framework for writing unit tests for JavaScript code is [jest][100]. In this documentation we will use this framework.

If you know how [DI][1] works, you can easily write unit tests for Ditsmod application classes. First, you need to learn how to work with [injectors][2] and the [injector hierarchy][3].

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

As you can see, `Service2` depends on `Service1`. Before we write the tests, let's recall how we can create an injector that can resolve class dependencies from our example:

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

```ts {2,9}
describe('Service2', () => {
  const saySomething = jest.fn();
  let service2: Service2;

  beforeEach(() => {
    jest.restoreAllMocks();

    const injector = Injector.resolveAndCreate([
      { token: Service1, useValue: { saySomething } },
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

We recommend that you place your unit test files close to the files they test. That is, if the file is called `some.service.ts`, then the test file should be called `some.service.spec.ts` or `some.service.test.ts`. This makes working with tests much easier, and also allows you to immediately see which files have not yet been tested.

## End-to-end testing

During end-to-end testing, the entire application is tested. For this purpose, you can use, for example, [supertest][102]. Most often, for such testing, it is necessary to make mocks only for those services that work with external services: with databases, with sending email, etc.

Let's look at the situation when we make a mock for `DatabaseService`:

```ts {17-19}
import request = require('supertest');
import { Server } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';
import { DatabaseService } from '../src/app/database.service';
import { InterfaceOfDatabaseService } from '../src/app/types';

describe('End-to-end testing', () => {
  let server: Server;
  const query = jest.fn();
  const useValue = { query } as InterfaceOfDatabaseService;

  beforeEach(async () => {
    jest.restoreAllMocks();

    server = await new TestApplication(AppModule)
      .overrideProviders([{ token: DatabaseService, useValue }])
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
First of all, pay attention to the import of the `supertest` library in the first line. This is a rather specific import. Unless you are using ECMAScript modules, it is better to use it for this library.
:::

As you can see, in the highlighted lines, a test application is created using an instance of the `TestApplication` class, then a mock is substituted for the `DatabaseService`. At the very end, the `getServer()` method is called and thus creates and returns a web server that has not yet called the `server.listen()` method, so supertest can automatically do this by substituting a random port number, which is an important point when asynchronously calling several tests at once. Here `AppModule` is the root module of the application.

We recommend keeping such tests in a separate directory called `tests`, at the same level as the `src` root directory.






[1]: /components-of-ditsmod-app/dependency-injection
[2]: /components-of-ditsmod-app/dependency-injection#injector
[3]: /components-of-ditsmod-app/dependency-injection#hierarchy-of-injectors

[100]: https://jestjs.io/
[101]: https://jestjs.io/docs/mock-functions
