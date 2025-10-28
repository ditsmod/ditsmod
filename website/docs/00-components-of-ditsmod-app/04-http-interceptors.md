---
sidebar_position: 4
---

# HTTP Інтерсептори

Інтерсептори дуже близькі по функціональності до контролерів, але вони не створюють роутів, вони прив'язуються до вже існуючих роутів. На одному роуті може працювати ціла група інтерсепторів, що запускаються один за одним. Інтерсептори - це аналог [middleware в ExpressJS][5], але інтерсептори можуть використовувати [DI][106]. Окрім цього, інтерсептори можуть працювати до та після роботи контролера.

Враховуючи що інтерсептори роблять таку ж роботу, яку можуть робити контролери, без інтерсепторів можна обійтись. Але в такому разі вам прийдеться значно частіше викликати різні сервіси в контролерах.

Як правило, інтерсептори використовують для автоматизації стандартної обробки, такої як:

- парсинг тіла запиту чи заголовків;
- валідація запиту;
- збирання та логування різних метрик роботи застосунку;
- кешування;
- і т.д.

Інтерсептори можна централізовано підключати або відключати, не змінюючи при цьому код методів контролерів, до яких вони прив'язуються. Як і контролери, інтерсептори можуть працювати [в режимі injector-scoped чи context-scoped][109]. На відміну від context-scoped, в режимі injector-scoped вони мають доступ до інжектора на рівні запиту, тому вони можуть викликати сервіси на рівні запиту. З іншого боку, в режимі context-scoped їхні інстанси створюються на рівні роуту, відповідно - для них доступні сервіси на рівні роуту, модуля чи застосунку.

## Схема обробки HTTP-запиту {#http-request-processing-scheme}

### Робота в режимі injector-scoped {#injector-scoped-mode}

Обробка HTTP-запиту має наступний робочий потік:

1. Ditsmod створює інстанс [PreRouter][7] на рівні застосунку.
2. `PreRouter` за допомогою роутера шукає обробника запиту відповідно до URI.
3. Якщо обробника запиту не знайдено, `PreRouter` видає помилку зі статусом 501.
4. Якщо знайшовся обробник запиту, Ditsmod створює інстанс провайдера з токеном [HttpFrontend][2] на рівні запиту, ставить його першим у черзі інтерсепторів і автоматично викликає. By default, цей інтерсептор відповідає за встановлення значень для провайдерів з токенами `QUERY_PARAMS` та `PATH_PARAMS`.
5. Якщо в поточному маршруті є ґарди, то по-дефолту запускається `InterceptorWithGuards` зразу після `HttpFrontend`.
6. Наступними можуть запуститись інші інтерсептори, це залежать від того, чи запустить їх попередній у черзі інтерсептор.
7. Якщо усі інтерсептори відпрацювали, Ditsmod запускає [HttpBackend][3], інстанс якого створюється на рівні запиту. By default, `HttpBackend` запускає безпосередньо метод контролера, що відповідає за обробку поточного запиту.

Отже, приблизний порядок обробки запиту такий:

1. `PreRouter`;
2. `HttpFrontend`;
3. `InterceptorWithGuards`;
4. інші інтерсептори;
5. `HttpBackend`;
6. метод контролера.

Оскільки ланцюжок промісів починається від `PreRouter`, і закінчується методом контролера, то резолвиться цей ланцюжок у зворотньому порядку - від методу контролера до `PreRouter`. Це означає, що в інтерсепторі ви можете слухати результат резолву проміса, що повертає метод контролера.

Окрім цього, оскільки інстанси `PreRouter`, `HttpFrontend`, `InterceptorWithGuards` та `HttpBackend` створюються за допомогою DI, ви можете їх підміняти своєю версією відповідних класів. Наприклад, якщо ви хочете не просто відправити 501-ий статус у випадку відсутності потрібного роута, а хочете ще й додати певний текст чи змінити заголовки, ви можете підмінити [PreRouter][7] своїм класом.

### Робота в режимі context-scoped {#context-scoped-mode}

Інтерсептор в режимі context-scoped працює дуже подібним чином до режиму injector-scoped, але при цьому він не використовує інжектор на рівні запиту. Робочий потік за його участі відрізняється у пункті 4 та 7, оскільки інстанс інтерсептора в режимі context-scoped створюється на рівні роуту:

