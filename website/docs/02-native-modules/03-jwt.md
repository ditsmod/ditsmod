---
sidebar_position: 3
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
import { featureModule } from '@ditsmod/core';
import { JwtModule } from '@ditsmod/jwt';

import { AuthController } from './auth.controller';
import { BearerGuard } from './bearer.guard';

const moduleWithParams = JwtModule.withParams({ secret: 'hard-to-guess-secret', signOptions: { expiresIn: '2m' } });

@featureModule({
  imports: [moduleWithParams],
  controllers: [AuthController],
  providersPerReq: [BearerGuard],
  exports: [BearerGuard]
})
export class AuthModule {}
```

Як бачите, під час імпорту можна передавати певні опції для `JwtModule`. Тепер в межах `AuthModule` можете використовувати `JwtService`:

```ts
import { injectable, CanActivate, Injector } from '@ditsmod/core';
import { JwtService, VerifyErrors } from '@ditsmod/jwt';

@injectable()
export class BearerGuard implements CanActivate {
  constructor(
    @fromSelf() private jwtService: JwtService,
    @fromSelf() @inject(NODE_REQ) private nodeReq: NodeRequest,
    @fromSelf() private injector: Injector
  ) {}

  async canActivate() {
    const authValue = this.nodeReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    const token = authValue[1];
    const payload = await this.jwtService
      .verifyWithSecret(token)
      .then((payload) => payload)
      .catch((err: VerifyErrors) => false as const); // Here `as const` to narrow down returned type.

    if (payload) {
      this.injector.setByToken(JwtPayload, payload);
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
[4]: /components-of-ditsmod-app/guards
