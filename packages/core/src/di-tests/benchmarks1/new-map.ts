import 'reflect-metadata';
import { inspect } from 'util';

import { injectable, methodFactory, Provider, Injector, reflector } from '../../di';

@injectable()
class Class1 {}

function getClass2() {
  @injectable()
  class Class2 {
    constructor(class1: Class1) {}
  }

  return Class2;
}

const map1 = new Map(); // Static map
const Cls1 = class Storage {};
const Cls2 = class Storage {};
const itemsNum = 100;

console.time('set class1 prototype');
for (let i = 0; i < itemsNum; i++) {
  const class2 = getClass2();
  (Cls1 as any).prototype[i] = class2;
}
console.timeEnd('set class1 prototype');

console.time('set class2 prototype');
for (let i = 0; i < itemsNum; i++) {
  const class2 = getClass2();
  (Cls2 as any).prototype[Symbol()] = class2;
}
console.timeEnd('set class2 prototype');

for (let i = 0; i < itemsNum; i++) {
  const class2 = getClass2();
  map1.set(class2, class2);
}

const times = 10000;
console.time('new Map');
for (let i = 0; i < times; i++) {
  new Map(map1);
}
console.timeEnd('new Map');

console.time('copy Map');
for (let i = 0; i < times; i++) {
  const map2 = new Map();
  map1.forEach((val, key) => map2.set(key, val));
}
console.timeEnd('copy Map');

console.time('new class1');
for (let i = 0; i < times; i++) {
  new Cls1();
}
console.timeEnd('new class1');

console.time('new class2');
for (let i = 0; i < times; i++) {
  new Cls2();
}
console.timeEnd('new class2');
