import { Type } from '@ts-stack/di';
import { AnyObj, DecoratorMetadata, HttpMethod, ServiceProvider } from './mix';

export interface ControllerMetadata1<CV extends AnyObj = AnyObj, MV extends AnyObj = AnyObj> {
  controller: Type<any>;
  /**
   * Controller decorators values.
   */
  ctrlDecorValues: CV[];
  methods: {
    [methodName: string]: DecoratorMetadata<MV>[];
  };
}

export interface ControllerMetadata2 {
  /**
   * Providers per a route.
   */
  providersPerRou: ServiceProvider[];
  /**
   * Providers per a request.
   */
  providersPerReq: ServiceProvider[];
  path: string;
  httpMethod: HttpMethod;
}
