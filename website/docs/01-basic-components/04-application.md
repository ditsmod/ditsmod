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
- ... і т.п.

[Ditsmod надає API][4], що дозволяє додати підтримку необхідної архітектури. Такі пакети - більше, ніж звичайні модулі фіч, оскільки вони мають ще й **класи застосунків**, в яких прописано свій конфіг застосунку, своя послідовність збірки застосунку і т.д. Як правило, кожен із цих пакетів має свої особливості модулів фіч.

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
