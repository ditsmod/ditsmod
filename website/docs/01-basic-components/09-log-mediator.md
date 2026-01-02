---
sidebar_position: 9
---

# LogMediator

У Ditsmod-застосунках можна підмінити дефолтний логер на свій логер, і це дасть вам змогу у свій спосіб записувати навіть ті повідомлення, що видаються у `@ditsmod/core`. Але підміна логера не дозволяє змінювати текст самих повідомлень та рівень логування (trace, debug, info, warn, error). Для цього використовується `LogMediator` (або його дочірній клас `SystemLogMediator`). Звичайно ж, якщо ви маєте безпосередній доступ до коду, де логер записує певне повідомлення, то ви тут же на місці зможете це повідомлення змінити і без `LogMediator`. А якщо повідомлення видає сам фреймворк Ditsmod або його модулі, без `LogMediator` не обійтись.

Якщо ви захочете написати модуль для застосунку Ditsmod, щоб опублікувати його, наприклад, на npmjs.com, то рекомендується використовувати саме `LogMediator` замість `Logger`, оскільки користувачі зможуть змінювати повідомлення, які пише ваш модуль.

У репозиторії Ditsmod є приклад [11-override-core-log-messages][1], де продемонстровано декілька варіантів використання `LogMediator`. Щоб спробувати даний приклад, необхідно спочатку клонувати репозиторій та встановити залежності:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
cd examples/11-override-core-log-messages
npm start
```

Після чого ви зможете у своєму редакторі безпосередньо проглядати та експериментувати з даним прикладом.

## Розширення класу LogMediator {#extending-logmediator-class}

Оскільки у цьому прикладі розширюється клас, тут використовується рекомендоване налаштування TypeScript у `tsconfig.json`:

```json
{
  "compilerOptions": {
    // ...
    "noImplicitOverride": true
    // ...
  }
  // ...
}
```

Ця фіча стала доступною у TypeScript починаючи з версії 4.3, вона дозволяє робити ваш код більш читабельним, оскільки не дозволяє переписувати властивості та методи батьківського класу без слова `override`. З іншого боку, якщо у батьківському класі зникне метод, який у дочірньому класі позначено `override`, то TypeScript також кине помилку з відповідною підказкою.

Тепер давайте проглянемо на `MyLogMediator`:

```ts
import { injectable, SystemLogMediator } from '@ditsmod/core';

@injectable()
export class MyLogMediator extends SystemLogMediator {
  /**
   * Custom message: here host: "${host}", and here port: "${port}"
   */
  override serverListen(self: object, host: string, port: number) {
    this.setLog('info', `Custom message: here host: "${host}", and here port: "${port}"`);
  }
}
```

Як бачите, `MyLogMediator` розширює `SystemLogMediator`, а метод `serverListen()` позначено ключовим словом `override`, оскільки тут переписується батьківський метод з точно такою назвою. У коментарях до методу написано текст повідомлення, що буде записуватись у логи. Майже в усі методи `SystemLogMediator` першим аргументом передається `this` того інстансу класу, де використовується `SystemLogMediator`, щоб можна було легко отримати ім'я того класу. Решта аргументів є довільною, усе залежить від контексту використання цих методів.

Результат можна побачити, якщо запустити застосунок командою `npm start`, після чого вам повинно видатись саме те повідомлення, яке сформовано у даному методі.

## Підміна LogMediator на рівні застосунку {#logmediator-substitution-at-the-application-level}

Якщо проглянути `AppModule`, можна побачити як підміняється `SystemLogMediator` на `MyLogMediator`:

```ts {8-9}
import { SystemLogMediator, rootModule } from '@ditsmod/core';

import { MyLogMediator } from './my-log-mediator.js';

@rootModule({
// ...
  providersPerApp: [
    { token: SystemLogMediator, useToken: MyLogMediator },
    MyLogMediator,
  ],
})
export class AppModule {}
```

У даному разі, перший елемент масиву `providersPerApp` дозволить використовувати `MyLogMediator` у коді Ditsmod core, другий елемент - дозволить запитувати інстанс `MyLogMediator` у конструкторах контролерів чи сервісів вашого застосунку.

Майте на увазі, що така підміна на рівні застосунку працює без додаткових налаштувань тільки в кореневому модулі. Якщо ж ви це зробите не в кореневому модулі, вам додатково прийдеться [вирішувати колізію провайдерів][100] в кореневому модулі (хоча це і робиться досить просто).

## Підміна LogMediator на рівні модуля {#module-level-substitute-of-logmediator}

Як було сказано на початку, якщо ви плануєте публікувати ваш модуль для інших користувачів, рекомендується використовувати `LogMediator` замість `Logger`. В такому разі користувачі зможуть змінювати повідомлення, які пише ваш модуль.

Щоб змінити повідомлення із зовнішнього сервісу, у `OtherModule` розширено `SomeLogMediator` та переписано той метод, що працює у `SomeService`. Після цього зроблену підміну `SomeLogMediator` на `OtherLogMediator`:

```ts
import { restModule } from '@ditsmod/rest';

import { SomeModule } from '../some/some.module.js';
import { SomeLogMediator } from '../some/some-log-mediator.js';
import { OtherController } from './other.controller.js';
import { OtherLogMediator } from './other-log-mediator.js';

@restModule({
  imports: [SomeModule],
  controllers: [OtherController],
  providersPerMod: [{ token: SomeLogMediator, useClass: OtherLogMediator }],
})
export class OtherModule {}
```

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/11-override-core-log-messages

[100]: /basic-components/modules/#provider-collisions
