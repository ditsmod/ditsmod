---
sidebar_position: 9
---

# Provider Collisions

Imagine you have `Module3`, where you import `Module2` and `Module1`. You made these imports because you need `Provider2` and `Provider1` from these modules, respectively. You review the results of these providers’ operations, but for some reason, `Provider1` does not behave as expected. You start debugging and discover that `Provider1` is exported from both `Module2` and `Module1`. You expected `Provider1` to be exported only from `Module1`, but in reality, the version exported by `Module2` is being used:

```ts {8,14}
import { featureModule, rootModule } from '@ditsmod/core';

class Provider1 {}
class Provider2 {}

@featureModule({
  providersPerReq: [Provider1],
  exports: [Provider1]
})
class Module1 {}

@featureModule({
  providersPerReq: [{ token: Provider1, useValue: 'some value' }, Provider2],
  exports: [Provider1, Provider2],
})
class Module2 {}

@rootModule({
  imports: [Module1, Module2],
})
class Module3 {}
```

To prevent this, if you import two or more modules that export non-identical providers with the same token, Ditsmod will throw an error similar to this:

> Error: Importing providers to Module3 failed: exports from Module1, Module2 causes collision with Provider1. You should add Provider1 to resolvedCollisionsPerReq in this module. For example: resolvedCollisionsPerReq: [ [Provider1, Module1] ].

In this specific scenario:

1. `Module1` exports a provider with the token `Provider1`.
2. `Module2` overrides and then exports a provider with the token `Provider1`.
3. The providers with the token `Provider1` in `Module1` and `Module2` are not identical.

And because both of these modules are imported into `Module3`, a "provider collision" occurs, leaving the developer uncertain about which provider will be used in `Module3`.

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
