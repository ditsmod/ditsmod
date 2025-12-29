---
sidebar_position: 99
---

# Домовленості по коду

Тут наводиться рекомендований формат у вигляді пари "назва файлу" - "ім'я класу":

- `hello-world.module.ts` - `HelloWorldModule`;
- `hello-world.controller.ts` - `HelloWorldController`;
- `hello-world.service.ts` - `HelloWorldService`;
- `auth.guard.ts` - `AuthGuard`.

Тобто,

1. назви будь-яких файлів повинні містити тільки маленькі букви;
2. якщо у назві файлу є декілька слів, варто розділяти їх через дефіз;
3. ролі класів повинні йти перед розширенням і перед ними повинна ставитись крапка
(`*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.guard.ts`);
4. назви класів повинні починатись з великої літери, і містити точно такі ж слова, що є у назві їхніх файлів, але у стилі [CamelCase][1].
5. End-to-end тести тримати в окремому каталозі з назвою `e2e`, на одному рівні з кореневим каталогом `src`.

Кореневий модуль рекомендується називати `AppModule`.

При імпорті рекомендується не змішувати імпорт з локальних файлів та імпорт з `node_modules`. Вгорі йдуть імпорти з `node_modules`, через один рядок йдуть локальні імпорти:

```ts
import { injectable, Status } from '@ditsmod/core';
import { CanActivate } from '@ditsmod/rest';

import { AuthService } from './auth.service.js';
import { Permission } from './permission.js';
```

Токени груп розширень повинні мати закінчення `_EXTENSIONS`, наприклад `MY_EXTENSIONS`.

[1]: https://uk.wikipedia.org/wiki/%D0%92%D0%B5%D1%80%D0%B1%D0%BB%D1%8E%D0%B6%D0%B8%D0%B9_%D1%80%D0%B5%D0%B3%D1%96%D1%81%D1%82%D1%80
