---
sidebar_position: 2
---

# @ditsmod/session-cookie

The `@ditsmod/session-cookie` module simplifies working with the session cookie. A ready-made example of using this module can be found in the [Ditsmod repository][1].

## Installation, importing and usage

Installation:

```bash
npm i @ditsmod/session-cookie
```

Importing:

```ts
import { rootModule } from '@ditsmod/core';
import { SessionCookieModule } from '@ditsmod/session-cookie';

const sessionModuleWithParams = SessionCookieModule.withParams({
  cookieName: 'custom-session-name',
  httpOnly: true,
});

@rootModule({
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
import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/rest';
import { SessionCookie } from '@ditsmod/session-cookie';

@controller()
export class HelloWorldController {
  constructor(private session: SessionCookie, private res: Res) {}

  @route('GET', 'set')
  setCookie() {
    this.session.id = '123';
    this.res.send('Hello, World!\n');
  }

  @route('GET', 'get')
  getCookie() {
    this.res.send(`session ID: ${this.session.id}`);
  }
}
```



[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/19-session-cookie
