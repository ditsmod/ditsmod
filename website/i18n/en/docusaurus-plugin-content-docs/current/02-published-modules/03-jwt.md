---
sidebar_position: 3
title: JWT
---

# @ditsmod/jwt

The `@ditsmod/jwt` module integrates [jsonwebtoken][1] into a Ditsmod authentication application based on [JSON Web Token][2]. You can view a finished example of using this module in the [Ditsmod repository][3].

## Installation and importing

Installation:

```bash
yarn add @ditsmod/jwt
```

Importing:

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

As you can see, you can pass certain options to `JwtModule` during import. Now within `AuthModule` you can use `JwtService`:

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

You can read what the guards are in the [Guards][4] section.


[1]: https://github.com/auth0/node-jsonwebtoken
[2]: https://www.rfc-editor.org/rfc/rfc7519
[3]: https://github.com/ditsmod/ditsmod/tree/main/examples/14-auth-jwt
[4]: ../00-components-of-ditsmod-app/03-guards.md