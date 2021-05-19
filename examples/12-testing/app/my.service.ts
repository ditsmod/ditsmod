import { Injectable } from '@ts-stack/di';

import { OtherService } from './other.service';

@Injectable()
export class MyService {
  constructor(protected otherService: OtherService) {}

  async helloWorld() {
    return 'Hello, World!\n';
  }

  async helloAdmin() {
    return this.otherService.helloAdmin();
  }
}
