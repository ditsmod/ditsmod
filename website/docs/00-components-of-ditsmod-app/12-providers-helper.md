---
sidebar_position: 12
---

# Хелпер `Providers`

Даний клас спрощує додавання провайдерів до DI з одночасним контролем їх типів. Оскільки даний клас впроваджує так званий [Iteration protocols][1], це спрощує перетворення його на масив:

```ts
import { featureModule, Providers } from '@ditsmod/core';
// ...
@featureModule({
  // ...
  providersPerRou: [
    ...new Providers()
      .useValue<CorsOpts>(CorsOpts, { origin: 'https://example.com' }),
    // ...
  ],
  // ...
})
export class SomeModule {}
```





[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
