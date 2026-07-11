---
sidebar_position: 4
---

# @ditsmod/session-cookie

Модуль `@ditsmod/session-cookie` спрощує роботу з кукою сесії. Готовий приклад використання даного модуля можна знайти в [репозиторії Ditsmod][1].

## Встановлення, підключення та використання {#installation-importing-and-usage}

Встановлення:

```bash
npm i @ditsmod/session-cookie
```

Підключення:

```ts
import { restModule } from '@ditsmod/rest';
import { SessionCookieModule } from '@ditsmod/session-cookie';

const sessionDynamicModule = SessionCookieModule.withParams({
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
import { controller, RequestContext, route } from '@ditsmod/rest';
import { SessionCookie } from '@ditsmod/session-cookie';

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



[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/19-session-cookie
