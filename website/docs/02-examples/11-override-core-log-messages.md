# 11-override-core-log-messages

У Ditsmod можна підмінити дефолтний логер на свій логер, завдяки чому ви зможете у свій спосіб записувати навіть ті повідомлення, що видаються у `@ditsmod/core`. Але підміна логера не дозволяє змінювати текст самих повідомлень. Для зміни повідомлень використовується `LogMediator`. Звичайно ж, якщо ви маєте безпосередній доступ до коду, де логер записує певне повідомлення, то ви тут же на місці зможете це повідомлення змінити і без `LogMediator`. А якщо повідомлення видає сам фреймворк Ditsmod або його модулі, без `LogMediator` не обійтись.

Якщо ви захочете написати модуль для застосунку Ditsmod, щоб опублікувати його, наприклад, на npmjs.com, то рекомендується використовувати саме `LogMediator` замість `Logger`, оскільки користувачі зможуть змінювати повідомлення, які пише ваш модуль.

Окрім зміни повідомлень, `LogMediator` також дозволяє фільтрувати логи по різним параметрам. Наприклад, якщо ви включите для логера максимально багатослівний режим `trace`, Ditsmod може видати багато деталізованої інформації, а конфігураційний файл для `LogMediator` дозволить відфільтрувати повідомлення лише для окремих модулів.

У репозиторії Ditsmod є спеціальний приклад [11-override-core-log-messages][1], де продемонстровано декілька варіантів використання `LogMediator`. Щоб спробувати даний приклад, необхідно спочатку клонувати репозиторій та встановити залежності:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
yarn
```

Після чого ви зможете у своєму редакторі безпосередньо проглядати та експериментувати з даним прикладом.

## Розширення класу LogMediator

Оскільки у цьому прикладі розширюється клас, тут використовується рекомендоване налаштування TypeScript у `tsconfig.json`:

```json
{
  "compilerOptions": {
    // ...
    "noImplicitOverride": true,
    // ...
  },
  // ...
}
```

Ця фіча стала доступною у TypeScript починаючи з версії 4.3, вона дозволяє робити ваш код більш читабельним, оскільки не дозволяє переписувати методи батьківського класу без слова `override`. З іншого боку, якщо у батьківському класі зникне метод, який у дочірньому класі позначено `override`, то TypeScript також кине помилку з відповідною підказкою.

Тепер давайте проглянемо на `MyLogMediator`:

```ts
import { LogMediator, FilterConfig } from '@ditsmod/core';

export class MyLogMediator extends LogMediator {
  /**
   * Here serverName: "${serverName}", here host: "${host}", and here port: "${port}"
   */
  override serverListen(self: object, serverName: string, host: string, port: number) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('info', filterConfig, `Here serverName: "${serverName}", here host: "${host}", and here port: "${port}"`);
  }
}
```

Як бачите, `MyLogMediator` розширює `LogMediator`, а метод `serverListen()` позначено ключовим словом `override`, оскільки тут переписується батьківський метод із точно такою назвою. У коментарях до методу написано текст повідомлення, що буде записуватись у логи. У будь-який метод `LogMediator` (для запису логів) першим аргументом завжди передається `this` того інстансу класу, де використовується `LogMediator`, щоб можна було легко отримати ім'я цього класу. Решта аргументів є довільною, усе залежить від контексту використання цих методів.

Результат можна побачити, якщо запустити застосунок командою `yarn start11`, після чого вам повинно видатись саме те повідомлення, яке сформовано у даному методі `myLogMediator.serverListen()`.

## Фільтрування логів

Як видно з попереднього прикладу, у `myLogMediator.serverListen()` використовуються метод `setLog()` та клас `FilterConfig`, які мають наступні типи:

```ts
setLog<T extends FilterConfig>(level: LogLevel, filterConfig: T, msg: any): void;

class FilterConfig {
  modulesNames?: string[];
  classesNames?: string[];
  tags?: string[];
}
```

Інстанс `FilterConfig` використовується для можливості подальшого фільтрування логів, наприклад так, як це показано у `AppModule`:

```ts
import { RootModule, LogMediatorConfig, FilterConfig } from '@ditsmod/core';

const filterConfig: FilterConfig = { modulesNames: ['OtherModule'] };

@RootModule({
  // ...
  providersPerApp: [
    // ...
    { provide: LogMediatorConfig, useValue: { filterConfig } },
  ],
})
export class AppModule {}
```

Щоб побачити як діють дані фільтри, у `AppModule` спочатку змініть рівень виводу логів на `trace`:

```ts
const loggerConfig = new LoggerConfig('trace');
```

Потім запустіть застосунок командою `yarn start11`, після чого ви повинні побачити багато логів. Тепер розкоментуйте рядок з `LogMediatorConfig`, і ви повинні побачити логи лише з модуля `OtherModule`.

## Підміна LogMediator на рівні застосунку

Якщо проглянути `AppModule`, можна побачити як підміняється `LogMediator` на `MyLogMediator`:

```ts
import { LogMediator } from '@ditsmod/core';

import { MyLogMediator } from './my-log-mediator';
// ...
  providersPerApp: [
    { provide: LogMediator, useClass: MyLogMediator },
    MyLogMediator,
  ],
// ...
export class AppModule {}
```

У даному разі, перший елемент масиву `providersPerApp` дозволить використовувати `MyLogMediator` у коді Ditsmod core, другий елемент - дозволить запитувати інстанс `MyLogMediator` у конструкторах контролерів чи сервісів вашого застосунку.

## Підміна LogMediator на рівні модуля

Як було сказано на початку цієї публікації, якщо ви плануєте публікувати ваш модуль для інших користувачів, рекомендується використовувати `LogMediator` замість `Logger`. В такому разі користувачі зможуть змінювати повідомлення, які пише ваш модуль, а також фільтрувати їх.

В даному прикладі у `SomeModule` є `SomeService`, де використовується `SomeLogMediator`. Можна уявити що `SomeModule` є зовнішнім модулем, який нібито встановлюється через менеджера пакетів (npm, yarn, і т.д.), і тому у вас до нього є доступ "тільки для читання". `SomeModule` імпортується у `OtherModule`, в якому запускається зовнішній сервіс `SomeService`, в якому в свою чергу запускається `SomeLogMediator`.

Щоб змінити повідомлення із зовнішнього сервісу, у `OtherModule` розширено `SomeLogMediator` та переписано той метод, що працює у `SomeService`. Після цього зроблену підміну `SomeLogMediator` на `OtherLogMediator`:

```ts
import { Module } from '@ditsmod/core';

import { SomeModule } from '../some/some.module';
import { SomeLogMediator } from '../some/some-log-mediator';
import { OtherController } from './other.controller';
import { OtherLogMediator } from './other-log-mediator';

@Module({
  imports: [SomeModule],
  controllers: [OtherController],
  providersPerMod: [{ provide: SomeLogMediator, useClass: OtherLogMediator }],
})
export class OtherModule {}
```




[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/11-override-core-log-messages
