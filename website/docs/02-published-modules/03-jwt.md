---
sidebar_position: 3
title: JWT
---

# @ditsmod/jwt

Модуль `@ditsmod/jwt` інтегрує [jsonwebtoken][1] у Ditsmod-застосунок для аутентифікації, що працює на основі [JSON Web Token][2]. Готовий приклад використання цього модуля можете проглянути в [репозиторії Ditsmod][3].

## Встановлення та підключення

Встановлення:

```bash
yarn add @ditsmod/jwt
```

Підключення:

```ts
import { Module } from '@ditsmod/core';
import { JwtModule } from '@ditsmod/jwt';

import { AuthController } from './auth.controller';
import { BearerGuard } from './bearer.guard';

const moduleWithParams = JwtModule.withParams({ secret: 'hard-to-guess-secret', signOptions: { expiresIn: '2m' } });

@Module({
  imports: [moduleWithParams],
  controllers: [AuthController],
  providersPerReq: [BearerGuard],
  exports: [BearerGuard]
})
export class AuthModule {}
```

Як бачите, під час імпорту можна передавати певні опції для `JwtModule`. Тепер в межах `AuthModule` можете використовувати `JwtService`:


```ts
import { Injectable } from '@ts-stack/di';
import { CanActivate, Req } from '@ditsmod/core';
import { JwtService, VerifyErrors } from '@ditsmod/jwt';

@Injectable()
export class BearerGuard implements CanActivate {
  constructor(private req: Req, private jwtService: JwtService) {}

  async canActivate() {
    const authValue = this.req.nodeReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    const token = authValue[1];
    const payload = await this.jwtService
      .verifyWithSecret(token)
      .then((payload) => payload)
      .catch((err: VerifyErrors) => false as const); // Here `as const` to narrow down returned type.

    if (payload) {
      this.req.jwtPayload = payload;
      return true;
    } else {
      return false;
    }
  }
}
```

Що таке ґарди, можете прочитати у розділі [Guards (охоронці)][4].


[1]: https://github.com/auth0/node-jsonwebtoken
[2]: https://www.rfc-editor.org/rfc/rfc7519
[3]: https://github.com/ditsmod/ditsmod/tree/main/examples/14-auth-jwt
[4]: ../00-components-of-ditsmod-app/03-guards.md
