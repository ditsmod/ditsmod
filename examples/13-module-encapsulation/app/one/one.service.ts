import { Injectable } from '@ts-stack/di';

@Injectable()
export class OneService {
  getHello(): string {
    return 'One service';
  }
}
