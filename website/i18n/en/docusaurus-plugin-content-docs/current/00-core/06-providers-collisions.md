---
sidebar_position: 6
---

# Collision of providers

Imagine you have `Module1` where you imported `Module2` and `Module3`. You did this import because you need `Service2` and `Service3` from these modules, respectively. You are viewing how these services work, but for some reason `Service3` does not work as expected. You start debug and it turns out that `Service3` exports both modules: `Module2` and `Module3`. You expected that `Service3` would only be exported from `Module3`, but the version exported from `Module2` actually worked.

To prevent this from happening, if you import two or more modules that export non-identical providers with the same token, Ditsmod will throw the following error:

> Error: Importing providers to Module1 failed: exports from Module2 and Module3 causes collision with Service3. If Module1 declared in your application (it is not imported from node_modules), you should add Service3 to resolvedCollisionsPer* in Module1. For example: resolvedCollisionsPerReq: [ [Service3, Module3] ].

Specifically in this case:

1. `Module2` substitute and then exports the provider with the token `Service3`;
2. and `Module3` substitute and then exports the provider with the token `Service3`;
3. providers with token `Service3` are not identical in `Module2` and `Module3`, ie from module `Module2` can be exported, for example, object `{ provide: Service3, useValue: {} }`, and from `Module3``Service3` can be exported as a class.

And since both of these modules are imported into `Module1`, this causes a "provider collisions", because the developer may not know which of these substitutions will work in `Module1`.

## Collision resolution

If `Module3` is declared in your application (it is not imported from `node_modules`), the collision is resolved by adding to `resolvedCollisionsPer*` an array of two elements, with the provider's token in the first place and the module from which the provider needs to be taken in the second place:

```ts
import { Module2 } from './module2';
import { Module3, Service3 } from './module3';

@Module({
  imports: [Module2, Module3],
  resolvedCollisionsPerReq: [ [Service3, Module3] ]
})
export class Module1 {}
```

If you have installed `Module3` using packages manager (npm, yarn, etc.), there is no point in modifying this module locally to resolve the collision.

This situation can only occur if `Module2` and `Module3` are exported from the root module, so you need to remove one of these modules from there. And, of course, after that you will have to import another module where it is needed.
