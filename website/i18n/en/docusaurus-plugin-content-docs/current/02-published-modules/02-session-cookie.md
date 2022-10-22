---
sidebar_position: 2
title: Session's cookie
---

# @ditsmod/session-cookie

The `@ditsmod/session-cookie` module simplifies working with the session cookie. A ready-made example of using this module can be found in the [Ditsmod repository][1].

## Installation, importing and usage

Installation:

```bash
yarn add @ditsmod/session-cookie
```

Importing:

```ts
import { RootModule } from '@ditsmod/core';
import { SessionCookieModule } from '@ditsmod/session-cookie';

const sessionModuleWithParams = SessionCookieModule.withParsms({
  cookieName: 'custom-session-name',
  httpOnly: true,
});

@RootModule({
  imports: [
    sessionModuleWithParams,
    // ...
  ],
  exports: [sessionModuleWithParams],
})
export class AppModule {}
```

Usage:

```ts
import { Controller, Res, Route } from '@ditsmod/core';
import { SessionCookie } from '@ditsmod/session-cookie';

@Controller()
export class HelloWorldController {
  constructor(private session: SessionCookie, private res: Res) {}

  @Route('GET', 'set')
  setCookie() {
    this.session.id = '123';
    this.res.send('Hello World!\n');
  }

  @Route('GET', 'get')
  getCookie() {
    this.res.send(`session ID: ${this.session.id}`);
  }
}
```



[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/19-session-cookie
