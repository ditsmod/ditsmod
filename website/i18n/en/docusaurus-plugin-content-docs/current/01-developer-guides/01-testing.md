---
sidebar_position: 0
---

# Testing

## Unit testing

Currently, perhaps the most popular framework for writing unit tests for JavaScript code is [jest][100]. In this documentation we will use this framework.

If you know how [DI][1] works, you can easily write unit tests for Ditsmod application classes. DI allows you to greatly simplify the process of writing tests. First, you need to learn how to work with [injectors][2] and the [injector hierarchy][3].

Let's say we want to test `Service2` in this example:

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

## HTTP server testing

One of the most popular frameworks for HTTP server testing is [supertest][102].

To start a web server to test your application, pass `false` as the second argument to `Application#bootstrap()`:

```ts {8}
import request from 'supertest';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';

describe('Integration testing', () => {
  it('Hello world works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);

    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello World!');

    server.close();
  });
});
```

As you can see, a web server is created in the highlighted line, which has not yet called the `server.listen()` method. Therefore, supertest can automatically do this by substituting a random port number, which is crucial when asynchronously calling multiple tests at once. Here, `AppModule` is the root module of the application.








[1]: /components-of-ditsmod-app/dependency-injection
[2]: /components-of-ditsmod-app/dependency-injection#injector
[3]: /components-of-ditsmod-app/dependency-injection#hierarchy-of-injectors

[100]: https://jestjs.io/
[101]: https://jestjs.io/docs/mock-functions
