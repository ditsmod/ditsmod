---
sidebar_position: 3
---

# Guards (охоронці)

## Гарди без параметрів

Якщо вам необхідно щоб до певних маршрутів мали доступ, наприклад, лише авторизовані користувачі,
ви можете у третьому параметрі декоратора `Route` в масиві указати `AuthGuard`:

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

Будь-який guard повинен впроваджувати інтерфейс `CanActivate`:

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

Якщо `canActivate()` повертає:

- `true` чи `Promise<true>`, значить Ditsmod буде обробляти відповідний маршрут із цим гардом;
- `false` чи `Promise<false>`, значить відповідь на запит міститиме 401 статус і обробки маршруту
з боку контролера не буде;
- `number` чи `Promise<number>` Ditsmod інтерпретує це як номер статусу (403, 401 і т.п.),
який треба повернути у відповіді на HTTP-запит.

## Гарди з параметрами

У методі `canActivate()` гард має один параметр. Аргументи для цього параметру можна передавати
у декораторі `Route` у масиві, де на першому місці йде певний гард.

Давайте розглянемо такий приклад:

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

Як бачите, на місці третього параметра у `Route` передається масив в масиві, де на першому місці
указано `PermissionsGuard`, а далі йдуть аргументи для нього. В такому разі `PermissionsGuard`
отримає ці аргументи у своєму методі `canActivate()`:

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
