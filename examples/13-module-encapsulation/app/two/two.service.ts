import { Injectable } from '@ts-stack/di';

import { OneService } from '../one/one.service';

@Injectable()
export class TwoService {
  constructor(private oneService: OneService) {}

  getHello(): string {
    return this.oneService.getHello();
  }
}
