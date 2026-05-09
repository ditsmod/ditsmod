---
sidebar_position: 4
---

# Застосунок

Ditsmod дозволяє писати застосунки з різними архітектурними стилями:

- [REST][1]
- [REST testing][2]
- [tRPC][3]
- **GraphQL**
- **WebSockets**
- **Microservices**
- ...

[Ditsmod надає API][4], що дозволяє додати підтримку необхідної архітектури. Такі пакети - більше, ніж звичайні модулі фіч, оскільки вони мають ще й **клас застосунку** та **клас ініціалізатора застосунку**, в яких прописано конфіг застосунку, послідовність збірки застосунку і т.д. Як правило, кожен із таких пакетів має свої особливості щодо метаданих їхніх модулів. Окрім цього, якщо вебсервер застосунку має свої особливості роботи для різних **Runtimes** (Node, Bun, Deno і т.п.), Ditsmod дозволяє це враховувати саме на етапі ініціалізації класу застосунку.

Інстанс **класу застосунку**, як правило, створюється у файлі `main.ts`, і з нього починається робота застосунку. Наприклад, наступним чином створюється інстанс класу REST-застосунку:

```ts {4} title="src/main.ts"
import { RestApplication } from '@ditsmod/rest';
import { AppModule } from './app/app.module.js';

const app = await RestApplication.create(AppModule);
app.server.listen(3000, '0.0.0.0');
```

[1]: /rest-application/rest-module/
[2]: /rest-application/native-modules/testing/
[3]: /trpc-application/trpc-module/
[4]: /deep-dive/application-workflow/
