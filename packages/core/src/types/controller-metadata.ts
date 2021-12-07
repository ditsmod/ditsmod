import { AnyObj, ControllerType, DecoratorMetadata, HttpMethod, ServiceProvider } from './mix';

export interface ControllersMetadata1<CV extends AnyObj = AnyObj, MV extends AnyObj = AnyObj> {
  controller: ControllerType;
  /**
   * Controller decorators values.
   */
  ctrlDecorValues: CV[];
  methods: {
    [methodName: string]: DecoratorMetadata<MV>[];
  };
}

export interface ControllersMetadata2 {
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
