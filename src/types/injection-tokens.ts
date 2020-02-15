import { InjectionToken } from 'ts-di';

import { NodeRequest, NodeResponse } from './types';

export const NodeReqToken = new InjectionToken<NodeRequest>('NodeRequest');
export const NodeResToken = new InjectionToken<NodeResponse>('NodeResponse');
