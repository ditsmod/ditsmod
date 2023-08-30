---
sidebar_position: 9
---

# Collision of providers

Imagine you have `Module3` where you imported `Module2` and `Module1`. You did this import because you need `Service2` and `Service1` from these modules, respectively. You are viewing how these services work, but for some reason `Service1` does not work as expected. You start debug and it turns out that `Service1` exports both modules: `Module2` and `Module1`. You expected that `Service1` would only be exported from `Module1`, but the version exported from `Module2` actually worked.

To prevent this from happening, if you import two or more modules that export non-identical providers with the same token, Ditsmod will throw the following error:

> Error: Importing providers to Module3 failed: exports from Module2 and Module1 causes collision with Service1. If Module3 declared in your application (it is not imported from node_modules), you should add Service1 to resolvedCollisionsPer* in this module. For example: resolvedCollisionsPerReq: [ [Service1, Module1] ].

Specifically in this case:

1. `Module1` substitute and then exports the provider with the token `Service1`;
2. and `Module2` substitute and then exports the provider with the token `Service1`;
3. providers with token `Service1` are not identical in `Module1` and `Module2`, i.e. from `Module2` can be exported, for example, object `{ token: Service1, useValue: {} }`, and from `Module1` `Service1` can be exported as a class.

And since both of these modules are imported into `Module3`, this causes a "provider collisions", because the developer may not know which of these substitutions will work in `Module3`.

## Collision resolution

If `Module3` is declared in your application (it is not imported from `node_modules`), the collision is resolved by adding to `resolvedCollisionsPer*` an array of two elements, with the provider's token in the first place and the module from which the provider needs to be taken in the second place:

```ts {6}
import { Module1, Service1 } from './module1.js';
import { Module2 } from './module2.js';

@featureModule({
  imports: [Module2, Module1],
  resolvedCollisionsPerReq: [ [Service1, Module1] ]
})
export class Module3 {}
```

If you have installed `Module3` using packages manager (npm, yarn, etc.), there is no point in modifying this module locally to resolve the collision. This situation can only occur if `Module2` and `Module1` are exported from the root module, so you need to remove one of these modules from there. And, of course, after that you will have to explicitly import the deleted module into those modules where it is needed.
