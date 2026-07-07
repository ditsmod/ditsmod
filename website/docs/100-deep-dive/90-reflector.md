---
sidebar_position: 90
---

# Рефлектор

## Створення кастомних декораторів {#creating-custom-decorators}

Використовуючи клас `Reflector` (не плутайте зі стандартним [Reflect][1]), ви можете створити кастомний декоратор на будь-якому рівні:

```ts
import { Reflector } from '@ditsmod/core/di';

const classLevel = Reflector.makeClassDecorator();
const propertyLevel = Reflector.makePropDecorator();
const parameterLevel = Reflector.makeParamDecorator();

@classLevel()
class Service1 {
  @propertyLevel()
  method1(@parameterLevel() param1: string) {}

  @propertyLevel()
  property1: string;
}

const metadata = Reflector.collectMeta(Service1);
console.log(metadata);
```

В даному прикладі показано, як створювати фабрики декораторів на рівні класу, властивостей та параметрів. Оскільки тут не передано трансформерів, фабрика просто повертає вхідні дані у вигляді масиву. В наступному прикладі для фабрики декораторів ми надамо простий трансформер, який повертає єдиний аргумент без змін:

```ts {3}
import { Reflector } from '@ditsmod/core/di';

const classLevel = Reflector.makeClassDecorator((obj: any) => obj);

@classLevel({ one: 1, two: 2 })
class Service1 {}

const metadata = Reflector.collectMeta(Service1);
console.log(metadata?.constructor.decorators[0].value); // Print { one: 1, two: 2 }
```

Зверніть увагу, що метадані на рівні класу прив'язуються до властивості `metadata.constructor`.

Рефлектор зберігає метадані всього ланцюжку наслідувань класів:

```ts {21}
import { Reflector } from '@ditsmod/core/di';

const classLevel = Reflector.makeClassDecorator((val?: string) => val);

class SomeService {}
class ExtendedService extends SomeService {}

@classLevel()
class Parent {
  constructor(param1: SomeService) {}
}

@classLevel()
class Child extends Parent {
  constructor(param1: ExtendedService) {
    super(param1);
  }
}

const metadata = Reflector.collectMeta(Child);
console.log(metadata?.constructor.paramChain);
```

В даному прикладі клас `Child` розширює клас `Parent` і перевизначає тип першого параметра в конструкторі. У виділеному рядку показано де зберігаються параметри для усього ланцюжка наслідувань класів - `metadata.constructor.paramChain`. Це саме стосується і `metadata.constructor.decoratorChain`.

### Складні типи декораторів {#complex-decorator-types}

TypeScript може вивести тип простої функції, що передається у `Reflector.make*Decorator()`, яка призначається для трансформації метаданих. Якщо вам потрібний більш складніші типи, ви можете оголосити бажаний тип цієї функції за допомогою інтерфейсу:

```ts {7-8}
const inject: InjectDecorator = Reflector.makeParamDecorator(
  (token, input?) => ({ token, input }) satisfies InjectTransformResult,
  'inject',
);

interface InjectDecorator {
  (token: NonNullable<unknown>): any;
  <T extends NonNullable<unknown>>(token: NonNullable<unknown>, input: T): any;
}

interface InjectTransformResult {
  token: NonNullable<unknown>;
  input?: NonNullable<unknown>;
}
```

Цей приклад показує, як Ditsmod оголошує типи для декоратора параметрів `inject`. Складність типів виникає через те, що функція-трансформер має кілька сигнатур, а TypeScript наразі не вміє виводити більше однієї сигнатури.

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect
