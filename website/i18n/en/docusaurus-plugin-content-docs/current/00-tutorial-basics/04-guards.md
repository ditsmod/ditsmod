---
sidebar_position: 4
---

# Guards

## Guards without parameters

If you want certain routes to be accessed, for example, only by authorized users, you can specify
`AuthGuard` in the third parameter of the `Route` decorator in the array:

```ts
import { Controller, Response, Route } from '@ditsmod/core';

import { AuthGuard } from './auth.guard';

@Controller()
export class SomeController {
  constructor(private res: Response) {}

  @Route('GET', 'some-url', [AuthGuard])
  tellHello() {
    this.res.send('Hello admin!');
  }
}
```

Any guard must implement the `CanActivate` interface:

```ts
interface CanActivate {
  canActivate(params?: any[]): boolean | number | Promise<boolean | number>;
}
```

For example, this can be done as follows:

```ts
import { Injectable } from '@ts-stack/di';
import { CanActivate } from '@ditsmod/core';

import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate() {
    return Boolean(await this.authService.updateAndGetSession());
  }
}
```

If `canActivate()` returns:

- `true` or `Promise<true>`, so Ditsmod will handle the appropriate route with this guard;
- `false` or `Promise<false>`, so the response to the request will contain 401 status and there
will be no processing of the route by the controller;
- `number` or `Promise<number>` Ditsmod interprets this as a status number (403, 401, etc.) to be
returned in response to a request.

## Guards with parameters

In the `canActivate()` method, guard has one parameter. Arguments for this parameter can be
passed in the decorator `Route` in an array where in the first place there is a certain guard.

Let's look at the following example:

```ts
import { Controller, Response, Route } from '@ditsmod/core';

import { PermissionsGuard } from './permissions.guard';
import { Permission } from './permission';

@Controller()
export class SomeController {
  constructor(private res: Response) {}

  @Route('GET', 'some-url', [[PermissionsGuard, Permission.canActivateAdministration]])
  tellHello() {
    this.res.send('Hello admin!');
  }
}
```

As you can see, the third parameter in `Route` is an array in the array, where `PermissionsGuard`
is specified in the first place, and then there are the arguments for it. In this case,
`PermissionsGuard` will get these arguments in its `canActivate()` method:

```ts
import { Injectable } from '@ts-stack/di';
import { CanActivate, Status } from '@ditsmod/core';

import { AuthService } from './auth.service';
import { Permission } from './permission';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(params?: Permission[]) {
    if (await this.authService.hasPermissions(params)) {
      return true;
    } else {
      return Status.FORBIDDEN;
    }
  }
}
```
