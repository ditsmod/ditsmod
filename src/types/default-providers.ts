import { Provider } from 'ts-di';

import { Request } from '../request';
import { Response } from '../response';
import { BodyParser } from '../services/body-parser';
import { EntityManager } from '../services/entity-manager';

export const defaultProvidersPerReq: Provider[] = [Request, Response, BodyParser, EntityManager];
