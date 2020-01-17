## Крок 1.

```bash
mkdir restify-ts
cd restify-ts
git clone git@github.com:restify-ts/core.git
git checkout step1
npm i
```

Додаємо до застосунку метод `requestListener`, який на будь-який вхідний запит відповідає "Hello World!".

## Крок 2.

```bash
git checkout step2
npm i
```

Додаємо можливість передавати опції для конструктора застосунка.

## Крок 3.

```bash
git checkout step3
npm i
```

Впроваджуємо DI на рівні застосунку, та використовуємо його для передачі логера.

## Крок 4.

```bash
git checkout step4
npm i
```

Впроваджуємо DI на рівні HTTP-запитів.

## Крок 5.

```bash
git checkout step5
npm i
```

Додаємо роутер.

## Крок 6.

```bash
git checkout step6
npm i
```

Додаємо сервіс для контролера, та відправляємо повідомлення із цього сервіса.

## Крок 7.

```bash
git checkout step7
npm i
```

Додаємо enum `Status`, що містить усі HTTP-статуси.

## Крок 8.

```bash
git checkout step8
npm i
```

Розміщуємо файли тестового застосунку так, як вони можуть бути розміщені в реальному проекті.

## Крок 9.

```bash
git checkout step9
npm i
```

Підставляємо в DI свій логер, щоб він замінив початковий логер застосунка.

## Крок 10.

```bash
git checkout step10
npm i
```

Переписуємо метод `Response#send()`.

## Крок 11.

```bash
git checkout step11
npm i
```

Додаємо метод `res.redirect()`.

## Крок 12.

```bash
git checkout step12
npm i
```

Розширюємо клас `Logger`, додаємо інтерфейс `LoggerMethod`, а також методи `Request#toString()`, `Response#toString()`.

## Крок 13.

```bash
git checkout step13
npm i
```

Додаємо властивість `Request#queryParams`.

## Крок 14.

```bash
git checkout step14
npm i
```

Переносимо із `Application` у `Request` та `Response` частину коду, яку можна налаштовувати через наслідування.
