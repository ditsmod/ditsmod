---
sidebar_position: 5
---

# @ditsmod/jwt

The `@ditsmod/jwt` module integrates [jsonwebtoken][1] into a Ditsmod authentication application based on [JSON Web Token][2]. You can view a finished example of using this module in the [Ditsmod repository][3].

## Installation and importing {#installation-and-importing}

Installation:

```bash
npm i @ditsmod/jwt
```

Importing:

```ts {7,10}
import { featureModule } from '@ditsmod/core';
import { JwtModule } from '@ditsmod/jwt';

import { AuthController } from './auth.controller.js';
import { BearerGuard } from './bearer.guard.js';

const moduleWithParams = JwtModule.withParams({ secret: 'hard-to-guess-secret', signOptions: { expiresIn: '2m' } });

@featureModule({
  imports: [moduleWithParams],
  controllers: [AuthController],
  providersPerReq: [BearerGuard],
  exports: [BearerGuard]
})
export class AuthModule {}
```

As you can see, you can pass certain options to `JwtModule` during import.

Now within `AuthModule` you can use `JwtService`:

```ts {8,19-22}
import { injectable, Injector, RequestContext } from '@ditsmod/core';
import { CanActivate } from '@ditsmod/rest';
import { JwtService, VerifyErrors, JWT_PAYLOAD } from '@ditsmod/jwt';

@injectable()
export class BearerGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private injector: Injector
  ) {}

  async canActivate(ctx: RequestContext) {
    const authValue = ctx.rawReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    const token = authValue[1];
    const payload = await this.jwtService
      .verifyWithSecret(token)
      .then((payload) => payload)
      .catch((err: VerifyErrors) => false as const); // Here `as const` to narrow down returned type.

    if (payload) {
      this.injector.setByToken(JWT_PAYLOAD, payload);
      return true;
    } else {
      return false;
    }
  }
}
```

You can read what the guards are in the [Guards][4] section.


[1]: https://github.com/auth0/node-jsonwebtoken
[2]: https://www.rfc-editor.org/rfc/rfc7519
[3]: https://github.com/ditsmod/ditsmod/tree/main/examples/14-auth-jwt
[4]: /components-of-ditsmod-app/guards
