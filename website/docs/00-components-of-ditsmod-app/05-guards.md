---
sidebar_position: 5
---

# Ґарди (охоронці)

Якщо ви хочете обмежити доступ до певних маршрутів, ви можете скористатись ґардами. Готовий приклад застосунку з ґардами ви можете проглянути у теці [examples][1], або у [RealWorld example][2].

Будь-який ґард є [DI провайдером][3], що передається в інжектори на рівні запиту. Кожен ґард повинен бути класом, що впроваджує інтерфейс `CanActivate`:

```ts
interface CanActivate {
  canActivate(params?: any[]): boolean | number | Promise<boolean | number>;
}
```

Наприклад, це можна зробити так:

```ts {10-12}
import { injectable } from '@ditsmod/core';
import { CanActivate } from '@ditsmod/core';

import { AuthService } from './auth.service';

@injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate() {
    return Boolean(await this.authService.updateAndGetSession());
  }
}
```

Файли ґардів рекомендується називати із закінченням `*.guard.ts`, а імена їхніх класів - із закінченням `*Guard`.

Якщо `canActivate()` повертає:

- `true` чи `Promise<true>`, значить Ditsmod буде обробляти відповідний маршрут із цим ґардом;
- `false` чи `Promise<false>`, значить відповідь на запит міститиме 401 статус і обробки маршруту
з боку контролера не буде;
- `number` чи `Promise<number>` Ditsmod інтерпретує як номер статусу (403, 401 і т.п.), який треба повернути у відповіді на HTTP-запит.

## Використання ґардів

Ґарди передаються в масиві у третьому параметрі декоратора `route`:

```ts {7}
import { controller, Res, route } from '@ditsmod/core';

import { AuthGuard } from './auth.guard';

@controller()
export class SomeController {
  @route('GET', 'some-url', [AuthGuard])
  tellHello(res: Res) {
    res.send('Hello admin!');
  }
}
```

## Ґарди з параметрами

У методі `canActivate()` ґард має один параметр. Аргументи для цього параметру можна передавати у декораторі `route` у масиві, де на першому місці йде певний ґард.

Давайте розглянемо такий приклад:

```ts {8}
import { controller, Res, route } from '@ditsmod/core';

import { PermissionsGuard } from './permissions.guard';
import { Permission } from './permission';

@controller()
export class SomeController {
  @route('GET', 'some-url', [[PermissionsGuard, Permission.canActivateAdministration]])
  tellHello(res: Res) {
    res.send('Hello admin!');
  }
}
```

Як бачите, на місці третього параметра у `route` передається масив в масиві, де на першому місці указано `PermissionsGuard`, а далі йдуть аргументи для нього. В такому разі `PermissionsGuard` отримає ці аргументи у своєму методі `canActivate()`:

```ts {11}
import { injectable } from '@ditsmod/core';
import { CanActivate, Status } from '@ditsmod/core';

import { AuthService } from './auth.service';
import { Permission } from './permission';

@injectable()
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

## Хелпери для ґардів з параметрами

Оскільки ґарди з параметрами повинні передаватись у вигляді масива в масиві, це ускладнює читабельність та погіршує безпечність типів. Для таких випадків краще створити хелпер за допомогою фабрики `createHelperForGuardWithParams()`:

```ts {5}
import { createHelperForGuardWithParams } from '@ditsmod/core';
import { Permission } from './types';
import { PermissionsGuard } from './permissions-guard';

export const requirePermissions = createHelperForGuardWithParams<Permission>(PermissionsGuard);
```

В даному прикладі у якості аргументу передається `PermissionsGuard`, який приймає параметри з типом `Permission`. 

Тепер `requirePermissions()` можна використовувати для створення роутів:

```ts {8}
import { controller, Res, route } from '@ditsmod/core';

import { requirePermissions } from '../auth/guards-utils';
import { Permission } from '../auth/types';

@controller()
export class SomeController {
  @route('GET', 'administration', [requirePermissions(Permission.canActivateAdministration)])
  helloAdmin(res: Res) {
    res.send('some secret');
  }
}
```

## Передача ґардів до інжекторів

Ґарди передаються в DI лише для інжекторів на рівні запиту. Це можна зробити або в контролері, або у модулі:

```ts
import { featureModule } from '@ditsmod/core';

import { AuthGuard } from 'auth.guard';

@featureModule({
  providersPerReq: [AuthGuard],
})
export class SomeModule {}
```

## Встановлення ґардів на імпортований модуль

Можна також централізовано підключати ґарди на рівні модуля:

```ts
import { featureModule } from '@ditsmod/core';

import { OtherModule } from '../other/other.module';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';

@featureModule({
  imports: [
    AuthModule,
    { path: 'some-path', module: OtherModule, guards: [AuthGuard] }
  ]
})
export class SomeModule {}
```

В такому разі `AuthGuard` буде автоматично додаватись до кожного маршруту в `OtherModule`.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/03-route-guards
[2]: https://github.com/ditsmod/realworld/blob/main/packages/server/src/app/modules/service/auth/bearer.guard.ts
[3]: /components-of-ditsmod-app/dependency-injection#провайдери
