---
sidebar_position: 4
---

# Application

Ditsmod allows you to write applications using different architectural styles:

- [REST][1]
- [REST testing][2]
- [tRPC][3]
- **GraphQL**
- **WebSockets**
- **Microservices**
- ...

[Ditsmod provides an API][4] that allows adding support for the required architecture. Such packages are more than ordinary feature modules, since they also include an **application class** and an **application initializer class**, where the application configuration, the application build sequence, etc. are defined. As a rule, each of these packages has its own specifics regarding the metadata of their modules. In addition, if the application's web server has its own specifics of operation for different **Runtimes** (Node, Bun, Deno, etc.), Ditsmod allows taking this into account precisely at the stage of initializing the application class.

An instance of the **application class** is typically created in the `main.ts` file, and the application starts working from there. For example, an instance of a REST application class is created as follows:

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
