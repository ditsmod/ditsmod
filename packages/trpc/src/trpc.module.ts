import { featureModule } from '@ditsmod/core';
import { MyExtension } from './extensions/my-extension.js';

@featureModule({ extensions: [MyExtension] })
export class TrpcModule {}
