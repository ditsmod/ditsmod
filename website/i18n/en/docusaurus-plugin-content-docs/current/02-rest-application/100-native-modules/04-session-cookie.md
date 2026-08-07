---
sidebar_position: 4
---

# @holu/session-cookie

The `@holu/session-cookie` module simplifies working with the session cookie. A ready-made example of using this module can be found in the [Holu repository][1].

## Installation, importing and usage {#installation-importing-and-usage}

Installation:

```bash
npm i @holu/session-cookie
```

Importing:

```ts
import { restModule } from '@holu/rest';
import { SessionCookieModule } from '@holu/session-cookie';

const sessionDynamicModule = SessionCookieModule.withOpts({
  cookieName: 'custom-session-name',
  httpOnly: true,
});

@restModule({
  imports: [
    sessionDynamicModule,
    // ...
  ],
  exports: [sessionDynamicModule],
})
export class AppModule {}
```

Usage:

```ts
import { controller, RequestContext, route } from '@holu/rest';
import { SessionCookie } from '@holu/session-cookie';

@controller()
export class HelloWorldController {
  constructor(private session: SessionCookie, private ctx: RequestContext) {}

  @route('GET', 'set')
  setCookie() {
    this.session.id = '123';
    this.ctx.send('Hello, World!\n');
  }

  @route('GET', 'get')
  getCookie() {
    this.ctx.send(`session ID: ${this.session.id}`);
  }
}
```



[1]: https://github.com/holu/holu/tree/main/examples/19-session-cookie
