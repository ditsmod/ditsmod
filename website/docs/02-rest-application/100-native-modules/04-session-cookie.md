---
sidebar_position: 4
---

# @holu/session-cookie

Модуль `@holu/session-cookie` спрощує роботу з кукою сесії. Готовий приклад використання даного модуля можна знайти в [репозиторії Holu][1].

## Встановлення, підключення та використання {#installation-importing-and-usage}

Встановлення:

```bash
npm i @holu/session-cookie
```

Підключення:

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

Використання:

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
