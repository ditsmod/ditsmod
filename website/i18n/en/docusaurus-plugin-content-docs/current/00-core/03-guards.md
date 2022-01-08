---
sidebar_position: 3
---

# Guards

## Guards

If you want to restrict access to certain routes, you can pass `AuthGuard` in the third parameter of the `Route` decorator in the array:

```ts
import { Controller, Res, Route } from '@ditsmod/core';

import { AuthGuard } from './auth.guard';

@Controller()
export class SomeController {
  constructor(private res: Res) {}

  @Route('GET', 'some-url', [AuthGuard])
  tellHello() {
    this.res.send('Hello admin!');
  }
}
```

You can view a ready-made example with guard in the [examples][1] folder or in the [RealWorld example][2].

Any guard must be a class that implements the `CanActivate` interface:

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

It is recommended that guard files end with `*.guard.ts` and that their class names end with `*Guard`.

If `canActivate()` returns:

- `true` or `Promise<true>`, so Ditsmod will handle the appropriate route with this guard;
- `false` or `Promise<false>`, so the response to the request will contain 401 status and there will be no processing of the route by the controller;
- `number` or `Promise<number>` Ditsmod interprets this as a status number (403, 401, etc.) to be returned in response to a request.

## Guards with parameters

In the `canActivate()` method, guard has one parameter. Arguments for this parameter can be passed in the decorator `Route` in an array where in the first place there is a certain guard.

Let's look at the following example:

```ts
import { Controller, Res, Route } from '@ditsmod/core';

import { PermissionsGuard } from './permissions.guard';
import { Permission } from './permission';

@Controller()
export class SomeController {
  constructor(private res: Res) {}

  @Route('GET', 'some-url', [[PermissionsGuard, Permission.canActivateAdministration]])
  tellHello() {
    this.res.send('Hello admin!');
  }
}
```

As you can see, the third parameter in `Route` is an array in the array, where `PermissionsGuard` is specified in the first place, and then there are the arguments for it. In this case, `PermissionsGuard` will get these arguments in its `canActivate()` method:

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

## Guard declaration

Because guards are a subset of providers, they are declared in an array of providers, but only at the request level. This can be done either in the controller or in the module:

```ts
import { Module } from '@ditsmod/core';

import { AuthGuard } from 'auth.guard';

@Module({
  providersPerReq: [AuthGuard],
})
export class SomeModule {}
```

## Setting guards for the imported module

You can also centrally connect the guards at the module level:

```ts
import { Module } from '@ditsmod/core';

import { OtherModule } from '../other/other.module';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [
    AuthModule,
    { module: OtherModule, guards: [AuthGuard] }
  ]
})
export class SomeModule {}
```

In this case, `AuthGuard` will be automatically added to each route in `OtherModule`.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/03-route-guards
[2]: https://github.com/ditsmod/realworld/blob/main/packages/server/src/app/modules/service/auth/bearer.guard.ts
