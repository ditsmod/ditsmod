import { inspect } from 'node:util';
import { Reflector } from './reflector.js';
import { ParentParams } from './parent-params.js';

const classDecoratorFactory = Reflector.makeClassDecorator((param) => param, 'decoratorForClass');
const propDecoratorFactory = Reflector.makePropDecorator((param) => param, 'decoratorForProp');
const paramDecoratorFactory = Reflector.makeParamDecorator((param) => param, 'decoratorForPapam');

class ClassBefore1Param1 {}
class ClassBefore1Param2 {}
class Class0Param1 {}
class Class0Param2 {}
class Class0Param3 {}
class Class1Param1 {}
class Class1Param2 {}
class Class2Param1 {}
class Class2Param2 {}
class Class3Param1 {}
class Class3Param2 {}

@classDecoratorFactory('constructorBefore1')
class ClassBefore1 {
  constructor(param1: ClassBefore1Param1, param2: ClassBefore1Param2) {}
}

@classDecoratorFactory('constructorBefore2')
class ClassBefore2 extends ClassBefore1 {
  constructor(parentParams: ParentParams) {
    // @ts-expect-error auto-injected
    super(...parentParams);
  }
}

@classDecoratorFactory('constructor0.1')
class Class0 extends ClassBefore2 {
  constructor(param1: Class0Param1, param2: Class0Param2, param3: Class0Param3) {
    super([param1, param2]);
  }
}

@classDecoratorFactory('constructor1.1')
class Class1 extends Class0 {
  constructor(param1: Class1Param1, param2: Class1Param2, parentParams: ParentParams) {
    // @ts-expect-error auto-injected
    super(...parentParams);
  }
}

@classDecoratorFactory('constructor2.1')
class Class2 extends Class1 {
  constructor(
    param1: Class2Param1,
    parentParams: ParentParams,
    @paramDecoratorFactory({ one: 1 }) param2: Class2Param2,
    parentParams2: ParentParams,
  ) {
    // @ts-expect-error auto-injected
    super(...parentParams);
  }

  @propDecoratorFactory('prop2.1')
  prop: string;
}

@classDecoratorFactory('constructor3.1')
class Class3 extends Class2 {
  constructor(parentParams: ParentParams, param1: Class3Param1, param2: Class3Param2) {
    // @ts-expect-error auto-injected
    super(...parentParams);
  }

  @propDecoratorFactory('prop3.1')
  declare prop: string;
}

const moduleMeta = Reflector.collectMetadata(Class3);
console.log(moduleMeta?.constructor.newParams);

console.log('*'.repeat(50), 'tokens and argsShape');

const { tokens, argsShape } = ParentParams.getTokensAndArgsShape([...moduleMeta!.constructor.newParams!.values()]);
console.log('tokens:', tokens);
console.log('argsShape:', inspect(argsShape, false, 5));

// tokens віддаєш у DI:
const results = tokens.map((token) => (Array.isArray(token) ? token[0] : token));

// а потім збираєш аргументи для Class3:
const class3Args = ParentParams.getArgs(argsShape, results);

console.log('='.repeat(50), 'args');
console.dir(class3Args, { depth: null });
