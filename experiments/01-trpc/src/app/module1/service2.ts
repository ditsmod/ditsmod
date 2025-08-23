import { injectable } from '@ditsmod/core';
import { Service1 } from './service1.js';

@injectable()
export class Service2 {
  constructor(service1: Service1) {
    console.log('constructor of Service2 has:', service1);
  }

  hello() {
    return 'Hello, World!';
  }
}
