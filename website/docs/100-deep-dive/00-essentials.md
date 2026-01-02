---
sidebar_position: 0
---

# Коротке ознайомлення

Як було сказано в [ознайомленні з класом застосунку][1], Ditsmod надає API для написання застосунків з різними архітектурними стилями (REST, tRPC, GraphQL, WebSockets, Microservices і т.д.). Ініціалізація застосунку відбувається зі створення інстансу класу застосунку, і саме на цьому етапі визначається яку конфігурацію приймає клас застосунку, і яка буде послідовність збірки затосунку.

Давайте розглянемо ініціалізацію REST-застосунку:

```ts {4} title="src/main.ts"
import { RestApplication } from '@ditsmod/rest';
import { AppModule } from './app/app.module.js';

const app = await RestApplication.create(AppModule, { bufferLogs: true, logLevel: 'info' });
app.server.listen(3000, '0.0.0.0');
```

Як бачите, першим аргументом в `RestApplication.create()` приймається `AppModule` - кореневий модуль застосунку

[1]: /basic-components/application/
