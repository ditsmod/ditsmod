---
sidebar_position: 6
---

# Домовленості по коду

Тут наводиться рекомендований формат у вигляді пари "назва файлу" - "ім'я класу":

- `hello-world.controller` - `HelloWorldController`;
- `hello-world.service` - `HelloWorldService`;
- `hello-world.module` - `HelloWorldModule`;
- `auth.guard` - `AuthGuard`;

Кореневий модуль рекомендується називати `AppModule`.

При імпорті рекомендується не змішувати імпорт з локальних файлів та імпорт з `node_modules`.
Вгорі йдуть імпорти з `node_modules`, через один рядок йдуть локальні імпорти:

```ts
import { Injectable } from '@ts-stack/di';
import { CanActivate, Status } from '@ditsmod/core';

import { AuthService } from './auth.service';
import { Permission } from './permission';
```

Розширення повинні мати закінчення `_EXTENSIONS`, наприклад `MY_EXTENSIONS`.