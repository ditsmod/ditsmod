import { Injectable } from '@ts-stack/di';

@Injectable()
export class SecondMultiProviderService {
  prop = 'from SecondModule'
}