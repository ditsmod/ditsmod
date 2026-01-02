---
sidebar_position: 3
---

# Guards

If you want to restrict access to certain routes, you can use guards. You can view a finished example of an application with guards in the [examples][1] folder or in [RealWorld example][2].

Any guard is a [DI provider][3] passed to injectors at the request level [in injector-scope mode][4], or at other levels if the controller is in context-scoped mode. Each guard must be a class that implements the `CanActivate` interface:

```ts
interface CanActivate {
  canActivate(ctx: RequestContext, params?: any[]): boolean | Response | Promise<boolean | Response>;
}
```

For example, it can be done like this:

```ts {8-10}
import { guard, RequestContext, CanActivate } from '@ditsmod/rest';
import { AuthService } from './auth.service.js';

@guard()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(ctx: RequestContext, params?: any[]) {
    return Boolean(await this.authService.updateAndGetSession());
  }
}
```

Or like this:

```ts {11-17}
import { Status } from '@ditsmod/core';
import { RequestContext, CanActivate, guard } from '@ditsmod/rest';

import { AuthService } from './auth.service.js';
import { Permission } from './types.js';

@guard()
export class PermissionsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(ctx: RequestContext, params?: Permission[]) {
    if (await this.authService.hasPermissions(params)) {
      return true;
    } else {
      return new Response(null, { status: Status.FORBIDDEN });
    }
  }
}
```

Note that guards can return an instance of the standard [Response][5] class.

It is recommended that guard files end with `*.guard.ts` and their class names end with `*Guard`.

If `canActivate()` returns:

- `true` or `Promise<true>`, means Ditsmod will process the corresponding route with this guard;
- `false` or `Promise<false>`, so the response to the request will contain a 401 status and the controller will not process the route;
- an instance of [Response][5] or `Promise<Response>`, which in this context Ditsmod interprets as a response to an HTTP request.

## Passing guards to injectors {#passing-guards-to-injectors}

Guards can be passed in module or controller metadata:

```ts {5}
import { restModule } from '@ditsmod/rest';
import { AuthGuard } from 'auth.guard';

@restModule({
  providersPerReq: [AuthGuard],
})
export class SomeModule {}
```

In this case, the guard will work at the request level, for controllers in injector-scoped mode.

## Use of guards {#use-of-guards}

If you use the `@ditsmod/rest` module, the guards are passed to the controllers in an array in the third parameter of the `route` decorator:

```ts {6}
import { controller, Res, route } from '@ditsmod/rest';
import { AuthGuard } from './auth.guard.js';

@controller()
export class SomeController {
  @route('GET', 'some-url', [AuthGuard])
  tellHello(res: Res) {
    res.send('Hello, admin!');
  }
}
```

## Guards with parameters {#guards-with-parameters}

The guard in the `canActivate()` method has two parameters. The arguments for the first parameter are automatically passed with the `RequestContext` datatype, and the arguments for the second parameter can be passed to the `route` decorator in an array where a certain guard comes first.

Let's consider such an example:

```ts {8}
import { controller, Res, route } from '@ditsmod/rest';

import { PermissionsGuard } from './permissions.guard.js';
import { Permission } from './permission.js';

@controller()
export class SomeController {
  @route('GET', 'some-url', [[PermissionsGuard, Permission.canActivateAdministration]])
  tellHello(res: Res) {
    res.send('Hello, admin!');
  }
}
```

As you can see, in place of the third parameter in `route`, an array is passed in an array, where `PermissionsGuard` is specified in the first place, followed by arguments for it. In this case, `PermissionsGuard` will receive these arguments in its `canActivate()` method:

```ts {11}
import { injectable, Status } from '@ditsmod/core';
import { CanActivate, RequestContext } from '@ditsmod/rest';

import { AuthService } from './auth.service.js';
import { Permission } from './permission.js';

@injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(ctx: RequestContext, params?: Permission[]) {
    if (await this.authService.hasPermissions(params)) {
      return true;
    } else {
      return new Response(null, { status: Status.FORBIDDEN });
    }
  }
}
```

## Helpers for guards with parameters {#helpers-for-guards-with-parameters}

Because parameter guards must be passed as an array within an array, this makes readability and type safety worse. For such cases, it is better to create a helper using the `createHelperForGuardWithParams()` factory:

```ts {5}
import { createHelperForGuardWithParams } from '@ditsmod/rest';
import { Permission } from './types.js';
import { PermissionsGuard } from './permissions-guard.js';

export const requirePermissions = createHelperForGuardWithParams<Permission>(PermissionsGuard);
```

In this example, `PermissionsGuard` is passed as an argument, which accepts parameters of type `Permission` in its `canActivate()` method.

`requirePermissions()` can now be used to create routes:

```ts {8}
import { controller, Res, route } from '@ditsmod/rest';

import { requirePermissions } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@controller()
export class SomeController {
  @route('GET', 'administration', [requirePermissions(Permission.canActivateAdministration)])
  helloAdmin(res: Res) {
    res.send('some secret');
  }
}
```

## Setting guards on the imported module {#setting-guards-on-the-imported-module}

You can also centrally set guards at the module level:

```ts {10}
import { restModule } from '@ditsmod/rest';

import { OtherModule } from '../other/other.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthGuard } from '../auth/auth.guard.js';

@restModule({
  imports: [
    AuthModule, 
    { module: OtherModule, path: '', guards: [AuthGuard] },
  ],
})
export class SomeModule {}
```

In this case, `AuthGuard` will be automatically added to each route in `OtherModule`. Note that the providers for the specified guard must provide the `SomeModule`, which is why it imports the `AuthModule`.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/03-route-guards
[2]: https://github.com/ditsmod/realworld/blob/main/packages/server/src/app/modules/service/auth/bearer.guard.ts
[3]: /basic-components/dependency-injection#injector-and-providers
[4]: /rest-application/controllers-and-services/#what-is-a-rest-controller
[5]: https://developer.mozilla.org/en-US/docs/Web/API/Response