1. Ditsmod створює інстанс [PreRouter][7] на рівні застосунку.
2. `PreRouter` за допомогою роутера шукає обробника запиту відповідно до URI.
3. Якщо обробника запиту не знайдено, `PreRouter` видає помилку зі статусом 501.
4. Якщо знайшовся обробник запиту, Ditsmod використовує інстанс провайдера з токеном [HttpFrontend][2] на рівні роуту, ставить його першим у черзі інтерсепторів і автоматично викликає. By default, цей інтерсептор відповідає за встановлення значень `pathParams` та `queryParams` для `RequestContext`.
5. Якщо в поточному маршруті є ґарди, то по-дефолту запускається `InterceptorWithGuardsPerRou` зразу після `HttpFrontend`.
6. Наступними можуть запуститись інші інтерсептори, це залежать від того, чи запустить їх попередній у черзі інтерсептор.
7. Якщо усі інтерсептори відпрацювали, Ditsmod запускає [HttpBackend][3], інстанс якого використовується на рівні роуту. By default, `HttpBackend` запускає безпосередньо метод контролера, що відповідає за обробку поточного запиту.

## Створення інтерсептора {#creating-an-interceptor}

Кожен інтерсептор повинен бути класом, що впроваджує інтерфейс [HttpInterceptor][1], та має анотацію з декоратором `injectable`:

```ts
import { injectable } from '@ditsmod/core';
import { RequestContext, HttpHandler, HttpInterceptor } from '@ditsmod/rest';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  intercept(next: HttpHandler, ctx: RequestContext) {
    return next.handle(); // Here returns Promise<any>;
  }
}
```

Як бачите, метод `intercept()` має два параметри: у перший передається інстанс обробника, що викликає наступний інтерсептор, а у другий - `RequestContext`, що містить нативні об'єкти запиту та відповіді від Node.js. Якщо для своєї роботи інтерсептор потребує додаткових даних, їх можна отримати в конструкторі через DI, як і в будь-якому сервісі.

## Передача інтерсептора в інжектор {#passing-interceptor-to-the-injector}

Інтерсептор для режиму injector-scoped передається в інжектор на рівні запиту за допомогою [мульти-провайдерів][107] з токеном `HTTP_INTERCEPTORS`:

```ts
import { HTTP_INTERCEPTORS, restModule } from '@ditsmod/rest';
import { MyHttpInterceptor } from './my-http-interceptor.js';

@restModule({
  // ...
  providersPerReq: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
export class SomeModule {}
```

Передача інтерсептора для режиму context-scoped відбувається точно таким же чином, але на рівні роуту, модуля чи застосунку:

```ts
import { HTTP_INTERCEPTORS, restModule } from '@ditsmod/rest';
import { MyHttpInterceptor } from './my-http-interceptor.js';

@restModule({
  // ...
  providersPerApp: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
export class SomeModule {}
```

В даному разі інтерсептор передано на рівні застосунку, але майте на увазі, що якщо ви передасте також інтерсептори на нижчих рівнях, то даний інтерсептор буде ігноруватись. Саме так працюють [мульти-провайдери][107].

В даному разі інтерсептори передаються в метадані модуля. Так само вони можуть передаватись у метадані контролера. Тобто інтерсептори можуть працювати або для усіх контролерів у модулі без виключень, або тільки для конкретного контролера. Якщо інтерсептори потрібно додати лише до окремих роутів у межах контролерів, це ви можете зробити за допомогою [розширень][108] (таким чином додаються [інтерсептори для парсингу тіла запиту][9]).

[1]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/types/http-interceptor.ts#L43-L45
[2]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/interceptors/default-http-frontend.ts
[3]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/interceptors/default-http-backend.ts
[5]: https://expressjs.com/en/guide/writing-middleware.html
[7]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/services/pre-router.ts
[8]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/types/route-data.ts
[9]: https://github.com/ditsmod/ditsmod/blob/body-parser-2.16.0/packages/body-parser/src/body-parser.extension.ts#L54

[106]: /components-of-ditsmod-app/dependency-injection
[107]: /components-of-ditsmod-app/dependency-injection#multi-providers
[108]: /components-of-ditsmod-app/extensions
[109]: /components-of-ditsmod-app/controllers-and-services/#what-is-a-controller
