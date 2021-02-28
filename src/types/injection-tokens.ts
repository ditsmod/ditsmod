import { InjectionToken } from '@ts-stack/di';

import { NodeRequest, NodeResponse } from './server-options';

export const NodeReqToken = new InjectionToken<NodeRequest>('NodeRequest');
export const NodeResToken = new InjectionToken<NodeResponse>('NodeResponse');
