---
sidebar_position: 90
---

# Reflector

## Creating custom decorators {#creating-custom-decorators}

Using the `Reflector` class (do not confuse it with the standard [Reflect][1]), you can create a custom decorator at any level:

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

const metadata = Reflector.collectMetadata(Service1);
console.log(metadata);
```

This example demonstrates the creation of decorator factories at the class, property, and parameter levels. Since no transformers are passed to any factory here, the data passed to the factory will be returned as an array. In the next example, a simple transformer is passed to the decorator factory, which passes the single argument through unchanged:

```ts {3}
import { Reflector } from '@ditsmod/core/di';

const classLevel = Reflector.makeClassDecorator((obj: any) => obj);

@classLevel({ one: 1, two: 2 })
class Service1 {}

const metadata = Reflector.collectMetadata(Service1);
console.log(metadata?.constructor.decorators[0].value); // Print { one: 1, two: 2 }
```

Note that class-level metadata is attached to the `metadata.constructor` property.

The reflector stores metadata for the entire class inheritance chain:

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

const metadata = Reflector.collectMetadata(Child);
console.log(metadata?.constructor.paramChain);
```

In this example, the `Child` class extends the `Parent` class and overrides the type of the first constructor parameter. The highlighted line shows where the parameters for the entire class inheritance chain are stored - `metadata.constructor.paramChain`. The same applies to `metadata.constructor.decoratorChain`.

### Complex decorator types {#complex-decorator-types}

TypeScript can infer the type of a simple function passed to `Reflector.make*Decorator()`, which is intended for metadata transformation. If you need more complex types, you can declare the desired type of this function using an interface:

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

This shows how Ditsmod declares the type for the `inject` parameter decorator. In this case, the complexity of the types lies in the fact that the transformer function has two signatures, and TypeScript currently cannot infer more than one signature.

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect
