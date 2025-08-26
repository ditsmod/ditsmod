import { featureModule } from '@ditsmod/core';
import { TrpcExtension } from './extensions/trpc-extension.js';

@featureModule({ extensions: [{ extension: TrpcExtension, exportOnly: true }] })
export class TrpcModule {}
