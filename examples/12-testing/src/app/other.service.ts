import { Injectable } from '@ts-stack/di';

@Injectable()
export class OtherService {
  constructor() {}

  async helloAdmin() {
    return 'Hello, admin!\n';
  }
}
