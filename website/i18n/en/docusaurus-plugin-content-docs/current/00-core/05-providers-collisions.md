---
sidebar_position: 5
---

# Collision of providers

Imagine you have `Module1` where you imported `Module2` and `Module3`. You did this import because
you need `Service2` and `Service3` from these modules, respectively. You are viewing how these
services work, but for some reason `Service3` does not work as expected. You start debug and it
turns out that `Service3` exports both modules: `Module2` and `Module3`. You expected that
`Service3` would only be exported from `Module3`, but the version exported from `Module2` actually
worked.

To prevent this from happening, if you import two or more modules that export providers with the
same token, Ditsmod will throw the following error:

> Error: Exporting providers in Module1 was failed: Collision was found for:
> Service3. You should manually add this provider to Module1.

Specifically in this case:

1. `Module2` substitute and then exports the provider with the token `Service3`;
2. and `Module3` substitute and then exports the provider with the token `Service3`.

And since both of these modules are imported into `Module1`, this causes a "provider collisions",
because the developer may not know which of these substitutions will work in `Module1`.

This error can be avoided by duplicating the provider's declaration at the desired level with the
same token:

```ts
import { Module2 } from './module2';
import { Module3, ServiceFromModule3 } from './module3';

@Module({
  imports: [Module2, Module3]
  providersPerReq: [{ provide: Service3, useClass: ServiceFromModule3 }]
})
export class Module1 {}
```

This way you explicitly resolve the conflict with `Service3`.
