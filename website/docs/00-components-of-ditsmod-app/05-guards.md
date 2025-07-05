---
sidebar_position: 5
---

# Ґарди (охоронці)

Якщо ви хочете обмежити доступ до певних маршрутів, ви можете скористатись ґардами. Готовий приклад застосунку з ґардами ви можете проглянути у теці [examples][1], або у [RealWorld example][2].

Будь-який ґард є [DI провайдером][3], що передається в інжектори на рівні запиту [в injector-scope режимі][4], або на інших рівнях, якщо контролер працює в режимі context-scoped. Кожен ґард повинен бути класом, що впроваджує інтерфейс `CanActivate`:

```ts
interface CanActivate {
  canActivate(ctx: RequestContext, params?: any[]): boolean | number | Promise<boolean | number>;
}
```

Наприклад, це можна зробити так:

```ts {8-10}
import { guard, CanActivate, RequestContext } from '@ditsmod/core';
import { AuthService } from './auth.service.js';

@guard()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(ctx: RequestContext, params?: any[]) {
    return Boolean(await this.authService.updateAndGetSession());
  }
}
```

Файли ґардів рекомендується називати із закінченням `*.guard.ts`, а імена їхніх класів - із закінченням `*Guard`.

Якщо `canActivate()` повертає:

- `true` чи `Promise<true>`, значить Ditsmod буде обробляти відповідний маршрут із цим ґардом;
- `false` чи `Promise<false>`, значить відповідь на запит міститиме 401 статус і обробки маршруту з боку контролера не буде;
- `number` чи `Promise<number>` Ditsmod інтерпретує як номер статусу (403, 401 і т.п.), який треба повернути у відповіді на HTTP-запит.

## Передача ґардів до інжекторів

Ґарди можна передавати у метаданих модуля чи контролера:

```ts {6}
import { featureModule } from '@ditsmod/core';

import { AuthGuard } from 'auth.guard';

@featureModule({
  providersPerReq: [AuthGuard],
})
export class SomeModule {}
```

В даному разі ґард буде працювати на рівні запиту, для контролерів неодинаків.

## Використання ґардів

Ґарди передаються до контролерів в масиві у третьому параметрі декоратора `route`:

```ts {8}
import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/rest';
import { AuthGuard } from './auth.guard.js';

@controller()
export class SomeController {
  @route('GET', 'some-url', [AuthGuard])
  tellHello(res: Res) {
    res.send('Hello, admin!');
  }
}
```

## Ґарди з параметрами

Ґард у методі `canActivate()` має два параметри. Аргументи для першого параметра з типом даних `RequestContext` підставляються автоматично, а для другого параметра аргументи можна передавати у декораторі `route` у масиві, де на першому місці йде певний ґард.

Давайте розглянемо такий приклад:

```ts {9}
import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/rest';

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

Як бачите, на місці третього параметра у `route` передається масив в масиві, де на першому місці вказано `PermissionsGuard`, а далі йдуть аргументи для нього. В такому разі `PermissionsGuard` отримає ці аргументи у своєму методі `canActivate()`:

```ts {10}
import { injectable, CanActivate, Status, RequestContext } from '@ditsmod/core';

import { AuthService } from './auth.service.js';
import { Permission } from './permission.js';

@injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(ctx: RequestContext, params?: Permission[]) {
    if (await this.authService.hasPermissions(params)) {
      return true;
    } else {
      return Status.FORBIDDEN;
    }
  }
}
```

## Хелпери для ґардів з параметрами

Оскільки ґарди з параметрами повинні передаватись у вигляді масива в масиві, це ускладнює читабельність та погіршує безпечність типів. Для таких випадків краще створити хелпер за допомогою фабрики `createHelperForGuardWithParams()`:

```ts {5}
import { createHelperForGuardWithParams } from '@ditsmod/core';
import { Permission } from './types.js';
import { PermissionsGuard } from './permissions-guard.js';

export const requirePermissions = createHelperForGuardWithParams<Permission>(PermissionsGuard);
```

В даному прикладі у якості аргументу передається `PermissionsGuard`, який приймає параметри з типом `Permission` у своєму методі `canActivate()`. 

Тепер `requirePermissions()` можна використовувати для створення роутів:

```ts {9}
import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/rest';

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

## Встановлення ґардів на імпортований модуль

Можна також централізовано підключати ґарди на рівні модуля:

```ts {10}
import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { restMetadata } from '@ditsmod/rest';

import { OtherModule } from '../other/other.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthGuard } from '../auth/auth.guard.js';

@restMetadata({
  importsWithParams: [
    { modRefId: OtherModule, path: '', guards: [AuthGuard] },
  ],
})
@featureModule({
  imports: [AuthModule],
})
export class SomeModule {}
```

В такому разі `AuthGuard` буде автоматично додаватись до кожного маршруту в `OtherModule`. Майте на увазі, що провайдери для указаного ґарда повинен забезпечувати `SomeModule`, саме тому він імпортує `AuthModule`.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/03-route-guards
[2]: https://github.com/ditsmod/realworld/blob/main/packages/server/src/app/modules/service/auth/bearer.guard.ts
[3]: /components-of-ditsmod-app/dependency-injection#провайдери
[4]: /components-of-ditsmod-app/controllers-and-services/#what-is-a-controller
