---
sidebar_position: 3
---

# Ґарди (охоронці)

Якщо ви хочете обмежити доступ до певних маршрутів, ви можете скористатись ґардами. Готовий приклад застосунку із ґардами ви можете проглянути у теці [examples][1], або у [RealWorld example][2].

Будь-який ґард повинен бути класом, що впроваджує інтерфейс `CanActivate`:

```ts
interface CanActivate {
  canActivate(params?: any[]): boolean | number | Promise<boolean | number>;
}
```

Наприклад, це можна зробити так:

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

Файли ґардів рекомендується називати із закінченням `*.guard.ts`, а імена їхніх класів - із закінченням `*Guard`.

Якщо `canActivate()` повертає:

- `true` чи `Promise<true>`, значить Ditsmod буде обробляти відповідний маршрут із цим ґардом;
- `false` чи `Promise<false>`, значить відповідь на запит міститиме 401 статус і обробки маршруту
з боку контролера не буде;
- `number` чи `Promise<number>` Ditsmod інтерпретує як номер статусу (403, 401 і т.п.), який треба повернути у відповіді на HTTP-запит.

## Використання ґардів

Ґарди передаються в масиві у третьому параметрі декоратора `Route`:

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

## Ґарди з параметрами

У методі `canActivate()` ґард має один параметр. Аргументи для цього параметру можна передавати у декораторі `Route` у масиві, де на першому місці йде певний ґард.

Давайте розглянемо такий приклад:

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

Як бачите, на місці третього параметра у `Route` передається масив в масиві, де на першому місці указано `PermissionsGuard`, а далі йдуть аргументи для нього. В такому разі `PermissionsGuard` отримає ці аргументи у своєму методі `canActivate()`:

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

## Передача ґардів до інжекторів

Ґарди передаються в DI лише для інжекторів на рівні запиту. Це можна зробити або в контролері, або у модулі:

```ts
import { Module } from '@ditsmod/core';

import { AuthGuard } from 'auth.guard';

@Module({
  providersPerReq: [AuthGuard],
})
export class SomeModule {}
```

## Встановлення ґардів на імпортований модуль

Можна також централізовано підключати ґарди на рівні модуля:

```ts
import { Module } from '@ditsmod/core';

import { OtherModule } from '../other/other.module';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';

@Module({
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
