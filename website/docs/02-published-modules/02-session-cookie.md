---
sidebar_position: 2
title: Куки сесії
---

# @ditsmod/session-cookie

Модуль `@ditsmod/session-cookie` спрощує роботу з кукою сесії. Готовий приклад використання даного модуля можна знайти в [репозиторії Ditsmod][1].

## Встановлення, підключення та використання

Встановлення:

```bash
yarn add @ditsmod/session-cookie
```

Підключення:

```ts
import { rootModule } from '@ditsmod/core';
import { SessionCookieModule } from '@ditsmod/session-cookie';

const sessionModuleWithParams = SessionCookieModule.withParsms({
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

Використання:

```ts
import { controller, Res, route } from '@ditsmod/core';
import { SessionCookie } from '@ditsmod/session-cookie';

@controller()
export class HelloWorldController {
  constructor(private session: SessionCookie, private res: Res) {}

  @route('GET', 'set')
  setCookie() {
    this.session.id = '123';
    this.res.send('Hello World!\n');
  }

  @route('GET', 'get')
  getCookie() {
    this.res.send(`session ID: ${this.session.id}`);
  }
}
```



[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/19-session-cookie
